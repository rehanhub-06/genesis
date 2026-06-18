"use client";

import { useState, useCallback, useRef } from "react";
import type { AppSchema, ClarificationResult, PipelineMetrics } from "@/types/schema";

export type StageStatus = "pending" | "running" | "done" | "error";

export interface PipelineStage {
  id: number;
  name: string;
  status: StageStatus;
  text: string;
  startedAt?: number;
  completedAt?: number;
}

const STAGE_NAMES = [
  "Intent Analysis",
  "Architecture Design",
  "Schema Generation",
  "Validation & Output",
];

function createInitialStages(): PipelineStage[] {
  return STAGE_NAMES.map((name, i) => ({
    id: i + 1,
    name,
    status: "pending" as StageStatus,
    text: "",
  }));
}

export interface UsePipelineStreamOptions {
  onComplete?: (metrics: PipelineMetrics, validationStats: any) => void;
}

export function usePipelineStream(options?: UsePipelineStreamOptions) {
  const [stages, setStages] = useState<PipelineStage[]>(createInitialStages());
  const [schema, setSchema] = useState<AppSchema | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clarification, setClarification] = useState<ClarificationResult | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const currentPromptRef = useRef<string>("");

  const updateStage = useCallback(
    (stageId: number, updates: Partial<PipelineStage>) => {
      setStages((prev) =>
        prev.map((s) => (s.id === stageId ? { ...s, ...updates } : s))
      );
    },
    []
  );

  const appendStageText = useCallback((stageId: number, chunk: string) => {
    setStages((prev) =>
      prev.map((s) =>
        s.id === stageId ? { ...s, text: s.text + chunk } : s
      )
    );
  }, []);

  const reset = useCallback(() => {
    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setStages(createInitialStages());
    setSchema(null);
    setIsRunning(false);
    setError(null);
    setClarification(null);
  }, []);

  const startPipeline = useCallback(
    (prompt: string, isResuming = false) => {
      const savedKey = typeof window !== "undefined" ? localStorage.getItem("genesis_api_key") : null;
      if (!savedKey || savedKey.trim().length === 0) {
        setError("Missing Gemini API Key. Please enter your Gemini API Key in the top navigation bar of the studio page to continue.");
        setIsRunning(false);
        return;
      }

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (!isResuming) {
        setStages(createInitialStages());
        setSchema(null);
      }
      setIsRunning(true);
      setError(null);
      setClarification(null);
      currentPromptRef.current = prompt;

      const url = `/api/generate?prompt=${encodeURIComponent(prompt)}`;
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.addEventListener("stage_start", (e) => {
        try {
          const data = JSON.parse(e.data);
          const stageId = data.stage as number;
          updateStage(stageId, {
            status: "running",
            startedAt: Date.now(),
            text: "", // Clear text for this stage as it starts fresh
          });
        } catch {
          // skip malformed data
        }
      });

      es.addEventListener("chunk", (e) => {
        try {
          const data = JSON.parse(e.data);
          const stageId = data.stage as number;
          const text = data.text as string;
          appendStageText(stageId, text);
        } catch {
          // skip
        }
      });

      es.addEventListener("validation_start", (e) => {
        try {
          const data = JSON.parse(e.data);
          const stageId = data.stage as number;
          updateStage(stageId, { status: "running", startedAt: Date.now() });
        } catch {
          // skip
        }
      });

      es.addEventListener("complete", (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.schema) {
            setSchema(data.schema as AppSchema);
          }
          if (data.metrics && options?.onComplete) {
            options.onComplete(data.metrics, data.validationStats);
          }
          // Mark all stages as done
          setStages((prev) =>
            prev.map((s) =>
              s.status === "running" || s.status === "pending"
                ? { ...s, status: "done", completedAt: Date.now() }
                : s
            )
          );
        } catch {
          // skip
        }
        setIsRunning(false);
        es.close();
      });

      es.addEventListener("error", (e) => {
        if (e instanceof MessageEvent) {
          try {
            const data = JSON.parse(e.data);
            setError(data.message || "Pipeline error occurred");
            const stageId = data.stage as number;
            if (stageId) {
              updateStage(stageId, { status: "error" });
            }
          } catch {
            setError("Connection lost");
          }
        } else {
          setError("Connection to pipeline lost");
        }
        setIsRunning(false);
        es.close();
      });

      es.addEventListener("clarification_needed", (e) => {
        try {
          const data = JSON.parse(e.data);
          setClarification(data as ClarificationResult);
          // Clean up raw streamed questions from the first stage card
          updateStage(1, {
            status: "pending",
            text: "Clarification required from user."
          });
        } catch {
          // skip
        }
        setIsRunning(false);
        es.close();
      });
    },
    [reset, updateStage, appendStageText]
  );

  const retryStage = useCallback(() => {
    if (currentPromptRef.current && !isRunning) {
      startPipeline(currentPromptRef.current, false);
    }
  }, [isRunning, startPipeline]);

  return {
    stages,
    schema,
    isRunning,
    error,
    clarification,
    startPipeline,
    retryStage,
    reset,
  };
}

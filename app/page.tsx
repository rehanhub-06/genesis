"use client";

import React, { useState, useCallback } from "react";
import type { PipelineMetrics } from "@/types/schema";

import PromptInput from "@/components/ui/PromptInput";
import PromptHistory from "@/components/ui/PromptHistory";
import ModifyRequirement from "@/components/ui/ModifyRequirement";
import PipelineContainer from "@/components/ui/PipelineContainer";
import RuntimeContainer from "@/components/ui/RuntimeContainer";
import MetricsDashboard from "@/components/ui/MetricsDashboard";
import ClarificationDialog from "@/components/ui/ClarificationDialog";
import SplashScreen from "@/components/ui/SplashScreen";

import { usePipelineStream } from "@/hooks/usePipelineStream";
import { usePromptHistory } from "@/hooks/usePromptHistory";

export default function HomePage() {
  const [splashDismissed, setSplashDismissed] = useState(false);

  const {
    stages,
    schema,
    isRunning,
    error,
    clarification,
    startPipeline,
    retryStage,
    reset,
  } = usePipelineStream({
    onComplete: (newMetrics) => {
      setMetrics((prev) => [...prev, newMetrics]);
    }
  });

  const { history, addPrompt, clearHistory } = usePromptHistory();
  const [metrics, setMetrics] = useState<PipelineMetrics[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState("");

  const handleGenerate = useCallback(
    (prompt: string) => {
      setCurrentPrompt(prompt);
      addPrompt(prompt);
      startPipeline(prompt);
    },
    [addPrompt, startPipeline]
  );

  const handleModify = useCallback(
    (modification: string) => {
      const newPrompt = `${currentPrompt}. Additionally: ${modification}`;
      handleGenerate(newPrompt);
    },
    [currentPrompt, handleGenerate]
  );

  const handleClarificationSubmit = useCallback(
    (answers: Record<string, string>) => {
      const answerText = Object.entries(answers)
        .map(([, a]) => a)
        .join(". ");
      const refined = `${currentPrompt}. ${answerText}`;
      setCurrentPrompt(refined);
      addPrompt(refined);
      startPipeline(refined, true);
    },
    [currentPrompt, addPrompt, startPipeline]
  );

  const handleHistorySelect = useCallback(
    (prompt: string) => {
      handleGenerate(prompt);
    },
    [handleGenerate]
  );

  return (
    <>
      <SplashScreen onDismiss={() => setSplashDismissed(true)} />

      {splashDismissed && (
        <div className="flex flex-col h-screen overflow-hidden bg-[#09090b] text-yellow-50">
          {/* Background Ambient Glow */}
          <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-yellow-500/[0.03] rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-yellow-600/[0.02] rounded-full blur-[100px]" />
          </div>

          <PromptHistory
            history={history}
            onSelect={handleHistorySelect}
            onClear={clearHistory}
          />

          {/* Top Navbar */}
          <header className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-yellow-500/10 bg-[#09090b]/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.3)]">
                <svg className="w-5 h-5 text-zinc-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold tracking-tight">
                <span className="gradient-text">Genesis</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              {(schema || error) && (
                <button
                  onClick={reset}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-900 bg-yellow-500 hover:bg-yellow-400 rounded-lg shadow-[0_0_15px_rgba(250,204,21,0.2)] transition-all duration-200"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset Studio
                </button>
              )}
            </div>
          </header>

          {/* Main 25/75 Grid Layout */}
          <main className="relative z-10 flex-1 min-h-0 p-4">
            <div className="h-full grid grid-cols-4 gap-4">
              
              {/* Left Column: 25% (Pipeline + Prompt) */}
              <div className="col-span-1 flex flex-col gap-4 min-h-0">
                <div className="flex-1 bg-zinc-900/50 backdrop-blur-md border border-yellow-500/10 rounded-2xl p-4 overflow-hidden shadow-2xl flex flex-col relative">
                  <PipelineContainer
                    stages={stages}
                    isRunning={isRunning}
                    error={error}
                    onRetry={() => retryStage ? retryStage() : handleGenerate(currentPrompt)}
                  />
                </div>
                
                <div className="flex-shrink-0 bg-zinc-900/50 backdrop-blur-md border border-yellow-500/10 rounded-2xl p-4 shadow-2xl">
                  <PromptInput onSubmit={handleGenerate} isRunning={isRunning} />
                  {schema && (
                    <div className="mt-3">
                      <ModifyRequirement
                        onUpdate={handleModify}
                        isRunning={isRunning}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: 75% (Runtime + Metrics) */}
              <div className="col-span-3 flex flex-col gap-4 min-h-0">
                <div className="flex-1 bg-zinc-900/50 backdrop-blur-md border border-yellow-500/10 rounded-2xl p-4 overflow-hidden shadow-2xl">
                  {/* If running and no schema, show the 3D antigravity loader */}
                  {isRunning && !schema ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                       <div className="w-20 h-20 animate-antigravity mb-8" />
                       <p className="text-yellow-500/70 font-mono text-sm tracking-widest uppercase animate-pulse">Synthesizing Architecture...</p>
                    </div>
                  ) : (
                    <RuntimeContainer schema={schema} />
                  )}
                </div>
                
                <div className="flex-shrink-0 h-40 bg-zinc-900/50 backdrop-blur-md border border-yellow-500/10 rounded-2xl p-4 shadow-2xl">
                  <MetricsDashboard metrics={metrics} />
                </div>
              </div>

            </div>
          </main>

          {/* Clarification Modal */}
          {clarification && clarification.isTooVague && (
            <ClarificationDialog
              clarification={clarification}
              onSubmit={handleClarificationSubmit}
              onDismiss={reset}
            />
          )}
        </div>
      )}
    </>
  );
}

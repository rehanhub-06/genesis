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
  const [showAssumptions, setShowAssumptions] = useState(false);

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
      setShowAssumptions(false); // Reset assumptions state on new run
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
      setShowAssumptions(false);
    },
    [currentPrompt, addPrompt, startPipeline]
  );

  const handleHistorySelect = useCallback(
    (prompt: string) => {
      handleGenerate(prompt);
    },
    [handleGenerate]
  );

  const handleReset = useCallback(() => {
    reset();
    setShowAssumptions(false);
  }, [reset]);

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
              {schema?.assumptions && schema.assumptions.length > 0 && (
                <button
                  onClick={() => setShowAssumptions(!showAssumptions)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-lg transition-all duration-200 cursor-pointer shadow-md"
                >
                  <svg className="w-3.5 h-3.5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Assumptions ({schema.assumptions.length})
                </button>
              )}

              {(schema || error) && (
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-900 bg-yellow-500 hover:bg-yellow-400 rounded-lg shadow-[0_0_15px_rgba(250,204,21,0.2)] transition-all duration-200 cursor-pointer"
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
              onDismiss={handleReset}
            />
          )}

          {/* Assumptions Modal */}
          {showAssumptions && schema?.assumptions && schema.assumptions.length > 0 && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#09090b]/80 backdrop-blur-sm">
              <div className="w-full max-w-lg bg-zinc-950 border border-yellow-500/20 rounded-2xl p-6 shadow-2xl animate-fade-in-up relative z-50">
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <h3 className="text-base font-bold text-white">System Generation Assumptions</h3>
                  </div>
                  <button
                    onClick={() => setShowAssumptions(false)}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  <p className="text-xs text-slate-400">
                    To bridge requirements gaps in your prompt, the AI made these design decisions and assumptions:
                  </p>
                  <div className="space-y-3">
                    {schema.assumptions.map((item, idx) => (
                      <div key={idx} className="bg-white/[0.02] border border-white/[0.04] p-3.5 rounded-xl space-y-1.5 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold tracking-wider uppercase text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded">
                            {item.field || "General"}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-200">
                          {item.assumed}
                        </p>
                        <p className="text-xs text-slate-400">
                          <span className="font-semibold text-slate-300">Reason:</span> {item.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowAssumptions(false)}
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 text-xs font-semibold rounded-lg shadow-md transition-all duration-200 cursor-pointer"
                  >
                    Got it, close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

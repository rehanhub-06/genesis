"use client";

import React from "react";
import type { PipelineStage } from "@/hooks/usePipelineStream";
import StageCard from "@/components/ui/StageCard";

interface PipelineContainerProps {
  stages: PipelineStage[];
  isRunning: boolean;
  error: string | null;
  onRetry?: () => void;
}

export default function PipelineContainer({
  stages,
  isRunning,
  error,
  onRetry,
}: PipelineContainerProps) {
  const completedCount = stages.filter((s) => s.status === "done").length;
  const totalStages = stages.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 flex items-center justify-center">
            <svg
              className="w-3.5 h-3.5 text-yellow-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-white">Pipeline</h2>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          {isRunning && (
            <span className="flex items-center gap-1.5 text-[10px] text-yellow-400">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              Processing
            </span>
          )}
          <span className="text-[10px] text-slate-500 font-mono">
            {completedCount}/{totalStages}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/5 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${(completedCount / totalStages) * 100}%` }}
        />
      </div>

      {/* Stage cards */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {stages.map((stage) => (
          <StageCard
            key={stage.id}
            stageNumber={stage.id}
            name={stage.name}
            status={stage.status}
            text={stage.text}
          />
        ))}
      </div>

      {/* Error message & Retry */}
      {error && (
        <div className="mt-3 px-4 py-3 bg-red-950/40 border border-red-500/20 rounded-xl animate-fade-in-up">
          <div className="flex items-start gap-2 mb-3">
            <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-red-300">{error}</p>
          </div>
          {onRetry && (
            <button 
              onClick={onRetry}
              className="w-full py-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Auto-Retry Stage
            </button>
          )}
        </div>
      )}
    </div>
  );
}

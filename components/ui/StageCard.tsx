"use client";

import React, { useRef, useEffect } from "react";
import type { StageStatus } from "@/hooks/usePipelineStream";

interface StageCardProps {
  stageNumber: number;
  name: string;
  status: StageStatus;
  text: string;
}

const STATUS_CONFIG: Record<
  StageStatus,
  { icon: string; label: string; color: string; bg: string }
> = {
  pending: {
    icon: "○",
    label: "Pending",
    color: "text-slate-500",
    bg: "bg-slate-500/10",
  },
  running: {
    icon: "⟳",
    label: "Running",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
  done: {
    icon: "✓",
    label: "Complete",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  error: {
    icon: "✗",
    label: "Error",
    color: "text-red-400",
    bg: "bg-red-500/10",
  },
};

export default function StageCard({ stageNumber, name, status, text }: StageCardProps) {
  const codeRef = useRef<HTMLPreElement>(null);
  const config = STATUS_CONFIG[status];

  // Auto-scroll to bottom when streaming
  useEffect(() => {
    if (codeRef.current && status === "running") {
      codeRef.current.scrollTop = codeRef.current.scrollHeight;
    }
  }, [text, status]);

  return (
    <div
      className={`bg-white/[0.02] border rounded-xl overflow-hidden transition-all duration-300 ${
        status === "running"
          ? "border-yellow-500/20 shadow-lg shadow-yellow-500/5"
          : status === "error"
          ? "border-red-500/20"
          : status === "done"
          ? "border-emerald-500/10"
          : "border-white/[0.05]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-bold text-slate-400">
            {stageNumber}
          </span>
          <span className="text-sm font-medium text-slate-200">{name}</span>
        </div>

        {/* Status badge */}
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium ${config.color} ${config.bg} transition-all duration-300`}
        >
          <span
            className={`${
              status === "running" ? "animate-spin-slow inline-block" : ""
            }`}
          >
            {config.icon}
          </span>
          {config.label}
        </span>
      </div>

      {/* Streaming output */}
      {(text || status === "running") && (
        <pre
          ref={codeRef}
          className="px-4 py-3 text-[11px] font-mono text-slate-400 leading-relaxed max-h-40 overflow-y-auto"
        >
          {text || (
            <span className="inline-flex items-center gap-1">
              <span className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" />
              <span className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
              <span className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
            </span>
          )}
          {status === "running" && (
            <span className="inline-block w-[2px] h-3.5 bg-yellow-400 ml-0.5 animate-pulse align-middle" />
          )}
        </pre>
      )}

      {/* Progress indicator for running state */}
      {status === "running" && (
        <div className="h-[2px] bg-white/5">
          <div className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 animate-gradient rounded-full" style={{ width: "60%" }} />
        </div>
      )}
    </div>
  );
}

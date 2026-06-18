"use client";

import React, { useMemo, useState } from "react";
import type { PipelineMetrics } from "@/types/schema";

interface MetricsDashboardProps {
  metrics: PipelineMetrics[];
}

export default function MetricsDashboard({ metrics }: MetricsDashboardProps) {
  const [showLatencyPopover, setShowLatencyPopover] = useState(false);

  const computed = useMemo(() => {
    const total = metrics.length;
    const successCount = metrics.filter((m) => m.success).length;
    
    // Latency
    const avgLatencyMs = total > 0
      ? metrics.reduce((s, m) => s + m.latencyMs, 0) / total
      : 0;
    const avgLatencySec = (avgLatencyMs / 1000).toFixed(2);

    // Real validation stats from latest run
    let passedChecks = 0;
    let issuesFound = 0;
    let autoRepaired = 0;

    const latest = total > 0 ? metrics[total - 1] : null;
    
    if (latest?.validationStats) {
      issuesFound = latest.validationStats.issuesFound;
      autoRepaired = latest.validationStats.autoRepaired;
      passedChecks = latest.validationStats.passedChecks;
    }

    // Real prompt types count
    const typesCount = metrics.reduce(
      (acc, m) => {
        if (m.promptType === "vague") acc.vague++;
        else if (m.promptType === "conflicting") acc.conflicting++;
        else acc.normal++;
        return acc;
      },
      { normal: 0, vague: 0, conflicting: 0 }
    );

    return { total, successCount, avgLatencySec, latest, passedChecks, issuesFound, autoRepaired, typesCount };
  }, [metrics]);

  return (
    <div className="h-full flex flex-col justify-between animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 rounded-md bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
          <svg className="w-3 h-3 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2 className="text-xs font-semibold text-yellow-100">Telemetry</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
        {/* Left: Validation Results */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 flex flex-col justify-center">
          <h3 className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Validation Results</h3>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-emerald-400 flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                Passed Checks
              </span>
              <span className="font-mono text-slate-300">{computed.passedChecks}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-red-400 flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                Issues Found
              </span>
              <span className="font-mono text-slate-300">{computed.issuesFound}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-blue-400 flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                Auto-Repaired
              </span>
              <span className="font-mono text-slate-300">{computed.autoRepaired}</span>
            </div>
          </div>
        </div>

        {/* Middle: Type of Prompts */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 flex flex-col justify-center">
          <h3 className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Type of Prompts</h3>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-emerald-400 flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                Normal
              </span>
              <span className="font-mono text-slate-300">{computed.typesCount.normal}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-yellow-400 flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                Vague
              </span>
              <span className="font-mono text-slate-300">{computed.typesCount.vague}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-red-400 flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Conflicting
              </span>
              <span className="font-mono text-slate-300">{computed.typesCount.conflicting}</span>
            </div>
          </div>
        </div>

        {/* Right: Latency & Success */}
        <div className="flex gap-4">
          <div className="flex-1 bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 flex flex-col justify-center">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Success Rate</p>
            <p className="text-xl font-bold text-yellow-500">{computed.successCount}/{computed.total}</p>
          </div>
          
          <div 
            className="flex-1 bg-white/[0.02] border border-yellow-500/10 rounded-xl p-3 flex flex-col justify-center relative cursor-help hover:bg-white/[0.04] transition-colors"
            onMouseEnter={() => setShowLatencyPopover(true)}
            onMouseLeave={() => setShowLatencyPopover(false)}
          >
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Avg Latency</p>
            <p className="text-xl font-bold text-yellow-500">{computed.avgLatencySec}s</p>

            {/* Latency Popover */}
            {showLatencyPopover && computed.latest?.stageTimings && (
              <div className="absolute bottom-full right-0 mb-2 w-64 bg-zinc-950 border border-yellow-500/20 rounded-lg p-3 shadow-2xl z-50 animate-fade-in-up">
                <div className="text-xs font-mono text-slate-400 border-b border-white/10 pb-2 mb-2">
                  ┌─────────────────────────────┐<br/>
                  │ Current Generation          │<br/>
                  ├─────────────────────────────┤
                </div>
                <div className="space-y-1 font-mono text-xs">
                  {Object.entries(computed.latest.stageTimings).map(([stage, ms]) => (
                    <div key={stage} className="flex justify-between">
                      <span className="text-slate-300">│ {stage.padEnd(14, ' ')}</span>
                      <span className="text-yellow-400">✓ {ms}ms      │</span>
                    </div>
                  ))}
                </div>
                <div className="text-xs font-mono text-slate-400 border-t border-white/10 mt-2 pt-1">
                  └─────────────────────────────┘
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

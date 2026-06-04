"use client";

import React, { useState } from "react";
import type { PromptHistoryEntry } from "@/hooks/usePromptHistory";

interface PromptHistoryProps {
  history: PromptHistoryEntry[];
  onSelect: (prompt: string) => void;
  onClear: () => void;
}

export default function PromptHistorySidebar({ history, onSelect, onClear }: PromptHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (history.length === 0) return null;

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMin = Math.floor(diffMs / 60000);

      if (diffMin < 1) return "Just now";
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDay = Math.floor(diffHr / 24);
      return `${diffDay}d ago`;
    } catch {
      return "";
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-zinc-900 border border-yellow-500/20 text-yellow-500 p-2 rounded-r-xl shadow-[0_0_15px_rgba(250,204,21,0.15)] hover:bg-zinc-800 transition-all duration-300"
      >
        <svg
          className={`w-5 h-5 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <div
        className={`fixed left-0 top-0 bottom-0 w-80 bg-zinc-950/95 backdrop-blur-2xl border-r border-yellow-500/10 shadow-[20px_0_40px_rgba(0,0,0,0.5)] z-50 transition-transform duration-500 cubic-bezier-[0.16,1,0.3,1] flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-sm font-semibold text-yellow-100">History</h2>
          </div>
          <button
            onClick={() => {
              onClear();
              setIsOpen(false);
            }}
            className="text-[10px] uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors"
          >
            Clear
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {history.map((entry) => (
            <button
              key={entry.id}
              onClick={() => {
                onSelect(entry.prompt);
                setIsOpen(false);
              }}
              className="w-full text-left p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-yellow-500/[0.05] hover:border-yellow-500/20 transition-all duration-200 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/0 to-yellow-500/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <p className="text-xs text-slate-300 group-hover:text-yellow-100 line-clamp-3 transition-colors relative z-10 leading-relaxed">
                {entry.prompt}
              </p>
              <p className="text-[10px] text-yellow-600/50 mt-2 font-mono relative z-10">
                {formatTime(entry.timestamp)}
              </p>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

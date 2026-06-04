"use client";

import React, { useState } from "react";

interface ModifyRequirementProps {
  onUpdate: (modification: string) => void;
  isRunning?: boolean;
}

export default function ModifyRequirement({ onUpdate, isRunning = false }: ModifyRequirementProps) {
  const [value, setValue] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isRunning) return;
    onUpdate(trimmed);
    setValue("");
    setIsExpanded(false);
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Modify
      </button>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3">
        <div className="flex items-start gap-2">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Add requirements, change features, or refine the app…"
            rows={2}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all duration-200"
            autoFocus
          />
          <div className="flex flex-col gap-1.5">
            <button
              onClick={handleSubmit}
              disabled={!value.trim() || isRunning}
              className="px-3 py-1.5 text-xs font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              Update
            </button>
            <button
              onClick={() => {
                setIsExpanded(false);
                setValue("");
              }}
              className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

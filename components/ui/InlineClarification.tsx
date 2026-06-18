"use client";

import React, { useState, useEffect } from "react";
import type { ClarificationResult } from "@/types/schema";

interface InlineClarificationProps {
  clarification: ClarificationResult;
  onSubmit: (answers: Record<string, string>) => void;
  onDismiss: () => void;
  originalPrompt?: string;
}

export default function InlineClarification({
  clarification,
  onSubmit,
  onDismiss,
  originalPrompt = "",
}: InlineClarificationProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Reset answers when clarification changes
  useEffect(() => {
    const init: Record<string, string> = {};
    clarification.questions.forEach((_, i) => {
      init[`q${i}`] = "";
    });
    setAnswers(init);
  }, [clarification]);

  const handleSubmit = () => {
    onSubmit(answers);
  };

  const allAnswered = Object.values(answers).every((v) => v && v.trim().length > 0);

  return (
    <div className="mb-4 bg-yellow-500/[0.02] border border-yellow-500/20 rounded-xl p-4 animate-fade-in-up space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
        <div className="flex items-center gap-1.5 text-yellow-400">
          <svg className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-wider">Clarification Needed</span>
        </div>
        <button
          onClick={onDismiss}
          className="text-slate-500 hover:text-slate-300 text-xs transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>

      {/* User Input Context */}
      {originalPrompt && (
        <div className="bg-white/[0.02] border border-white/[0.04] p-2.5 rounded-lg text-[11px] leading-relaxed">
          <span className="font-bold text-yellow-500/80 uppercase tracking-widest block text-[9px] mb-0.5">Your Prompt:</span>
          <p className="text-slate-300 italic">"{originalPrompt}"</p>
        </div>
      )}

      {/* Questions with inputs */}
      <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
        {clarification.questions.map((question, i) => (
          <div key={i} className="space-y-1 text-left">
            <label className="block text-[11px] font-semibold text-slate-300 leading-normal">
              <span className="text-blue-400 mr-1">Q{i + 1}.</span>
              {question}
            </label>
            <textarea
              value={answers[`q${i}`] || ""}
              onChange={(e) =>
                setAnswers((prev) => ({
                  ...prev,
                  [`q${i}`]: e.target.value,
                }))
              }
              rows={2}
              placeholder="Type your answer…"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-yellow-500/30 focus:ring-1 focus:ring-yellow-500/10 transition-all duration-200"
            />
          </div>
        ))}

        {/* Suggestions */}
        {clarification.suggestions && clarification.suggestions.length > 0 && (
          <div className="pt-2 border-t border-white/[0.04]">
            <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1 font-medium">Suggestions</p>
            <div className="flex flex-wrap gap-1">
              {clarification.suggestions.map((suggestion, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] rounded"
                >
                  {suggestion}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Submit */}
      <button
        onClick={handleSubmit}
        disabled={!allAnswered}
        className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 text-xs font-bold rounded-lg transition-all duration-200 shadow-md shadow-yellow-500/10"
      >
        Resubmit with Answers
      </button>
    </div>
  );
}

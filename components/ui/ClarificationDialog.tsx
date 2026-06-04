"use client";

import React, { useState } from "react";
import type { ClarificationResult } from "@/types/schema";

interface ClarificationDialogProps {
  clarification: ClarificationResult;
  onSubmit: (answers: Record<string, string>) => void;
  onDismiss: () => void;
}

export default function ClarificationDialog({
  clarification,
  onSubmit,
  onDismiss,
}: ClarificationDialogProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    clarification.questions.forEach((_, i) => {
      init[`q${i}`] = "";
    });
    return init;
  });

  const handleSubmit = () => {
    onSubmit(answers);
  };

  const allAnswered = Object.values(answers).every((v) => v.trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in-up">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onDismiss}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg mx-4 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
        {/* Top gradient accent */}
        <div className="h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

        {/* Header */}
        <div className="px-6 pt-5 pb-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500/10 rounded-xl flex-shrink-0">
              <svg
                className="w-5 h-5 text-amber-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Clarification Needed
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Your prompt needs a bit more detail. Please answer the questions below to continue.
              </p>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="px-6 pb-4 space-y-4 max-h-[50vh] overflow-y-auto">
          {clarification.questions.map((question, i) => (
            <div key={i}>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
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
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all duration-200"
              />
            </div>
          ))}

          {/* Suggestions */}
          {clarification.suggestions && clarification.suggestions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/[0.05]">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-medium">
                Suggestions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {clarification.suggestions.map((suggestion, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] rounded-lg"
                  >
                    {suggestion}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-end gap-3 bg-white/[0.01]">
          <button
            onClick={onDismiss}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-lg transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className="px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-blue-500/20"
          >
            Resubmit with Answers
          </button>
        </div>
      </div>
    </div>
  );
}

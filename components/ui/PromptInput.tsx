"use client";

import React, { useState, useRef, useCallback } from "react";

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isRunning?: boolean;
}

export default function PromptInput({ onSubmit, isRunning = false }: PromptInputProps) {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isRunning) return;
    onSubmit(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, isRunning, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // Auto-resize textarea
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, []);

  return (
    <div className="relative animate-fade-in-up w-full">
      <div
        className={`relative rounded-3xl transition-all duration-300 border ${
          isFocused
            ? "bg-zinc-900 shadow-[0_0_20px_rgba(250,204,21,0.15)] border-yellow-500/40"
            : "bg-zinc-900/80 hover:bg-zinc-900 border-white/[0.08]"
        }`}
      >
        <div className="flex items-end px-4 py-2">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="describe the app u wanna create"
            rows={1}
            disabled={isRunning}
            className="flex-1 bg-transparent text-base text-slate-200 placeholder-slate-400 resize-none outline-none focus:outline-none focus-visible:outline-none min-h-[44px] max-h-[160px] py-2.5 px-2 disabled:opacity-50"
          />

          {/* Submit button */}
          <div className="pb-1.5">
            <button
              onClick={handleSubmit}
              disabled={!value.trim() || isRunning}
              className="flex-shrink-0 w-10 h-10 ml-2 rounded-full bg-yellow-500 hover:bg-yellow-400 text-zinc-950 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-yellow-500/20"
            >
              {isRunning ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

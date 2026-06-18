"use client";

import React, { useMemo } from "react";

interface ErrorDialogProps {
  error: string;
  onDismiss: () => void;
  onRetry?: () => void;
}

export default function ErrorDialog({ error, onDismiss, onRetry }: ErrorDialogProps) {
  const humanReadableError = useMemo(() => {
    const errLower = error.toLowerCase();
    
    if (errLower.includes("api key") || errLower.includes("apikey") || errLower.includes("key not found")) {
      return {
        title: "API Key Credentials Issue",
        description: "The pipeline could not authenticate with the Gemini service. This usually happens if the API key is missing, invalid, or expired.",
        actionableAdvice: "Please enter a valid Gemini API key in the top navigation bar of the studio page and try again.",
        severity: "warning"
      };
    }
    
    if (errLower.includes("rate limit") || errLower.includes("quota exceeded") || errLower.includes("429")) {
      return {
        title: "Rate Limit Exceeded",
        description: "The Gemini API rate limit or quota has been reached for your key.",
        actionableAdvice: "Please wait a moment before retrying, or check if your API key quota has been exhausted.",
        severity: "warning"
      };
    }

    if (errLower.includes("connection lost") || errLower.includes("lost connection") || errLower.includes("network")) {
      return {
        title: "Network Connection Lost",
        description: "The background connection stream to the app generator server was interrupted.",
        actionableAdvice: "Check your internet connection and try restarting or retrying the pipeline stage.",
        severity: "error"
      };
    }

    if (errLower.includes("validation") || errLower.includes("zod") || errLower.includes("schema") || errLower.includes("json")) {
      return {
        title: "AI Synthesis Error",
        description: "The AI successfully generated app ideas, but the resulting JSON data structure had validation errors or was malformed.",
        actionableAdvice: "You can click 'Auto-Retry Stage' below to let the recovery agent resolve the structure, or tweak your prompt to be slightly more specific.",
        severity: "error"
      };
    }

    // Default fallback
    return {
      title: "Pipeline Generation Interrupted",
      description: error,
      actionableAdvice: "Tweak your requirement prompt slightly or trigger an Auto-Retry on this stage.",
      severity: "error"
    };
  }, [error]);

  const extractedAdvice = useMemo(() => {
    let clean = error;
    
    // Remove "Error:" or similar prefixes if present
    if (clean.toLowerCase().startsWith("error:")) {
      clean = clean.substring(6).trim();
    }
    
    // Try to extract the most descriptive part of the message (after the last colon)
    const colonIndex = clean.lastIndexOf(":");
    if (colonIndex !== -1 && colonIndex < clean.length - 1) {
      const candidate = clean.substring(colonIndex + 1).trim();
      if (candidate.length > 4) {
        clean = candidate;
      }
    }
    
    // Clean up typical JSON wrapper characters or extra quotes
    clean = clean.replace(/^[{"'\s]+|[}"'\s]+$/g, "");
    
    // Capitalize first letter
    if (clean.length > 0) {
      clean = clean.charAt(0).toUpperCase() + clean.slice(1);
    }
    
    return clean;
  }, [error]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in-up">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#09090b]/80 backdrop-blur-sm"
        onClick={onDismiss}
      />

      {/* Dialog container */}
      <div className="relative w-full max-w-md bg-zinc-950 border border-red-500/20 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden z-55 animate-fade-in-up">
        {/* Top gradient alert line */}
        <div className="h-1 bg-gradient-to-r from-red-500 via-yellow-500 to-red-500" />

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Alarm Icon */}
            <div className="p-2.5 bg-red-500/10 rounded-xl flex-shrink-0 border border-red-500/20">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white tracking-tight">
                {humanReadableError.title}
              </h3>
              <span className="inline-block text-[9px] font-mono tracking-wider uppercase bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded">
                Generation Failure
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <p className="text-xs text-slate-300 leading-relaxed">
              {humanReadableError.description}
            </p>
            
            <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">
              <h4 className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest mb-1.5">How to resolve:</h4>
              <p className="text-xs text-slate-200 font-medium leading-relaxed mb-2">
                ⚠️ {extractedAdvice}
              </p>
              <p className="text-[11px] text-slate-400 leading-normal border-t border-white/[0.04] pt-1.5">
                {humanReadableError.actionableAdvice}
              </p>
            </div>
            
            <div className="text-[10px] font-mono text-slate-600 bg-black/40 px-2 py-1.5 rounded overflow-x-auto max-h-20 scrollbar-none">
              Raw log: {error}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.05] bg-white/[0.01] flex items-center justify-end gap-3">
          <button
            onClick={onDismiss}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            Dismiss
          </button>
          
          {onRetry && (
            <button
              onClick={() => {
                onRetry();
              }}
              className="px-5 py-2 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 text-xs font-bold rounded-lg shadow-md transition-all duration-200 cursor-pointer"
            >
              Retry Stage
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

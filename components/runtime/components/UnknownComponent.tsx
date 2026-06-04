"use client";

import React from "react";
import type { UIComponent } from "@/types/schema";

interface UnknownComponentProps {
  component: UIComponent;
  data: Record<string, unknown>[];
}

export default function UnknownComponent({ component }: UnknownComponentProps) {
  return (
    <div className="animate-fade-in-up">
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg flex-shrink-0">
            <svg
              className="w-5 h-5 text-amber-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-amber-300 mb-1">
              Unknown Component
            </h4>
            <p className="text-xs text-amber-400/70">
              Component type <code className="px-1.5 py-0.5 bg-amber-500/10 rounded text-amber-300 font-mono">{component.type}</code> is not recognized.
            </p>
            {component.id && (
              <p className="text-xs text-slate-500 mt-2">
                ID: <span className="font-mono text-slate-400">{component.id}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

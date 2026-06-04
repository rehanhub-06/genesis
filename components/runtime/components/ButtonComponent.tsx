"use client";

import React from "react";
import type { UIComponent } from "@/types/schema";

interface ButtonComponentProps {
  component: UIComponent;
  data: Record<string, unknown>[];
}

export default function ButtonComponent({ component }: ButtonComponentProps) {
  const variant = component.variant ?? "primary";
  const label = component.label ?? component.title ?? "Button";

  const baseClasses =
    "inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses: Record<string, string> = {
    primary:
      "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:from-blue-600 hover:to-purple-700 focus:ring-blue-500/50",
    secondary:
      "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20 hover:text-white focus:ring-white/20",
    danger:
      "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-300 focus:ring-red-500/30",
    outline:
      "border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/50 hover:text-blue-300 focus:ring-blue-500/30",
  };

  return (
    <div className="animate-fade-in-up inline-block">
      <button
        className={`${baseClasses} ${variantClasses[variant] || variantClasses.primary}`}
        onClick={() => {
          /* action handled by runtime */
        }}
      >
        {variant === "primary" && (
          <svg
            className="w-4 h-4 mr-2 -ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        )}
        {variant === "danger" && (
          <svg
            className="w-4 h-4 mr-2 -ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        )}
        {label}
      </button>
    </div>
  );
}

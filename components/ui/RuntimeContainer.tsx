"use client";

import React, { useState } from "react";
import type { AppSchema } from "@/types/schema";
import AppRuntime from "@/components/runtime/AppRuntime";
import JSONViewer from "@/components/ui/JSONViewer";

interface RuntimeContainerProps {
  schema: AppSchema | null;
}

type ViewTab = "preview" | "json";

export default function RuntimeContainer({ schema }: RuntimeContainerProps) {
  const [activeTab, setActiveTab] = useState<ViewTab>("preview");

  return (
    <div className="flex flex-col h-full">
      {/* Header with tabs */}
      <div className="flex items-center justify-between px-1 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500/20 to-blue-600/20 flex items-center justify-center">
            <svg
              className="w-3.5 h-3.5 text-emerald-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-white">Runtime</h2>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-white/5 rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium rounded-md transition-all duration-150 ${
              activeTab === "preview"
                ? "bg-white/10 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview
          </button>
          <button
            onClick={() => setActiveTab("json")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium rounded-md transition-all duration-150 ${
              activeTab === "json"
                ? "bg-white/10 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            JSON
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {!schema ? (
          /* Empty state */
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/[0.03] border border-white/[0.06] rounded-2xl mb-4">
                <svg
                  className="w-7 h-7 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-400">No App Generated Yet</p>
              <p className="text-xs text-slate-600 mt-1.5 max-w-[240px]">
                Enter a prompt and run the pipeline to see your generated app preview here
              </p>
            </div>
          </div>
        ) : activeTab === "preview" ? (
          <div className="h-full overflow-hidden rounded-xl">
            <AppRuntime schema={schema} />
          </div>
        ) : (
          <div className="h-full overflow-y-auto pr-1">
            <JSONViewer data={schema} maxInitialDepth={20} />
          </div>
        )}
      </div>
    </div>
  );
}

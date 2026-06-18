"use client";

import React, { useState, useCallback, useMemo } from "react";
import type { AppSchema } from "@/types/schema";
import PageRenderer from "@/components/runtime/PageRenderer";

interface AppRuntimeProps {
  schema: AppSchema;
}

// Icon mapping for sidebar
function PageIcon({ name }: { name?: string }) {
  const n = name?.toLowerCase() ?? "";
  const cls = "w-4 h-4";

  if (n.includes("dash"))
    return (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    );
  if (n.includes("user") || n.includes("people") || n.includes("team"))
    return (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197V21" />
      </svg>
    );
  if (n.includes("setting") || n.includes("config"))
    return (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );
  if (n.includes("order") || n.includes("cart") || n.includes("shop"))
    return (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    );
  if (n.includes("login") || n.includes("auth"))
    return (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    );

  return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function generateMockData(schema: AppSchema) {
  const data: Record<string, Record<string, unknown>[]> = {};
  if (schema.database) {
    for (const table of schema.database) {
      // Just initialize empty arrays for now, or you could add 1-2 generic rows
      data[table.name] = [
        { id: 1, name: "Sample Item 1", status: "Active", created_at: new Date().toISOString() },
        { id: 2, name: "Sample Item 2", status: "Pending", created_at: new Date().toISOString() }
      ];
    }
  }
  return data;
}

export default function AppRuntime({ schema }: AppRuntimeProps) {
  const [activePageIndex, setActivePageIndex] = useState(0);

  // Initialize data store with mock data
  const [dataStore, setDataStore] = useState<Record<string, Record<string, unknown>[]>>(() =>
    generateMockData(schema)
  );

  const pages = schema.pages;
  const activePage = pages[activePageIndex] ?? null;

  // Recompute if schema changes
  useMemo(() => {
    setDataStore(generateMockData(schema));
    setActivePageIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema]);

  const handleFormSubmit = useCallback(
    (_componentId: string, formData: Record<string, unknown>) => {
      // Find the most relevant table for this form submission
      const tables = Object.keys(dataStore);
      if (tables.length === 0) return;

      // Use the first table as default target
      const targetTable = tables[0];
      setDataStore((prev) => ({
        ...prev,
        [targetTable]: [
          ...prev[targetTable],
          { id: prev[targetTable].length + 1, ...formData },
        ],
      }));
    },
    [dataStore]
  );

  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/5 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm text-slate-400">No pages to render</p>
          <p className="text-xs text-slate-600 mt-1">Generate an app schema first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full rounded-xl overflow-hidden border border-white/[0.06] bg-slate-950/50">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-48 flex-shrink-0 border-b md:border-b-0 md:border-r border-white/[0.06] bg-white/[0.02] flex flex-row md:flex-col">
        {/* App name - hidden on mobile */}
        <div className="px-4 py-4 border-r md:border-r-0 md:border-b border-white/[0.06] hidden md:block">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-white truncate">
              {schema.app_name}
            </span>
          </div>
        </div>

        {/* Page list - scrollable horizontally on mobile, vertically on desktop */}
        <nav className="flex-1 py-2 px-2 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible md:overflow-y-auto scrollbar-none">
          {pages.map((page, i) => {
            const isActive = i === activePageIndex;
            return (
              <button
                key={page.id}
                onClick={() => setActivePageIndex(i)}
                className={`flex-shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 text-left ${isActive
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                  }`}
              >
                <PageIcon name={page.name} />
                <span className="truncate">{page.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom - hidden on mobile */}
        <div className="px-3 py-3 border-l md:border-l-0 md:border-t border-white/[0.06] hidden md:block">
          <div className="flex items-center gap-2 text-[10px] text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>v{schema.pipeline_version}</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        {activePage ? (
          <PageRenderer
            page={activePage}
            dataStore={dataStore}
            onFormSubmit={handleFormSubmit}
          />
        ) : (
          <div className="text-center text-sm text-slate-500 py-12">
            Select a page from the sidebar
          </div>
        )}
      </main>
    </div>
  );
}

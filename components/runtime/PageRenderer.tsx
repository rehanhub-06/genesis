"use client";

import React from "react";
import type { UIPage } from "@/types/schema";
import ComponentRenderer from "@/components/runtime/ComponentRenderer";

interface PageRendererProps {
  page: UIPage;
  dataStore: Record<string, Record<string, unknown>[]>;
  onFormSubmit?: (componentId: string, formData: Record<string, unknown>) => void;
}

export default function PageRenderer({ page, dataStore, onFormSubmit }: PageRendererProps) {
  // Find data: try to match table name or use first available data set
  const getDataForComponent = (componentId: string): Record<string, unknown>[] => {
    // First try direct component ID match
    if (dataStore[componentId]) return dataStore[componentId];

    // Try finding table data by common patterns
    const keys = Object.keys(dataStore);
    if (keys.length > 0) return dataStore[keys[0]];

    return [];
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white tracking-tight">{page.name}</h2>
        <p className="text-xs text-slate-500 mt-1 font-mono">{page.path}</p>
      </div>

      {/* Components */}
      {page.components.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-white/5 rounded-xl mb-3">
            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
          <p className="text-sm text-slate-500">No components on this page</p>
        </div>
      ) : (
        page.components.map((comp) => (
          <div
            key={comp.id}
            className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-xl p-5 transition-all duration-200 hover:border-white/[0.08]"
          >
            <ComponentRenderer
              component={comp}
              data={getDataForComponent(comp.id)}
              onFormSubmit={(formData) => onFormSubmit?.(comp.id, formData)}
            />
          </div>
        ))
      )}
    </div>
  );
}

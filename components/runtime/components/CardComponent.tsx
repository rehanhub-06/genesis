"use client";

import React from "react";
import type { UIComponent } from "@/types/schema";

interface CardComponentProps {
  component: UIComponent;
  data: Record<string, unknown>[];
}

export default function CardComponent({ component, data }: CardComponentProps) {
  const title = component.title ?? "Card";

  return (
    <div className="animate-fade-in-up group">
      <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-xl p-6 hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5">
        {/* Top gradient accent */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>

        {/* Show card content based on available data */}
        {data.length > 0 ? (
          <div className="space-y-2">
            {Object.entries(data[0]).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="text-slate-400 capitalize">
                  {key.replace(/_/g, " ")}
                </span>
                <span className="text-slate-200 font-medium">
                  {value != null ? String(value) : "—"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic">No content to display</p>
        )}
      </div>
    </div>
  );
}

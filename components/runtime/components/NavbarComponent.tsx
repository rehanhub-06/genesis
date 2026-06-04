"use client";

import React from "react";
import type { UIComponent } from "@/types/schema";

interface NavbarComponentProps {
  component: UIComponent;
  data: Record<string, unknown>[];
}

export default function NavbarComponent({ component }: NavbarComponentProps) {
  const title = component.title ?? "App";

  return (
    <div className="animate-fade-in-up">
      <nav className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-xl px-6 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <span className="text-sm font-semibold text-white">{title}</span>
        </div>

        {/* Nav Items (cosmetic) */}
        <div className="hidden sm:flex items-center gap-1">
          {["Home", "Dashboard", "Settings"].map((item) => (
            <button
              key={item}
              className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-md transition-all duration-150"
            >
              {item}
            </button>
          ))}
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-3">
          <button className="relative p-1.5 text-slate-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-blue-500 rounded-full" />
          </button>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
            U
          </div>
        </div>
      </nav>
    </div>
  );
}

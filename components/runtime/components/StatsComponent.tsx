"use client";

import React, { useState, useEffect, useRef } from "react";
import type { UIComponent } from "@/types/schema";

interface StatsComponentProps {
  component: UIComponent;
  data: Record<string, unknown>[];
}

// Icon mapping based on common stat icon names
function StatIcon({ name }: { name?: string }) {
  const iconClass = "w-6 h-6";

  switch (name?.toLowerCase()) {
    case "users":
    case "people":
    case "team":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case "chart":
    case "analytics":
    case "stats":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case "money":
    case "revenue":
    case "dollar":
    case "price":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "orders":
    case "cart":
    case "shopping":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
        </svg>
      );
    case "time":
    case "clock":
    case "latency":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "check":
    case "success":
    case "done":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
  }
}

// Animated counter
function AnimatedValue({ value }: { value: string }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [animating, setAnimating] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value === prevValue.current) return;
    prevValue.current = value;

    const numericValue = parseFloat(value.replace(/[^0-9.-]/g, ""));
    if (isNaN(numericValue)) {
      setDisplayValue(value);
      return;
    }

    setAnimating(true);
    const prefix = value.replace(/[0-9.,\-]+.*/, "");
    const suffix = value.replace(/.*[0-9.,\-]/, "");
    const isFloat = value.includes(".");
    const duration = 600;
    const steps = 20;
    const increment = numericValue / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current += increment;
      if (step >= steps) {
        current = numericValue;
        clearInterval(timer);
        setAnimating(false);
      }
      const display = isFloat ? current.toFixed(1) : Math.round(current).toLocaleString();
      setDisplayValue(`${prefix}${display}${suffix}`);
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className={animating ? "animate-count-pop" : ""}>
      {displayValue}
    </span>
  );
}

export default function StatsComponent({ component }: StatsComponentProps) {
  const stats = component.stats ?? [];

  if (stats.length === 0) {
    return (
      <div className="text-sm text-slate-500 italic p-4">No stats configured</div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {component.title && (
        <h3 className="text-lg font-semibold text-white mb-4">{component.title}</h3>
      )}
      <div
        className={`grid gap-4 ${
          stats.length === 1
            ? "grid-cols-1"
            : stats.length === 2
            ? "grid-cols-2"
            : stats.length === 3
            ? "grid-cols-3"
            : "grid-cols-2 lg:grid-cols-4"
        }`}
      >
        {stats.map((stat, i) => (
          <div
            key={`${stat.label}-${i}`}
            className="group relative bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-xl p-5 hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {/* Gradient accent line */}
            <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1 truncate">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-white tracking-tight">
                  <AnimatedValue value={stat.value} />
                </p>
              </div>
              <div className="ml-3 p-2 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-lg text-blue-400 flex-shrink-0">
                <StatIcon name={stat.icon} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

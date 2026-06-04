"use client";

import React, { useState, useCallback } from "react";

interface JSONViewerProps {
  data: unknown;
  initialExpanded?: boolean;
  maxInitialDepth?: number;
}

function getType(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function JSONNode({
  keyName,
  value,
  depth,
  maxInitialDepth,
  isLast,
}: {
  keyName?: string;
  value: unknown;
  depth: number;
  maxInitialDepth: number;
  isLast: boolean;
}) {
  const type = getType(value);
  const isExpandable = type === "object" || type === "array";
  const [expanded, setExpanded] = useState(depth < maxInitialDepth);

  const toggle = useCallback(() => {
    if (isExpandable) setExpanded((p) => !p);
  }, [isExpandable]);

  const comma = isLast ? "" : ",";
  const indent = depth * 16;

  // Primitive values
  if (!isExpandable) {
    let colorClass = "text-slate-300";
    let displayValue = String(value);

    switch (type) {
      case "string":
        colorClass = "text-emerald-400";
        displayValue = `"${value}"`;
        break;
      case "number":
        colorClass = "text-amber-400";
        break;
      case "boolean":
        colorClass = "text-purple-400";
        displayValue = value ? "true" : "false";
        break;
      case "null":
      case "undefined":
        colorClass = "text-slate-500 italic";
        break;
    }

    return (
      <div className="leading-5 hover:bg-white/[0.02]" style={{ paddingLeft: indent }}>
        {keyName !== undefined && (
          <span className="text-blue-400">&quot;{keyName}&quot;</span>
        )}
        {keyName !== undefined && <span className="text-slate-500">: </span>}
        <span className={colorClass}>{displayValue}</span>
        <span className="text-slate-600">{comma}</span>
      </div>
    );
  }

  // Object or Array
  const entries =
    type === "array"
      ? (value as unknown[]).map((v, i) => [String(i), v] as [string, unknown])
      : Object.entries(value as Record<string, unknown>);
  const openBracket = type === "array" ? "[" : "{";
  const closeBracket = type === "array" ? "]" : "}";
  const isEmpty = entries.length === 0;

  return (
    <div>
      <div
        className="leading-5 hover:bg-white/[0.02] cursor-pointer group"
        style={{ paddingLeft: indent }}
        onClick={toggle}
      >
        {/* Expand toggle */}
        <span className="inline-block w-4 text-center mr-0.5">
          {!isEmpty && (
            <svg
              className={`inline w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-transform duration-150 ${
                expanded ? "rotate-90" : ""
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </span>

        {keyName !== undefined && type !== "array" && (
          <span className="text-blue-400">&quot;{keyName}&quot;</span>
        )}
        {keyName !== undefined && type !== "array" && (
          <span className="text-slate-500">: </span>
        )}
        {keyName !== undefined && type === "array" && (
          <>
            <span className="text-blue-400">&quot;{keyName}&quot;</span>
            <span className="text-slate-500">: </span>
          </>
        )}

        <span className="text-slate-400">{openBracket}</span>

        {!expanded && !isEmpty && (
          <span className="text-slate-600 text-[10px] mx-1">
            {entries.length} {entries.length === 1 ? "item" : "items"}
          </span>
        )}
        {(!expanded || isEmpty) && (
          <>
            <span className="text-slate-400">{closeBracket}</span>
            <span className="text-slate-600">{comma}</span>
          </>
        )}
      </div>

      {expanded && !isEmpty && (
        <>
          {entries.map(([key, val], i) => (
            <JSONNode
              key={key}
              keyName={type === "array" ? undefined : key}
              value={val}
              depth={depth + 1}
              maxInitialDepth={maxInitialDepth}
              isLast={i === entries.length - 1}
            />
          ))}
          <div className="leading-5" style={{ paddingLeft: indent }}>
            <span className="inline-block w-4 mr-0.5" />
            <span className="text-slate-400">{closeBracket}</span>
            <span className="text-slate-600">{comma}</span>
          </div>
        </>
      )}
    </div>
  );
}

export default function JSONViewer({
  data,
  maxInitialDepth = 2,
}: JSONViewerProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (data === undefined || data === null) {
    return (
      <div className="text-sm text-slate-500 italic p-4">No JSON data</div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          Schema JSON
        </h3>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 hover:bg-white/5 rounded"
        >
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>

      {!collapsed && (
        <div className="bg-slate-950/50 border border-white/[0.06] rounded-lg overflow-hidden">
          <div className="text-[11px] font-mono max-h-96 overflow-y-auto p-3">
            <JSONNode
              value={data}
              depth={0}
              maxInitialDepth={maxInitialDepth}
              isLast={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}

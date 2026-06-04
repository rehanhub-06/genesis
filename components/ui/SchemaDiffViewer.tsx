"use client";

import React, { useState, useMemo } from "react";

interface SchemaDiffViewerProps {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

type DiffLine = {
  type: "added" | "removed" | "unchanged" | "header";
  content: string;
  indent: number;
};

function jsonToLines(obj: unknown, indent: number = 0): string[] {
  const lines: string[] = [];
  const prefix = "  ".repeat(indent);

  if (obj === null || obj === undefined) {
    lines.push(`${prefix}null`);
  } else if (Array.isArray(obj)) {
    lines.push(`${prefix}[`);
    obj.forEach((item, i) => {
      const subLines = jsonToLines(item, indent + 1);
      subLines.forEach((line, j) => {
        if (j === subLines.length - 1 && i < obj.length - 1) {
          lines.push(line + ",");
        } else {
          lines.push(line);
        }
      });
    });
    lines.push(`${prefix}]`);
  } else if (typeof obj === "object") {
    lines.push(`${prefix}{`);
    const entries = Object.entries(obj as Record<string, unknown>);
    entries.forEach(([key, val], i) => {
      if (typeof val === "object" && val !== null) {
        lines.push(`${prefix}  "${key}":`);
        const subLines = jsonToLines(val, indent + 1);
        subLines.forEach((line, j) => {
          if (j === subLines.length - 1 && i < entries.length - 1) {
            lines.push(line + ",");
          } else {
            lines.push(line);
          }
        });
      } else {
        const valStr = JSON.stringify(val);
        const comma = i < entries.length - 1 ? "," : "";
        lines.push(`${prefix}  "${key}": ${valStr}${comma}`);
      }
    });
    lines.push(`${prefix}}`);
  } else {
    lines.push(`${prefix}${JSON.stringify(obj)}`);
  }

  return lines;
}

function computeDiff(before: string[], after: string[]): DiffLine[] {
  const result: DiffLine[] = [];
  const beforeSet = new Set(before.map((l) => l.trim()));
  const afterSet = new Set(after.map((l) => l.trim()));

  // Simple line-by-line diff
  const maxLen = Math.max(before.length, after.length);
  let bi = 0;
  let ai = 0;

  while (bi < before.length || ai < after.length) {
    const bLine = bi < before.length ? before[bi] : null;
    const aLine = ai < after.length ? after[ai] : null;

    if (bLine !== null && aLine !== null && bLine.trim() === aLine.trim()) {
      result.push({ type: "unchanged", content: aLine, indent: 0 });
      bi++;
      ai++;
    } else if (bLine !== null && !afterSet.has(bLine.trim())) {
      result.push({ type: "removed", content: bLine, indent: 0 });
      bi++;
    } else if (aLine !== null && !beforeSet.has(aLine.trim())) {
      result.push({ type: "added", content: aLine, indent: 0 });
      ai++;
    } else {
      if (bLine !== null) {
        result.push({ type: "removed", content: bLine, indent: 0 });
        bi++;
      }
      if (aLine !== null) {
        result.push({ type: "added", content: aLine, indent: 0 });
        ai++;
      }
    }

    // Safety break
    if (result.length > maxLen * 3) break;
  }

  return result;
}

export default function SchemaDiffViewer({ before, after }: SchemaDiffViewerProps) {
  const [viewMode, setViewMode] = useState<"unified" | "split">("unified");

  const diff = useMemo(() => {
    const beforeLines = before ? jsonToLines(before) : [];
    const afterLines = after ? jsonToLines(after) : [];
    return computeDiff(beforeLines, afterLines);
  }, [before, after]);

  const beforeLines = useMemo(() => (before ? jsonToLines(before) : []), [before]);
  const afterLines = useMemo(() => (after ? jsonToLines(after) : []), [after]);

  if (!before && !after) {
    return (
      <div className="text-center py-8 text-sm text-slate-500">
        No schema changes to display
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-300">Schema Diff</h3>
        <div className="flex items-center bg-white/5 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode("unified")}
            className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-all duration-150 ${
              viewMode === "unified"
                ? "bg-white/10 text-white"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Unified
          </button>
          <button
            onClick={() => setViewMode("split")}
            className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-all duration-150 ${
              viewMode === "split"
                ? "bg-white/10 text-white"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Split
          </button>
        </div>
      </div>

      {viewMode === "unified" ? (
        /* Unified diff */
        <div className="bg-slate-950/50 border border-white/[0.06] rounded-lg overflow-hidden">
          <pre className="text-[11px] font-mono leading-5 max-h-80 overflow-y-auto p-3">
            {diff.map((line, i) => (
              <div
                key={i}
                className={`px-2 -mx-1 ${
                  line.type === "added"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : line.type === "removed"
                    ? "bg-red-500/10 text-red-400"
                    : "text-slate-500"
                }`}
              >
                <span className="inline-block w-4 mr-2 text-slate-600 select-none">
                  {line.type === "added" ? "+" : line.type === "removed" ? "−" : " "}
                </span>
                {line.content}
              </div>
            ))}
          </pre>
        </div>
      ) : (
        /* Split view */
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[10px] font-medium text-slate-500 mb-1 px-1">Before</div>
            <div className="bg-slate-950/50 border border-white/[0.06] rounded-lg overflow-hidden">
              <pre className="text-[11px] font-mono leading-5 max-h-80 overflow-y-auto p-3 text-red-400/70">
                {beforeLines.length === 0 ? (
                  <span className="text-slate-600 italic">Empty</span>
                ) : (
                  beforeLines.map((line, i) => (
                    <div key={i}>{line}</div>
                  ))
                )}
              </pre>
            </div>
          </div>
          <div>
            <div className="text-[10px] font-medium text-slate-500 mb-1 px-1">After</div>
            <div className="bg-slate-950/50 border border-white/[0.06] rounded-lg overflow-hidden">
              <pre className="text-[11px] font-mono leading-5 max-h-80 overflow-y-auto p-3 text-emerald-400/70">
                {afterLines.length === 0 ? (
                  <span className="text-slate-600 italic">Empty</span>
                ) : (
                  afterLines.map((line, i) => (
                    <div key={i}>{line}</div>
                  ))
                )}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="mt-2 flex items-center gap-4 text-[10px]">
        <span className="text-emerald-500">
          +{diff.filter((d) => d.type === "added").length} additions
        </span>
        <span className="text-red-500">
          −{diff.filter((d) => d.type === "removed").length} removals
        </span>
      </div>
    </div>
  );
}

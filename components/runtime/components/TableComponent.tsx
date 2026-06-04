"use client";

import React, { useState, useMemo } from "react";
import type { UIComponent } from "@/types/schema";

interface TableComponentProps {
  component: UIComponent;
  data: Record<string, unknown>[];
}

type SortDir = "asc" | "desc" | null;

export default function TableComponent({ component, data }: TableComponentProps) {
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const columns = component.columns ?? [];

  const handleSort = (colName: string, sortable?: boolean) => {
    if (!sortable) return;
    if (sortCol === colName) {
      setSortDir((d) => (d === "asc" ? "desc" : d === "desc" ? null : "asc"));
      if (sortDir === "desc") setSortCol(null);
    } else {
      setSortCol(colName);
      setSortDir("asc");
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...data];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((v) =>
          String(v).toLowerCase().includes(q)
        )
      );
    }

    // Sort
    if (sortCol && sortDir) {
      result.sort((a, b) => {
        const aVal = a[sortCol];
        const bVal = b[sortCol];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        let cmp: number;
        if (typeof aVal === "number" && typeof bVal === "number") {
          cmp = aVal - bVal;
        } else {
          cmp = String(aVal).localeCompare(String(bVal));
        }
        return sortDir === "desc" ? -cmp : cmp;
      });
    }

    return result;
  }, [data, search, sortCol, sortDir]);

  const getSortIcon = (colName: string) => {
    if (sortCol !== colName || sortDir === null) return "↕";
    return sortDir === "asc" ? "↑" : "↓";
  };

  return (
    <div className="animate-fade-in-up">
      {component.title && (
        <h3 className="text-lg font-semibold text-white mb-4">{component.title}</h3>
      )}

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search records…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all duration-200"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              {columns.map((col) => (
                <th
                  key={col.name}
                  onClick={() => handleSort(col.name, col.sortable)}
                  className={`px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider select-none ${
                    col.sortable
                      ? "cursor-pointer hover:text-blue-400 transition-colors duration-150"
                      : ""
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && (
                      <span
                        className={`text-[10px] ${
                          sortCol === col.name ? "text-blue-400" : "text-slate-600"
                        }`}
                      >
                        {getSortIcon(col.name)}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredAndSorted.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-slate-500 text-sm"
                >
                  {search ? "No matching records found" : "No data available"}
                </td>
              </tr>
            ) : (
              filteredAndSorted.map((row, i) => (
                <tr
                  key={i}
                  className={`transition-colors duration-150 hover:bg-white/5 ${
                    i % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"
                  }`}
                >
                  {columns.map((col) => (
                    <td key={col.name} className="px-4 py-3 text-slate-300 whitespace-nowrap">
                      {row[col.name] != null ? String(row[col.name]) : "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>
          {filteredAndSorted.length} of {data.length} record{data.length !== 1 ? "s" : ""}
        </span>
        {search && (
          <button
            onClick={() => setSearch("")}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Clear search
          </button>
        )}
      </div>
    </div>
  );
}

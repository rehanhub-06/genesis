"use client";

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "ai-app-gen-prompt-history";
const MAX_HISTORY = 20;

export interface PromptHistoryEntry {
  id: string;
  prompt: string;
  timestamp: string;
}

export function usePromptHistory() {
  const [history, setHistory] = useState<PromptHistoryEntry[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as PromptHistoryEntry[];
        setHistory(parsed);
      }
    } catch {
      // localStorage might be unavailable
      console.warn("Failed to load prompt history from localStorage");
    }
  }, []);

  // Persist to localStorage whenever history changes
  const persist = useCallback((entries: PromptHistoryEntry[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      console.warn("Failed to persist prompt history");
    }
  }, []);

  const addPrompt = useCallback(
    (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed) return;

      setHistory((prev) => {
        // Don't add duplicates of the most recent prompt
        if (prev.length > 0 && prev[0].prompt === trimmed) return prev;

        const entry: PromptHistoryEntry = {
          id: `prompt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          prompt: trimmed,
          timestamp: new Date().toISOString(),
        };

        const updated = [entry, ...prev].slice(0, MAX_HISTORY);
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // no-op
    }
  }, []);

  return { history, addPrompt, clearHistory };
}

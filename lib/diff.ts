// lib/diff.ts — Schema diff utility
import type { AppSchema } from '@/types/schema';

export type ChangeKind = 'added' | 'removed' | 'changed';

export interface DiffEntry {
  path: string;
  kind: ChangeKind;
  before?: unknown;
  after?: unknown;
}

export interface SchemaDiff {
  hasChanges: boolean;
  totalChanges: number;
  entries: DiffEntry[];
  summary: string;
}

/**
 * Recursively compares two values and collects all differences.
 */
function deepDiff(
  before: unknown,
  after: unknown,
  currentPath: string,
  entries: DiffEntry[]
): void {
  // Identical
  if (before === after) return;

  // Null / undefined transitions
  if (before == null && after != null) {
    entries.push({ path: currentPath, kind: 'added', after });
    return;
  }
  if (before != null && after == null) {
    entries.push({ path: currentPath, kind: 'removed', before });
    return;
  }

  const bType = typeof before;
  const aType = typeof after;

  // Primitive type or value change
  if (bType !== aType || bType !== 'object') {
    entries.push({ path: currentPath, kind: 'changed', before, after });
    return;
  }

  // Arrays
  if (Array.isArray(before) && Array.isArray(after)) {
    const maxLen = Math.max(before.length, after.length);
    for (let i = 0; i < maxLen; i++) {
      const itemPath = `${currentPath}[${i}]`;
      if (i >= before.length) {
        entries.push({ path: itemPath, kind: 'added', after: (after as unknown[])[i] });
      } else if (i >= after.length) {
        entries.push({ path: itemPath, kind: 'removed', before: (before as unknown[])[i] });
      } else {
        deepDiff(
          (before as unknown[])[i],
          (after as unknown[])[i],
          itemPath,
          entries
        );
      }
    }
    return;
  }

  // Objects
  if (
    before !== null && after !== null &&
    typeof before === 'object' && typeof after === 'object' &&
    !Array.isArray(before) && !Array.isArray(after)
  ) {
    const bObj = before as Record<string, unknown>;
    const aObj = after as Record<string, unknown>;
    const allKeys = new Set([...Object.keys(bObj), ...Object.keys(aObj)]);

    for (const key of allKeys) {
      const childPath = currentPath ? `${currentPath}.${key}` : key;
      if (!(key in bObj)) {
        entries.push({ path: childPath, kind: 'added', after: aObj[key] });
      } else if (!(key in aObj)) {
        entries.push({ path: childPath, kind: 'removed', before: bObj[key] });
      } else {
        deepDiff(bObj[key], aObj[key], childPath, entries);
      }
    }
    return;
  }

  // Fallback: values are different
  entries.push({ path: currentPath, kind: 'changed', before, after });
}

/**
 * Builds a human-readable summary of the diff.
 */
function buildSummary(entries: DiffEntry[]): string {
  if (entries.length === 0) return 'No changes detected.';

  const added = entries.filter((e) => e.kind === 'added').length;
  const removed = entries.filter((e) => e.kind === 'removed').length;
  const changed = entries.filter((e) => e.kind === 'changed').length;

  const parts: string[] = [];
  if (added > 0) parts.push(`${added} addition${added > 1 ? 's' : ''}`);
  if (removed > 0) parts.push(`${removed} removal${removed > 1 ? 's' : ''}`);
  if (changed > 0) parts.push(`${changed} modification${changed > 1 ? 's' : ''}`);

  // Highlight top-level sections affected
  const sections = new Set(
    entries.map((e) => e.path.split('.')[0].split('[')[0])
  );

  return `${parts.join(', ')} across ${sections.size} section${sections.size > 1 ? 's' : ''}: ${Array.from(sections).join(', ')}`;
}

/**
 * Compares two AppSchema objects and returns a structured diff.
 */
export function diffSchemas(before: AppSchema, after: AppSchema): SchemaDiff {
  const entries: DiffEntry[] = [];
  deepDiff(before, after, '', entries);

  return {
    hasChanges: entries.length > 0,
    totalChanges: entries.length,
    entries,
    summary: buildSummary(entries),
  };
}

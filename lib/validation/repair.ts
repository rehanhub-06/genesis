// lib/validation/repair.ts — Hybrid Repair Engine
import type { AppSchema, DBColumn } from '@/types/schema';
import { validateSchema, type ValidationError, type ValidationErrorType } from './validators';
import { AppSchemaObj } from './schema';
import { refineSchemaStream, parseRefinedSchema } from '../pipeline/stage4-refine';

const MAX_RETRIES = 3;

/* ------------------------------------------------------------------ */
/*  Levenshtein distance utility                                      */
/* ------------------------------------------------------------------ */

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) matrix[i] = [i];
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

function findBestMatch(target: string, candidates: string[]): string | undefined {
  let best: string | undefined;
  let bestDist = Infinity;

  for (const c of candidates) {
    const d = levenshteinDistance(target.toLowerCase(), c.toLowerCase());
    if (d < bestDist && d <= Math.ceil(target.length / 2)) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}

/* ------------------------------------------------------------------ */
/*  Programmatic repair strategies                                    */
/* ------------------------------------------------------------------ */

/**
 * MISSING_ROLE: Append missing roles to auth.roles.
 */
function repairMissingRoles(schema: AppSchema, errors: ValidationError[]): AppSchema {
  const roleErrors = errors.filter((e) => e.type === 'MISSING_ROLE');
  if (roleErrors.length === 0) return schema;

  const existingRoles = new Set(schema.auth.roles);
  const missingRoles = new Set<string>();

  for (const err of roleErrors) {
    // Extract role name from the error message
    const match = err.message.match(/role "([^"]+)"/);
    if (match && !existingRoles.has(match[1])) {
      missingRoles.add(match[1]);
    }
  }

  return {
    ...schema,
    auth: {
      ...schema.auth,
      roles: [...schema.auth.roles, ...Array.from(missingRoles)],
    },
  };
}

/**
 * FIELD_MISMATCH: Use Levenshtein to rename fields or add missing DB columns.
 */
function repairFieldMismatches(schema: AppSchema, errors: ValidationError[]): AppSchema {
  const fieldErrors = errors.filter((e) => e.type === 'FIELD_MISMATCH');
  if (fieldErrors.length === 0) return schema;

  // Collect all column names across all tables
  const allColumns: string[] = [];
  for (const table of schema.database) {
    for (const col of table.columns) {
      allColumns.push(col.name);
    }
  }

  // Deep clone the schema for mutation
  const repaired: AppSchema = JSON.parse(JSON.stringify(schema));

  for (const err of fieldErrors) {
    // Extract field name from the error
    const fieldMatch = err.message.match(/Form field "([^"]+)"/);
    const componentMatch = err.message.match(/component "([^"]+)"/);
    const pageMatch = err.message.match(/page "([^"]+)"/);

    if (!fieldMatch) continue;
    const fieldName = fieldMatch[1];

    // Try to find a close column name
    const bestColumn = findBestMatch(fieldName, allColumns);

    if (bestColumn && levenshteinDistance(fieldName.toLowerCase(), bestColumn.toLowerCase()) <= 2) {
      // Rename the form field to match the existing column
      for (const page of repaired.pages) {
        if (pageMatch && page.name !== pageMatch[1]) continue;
        for (const comp of page.components) {
          if (componentMatch && comp.id !== componentMatch[1]) continue;
          if (comp.fields) {
            for (const field of comp.fields) {
              if (field.name === fieldName) {
                field.name = bestColumn;
              }
            }
          }
        }
      }
    } else {
      // No close match found — add the field as a new column to the first relevant table
      // Determine which table is most likely related by checking the page path
      const pagePath = pageMatch
        ? repaired.pages.find((p) => p.name === pageMatch[1])?.path
        : undefined;
      const tableSegment = pagePath?.split('/').filter(Boolean)[0];

      let targetTable = repaired.database.find((t) =>
        t.name === tableSegment ||
        t.name === tableSegment + 's' ||
        t.name.includes(tableSegment || '__never__')
      );

      // Fall back to the first table
      if (!targetTable && repaired.database.length > 0) {
        targetTable = repaired.database[0];
      }

      if (targetTable) {
        const existingCols = new Set(targetTable.columns.map((c) => c.name));
        if (!existingCols.has(fieldName)) {
          const newCol: DBColumn = {
            name: fieldName,
            type: 'string',
            required: false,
          };
          targetTable.columns.push(newCol);
        }
      }
    }
  }

  return repaired;
}

/**
 * INVALID_TABLE_REF: Fix table references in API endpoints using Levenshtein matching.
 */
function repairInvalidTableRefs(schema: AppSchema, errors: ValidationError[]): AppSchema {
  const tableErrors = errors.filter((e) => e.type === 'INVALID_TABLE_REF');
  if (tableErrors.length === 0) return schema;

  const tableNames = schema.database.map((t) => t.name);
  const repaired: AppSchema = JSON.parse(JSON.stringify(schema));

  for (const err of tableErrors) {
    const endpointMatch = err.message.match(/endpoint "([^"]+)"/);
    const tableMatch = err.message.match(/table "([^"]+)"/);

    if (!endpointMatch || !tableMatch) continue;

    const endpointId = endpointMatch[1];
    const badTable = tableMatch[1];
    const bestTable = findBestMatch(badTable, tableNames);

    if (bestTable) {
      const endpoint = repaired.api.find((e) => e.id === endpointId);
      if (endpoint) {
        endpoint.table = bestTable;
      }
    }
  }

  return repaired;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

export interface RepairResult {
  schema: AppSchema;
  wasRepaired: boolean;
  repairAttempts: number;
  remainingErrors: ValidationError[];
  repairLog: string[];
}

/**
 * Runs the hybrid repair engine:
 * 1. Programmatic fixes (MISSING_ROLE, simple FIELD_MISMATCH, INVALID_TABLE_REF)
 * 2. If errors remain, uses LLM (Stage 4 refinement) as fallback
 * 3. Max 3 retry attempts total
 */
export async function repairSchema(
  schema: AppSchema,
  onChunk?: (text: string) => void,
  apiKey?: string
): Promise<RepairResult> {
  const log: string[] = [];
  let currentSchema = schema;
  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    const errors = validateSchema(currentSchema);

    if (errors.length === 0) {
      log.push(`Attempt ${attempts}: Schema is valid — no repairs needed.`);
      return {
        schema: currentSchema,
        wasRepaired: attempts > 0,
        repairAttempts: attempts,
        remainingErrors: [],
        repairLog: log,
      };
    }

    attempts++;
    log.push(`Attempt ${attempts}: Found ${errors.length} errors. Attempting repair...`);

    // Phase 1: Programmatic repairs
    const preRepairCount = errors.length;
    currentSchema = repairMissingRoles(currentSchema, errors);
    currentSchema = repairFieldMismatches(currentSchema, errors);
    currentSchema = repairInvalidTableRefs(currentSchema, errors);

    // Re-validate after programmatic repairs
    const postProgrammaticErrors = validateSchema(currentSchema);
    const programmaticFixed = preRepairCount - postProgrammaticErrors.length;

    if (programmaticFixed > 0) {
      log.push(`  Programmatic repair fixed ${programmaticFixed} error(s).`);
    }

    if (postProgrammaticErrors.length === 0) {
      log.push(`  All errors resolved programmatically.`);
      continue; // Will exit via the check at the top of the loop
    }

    // Phase 2: LLM fallback for remaining complex issues
    log.push(`  ${postProgrammaticErrors.length} error(s) remain — invoking LLM refinement...`);

    try {
      const refinedRaw = await refineSchemaStream(
        {
          schema: currentSchema,
          errors: postProgrammaticErrors.map((e) => ({
            type: e.type,
            message: e.message,
            path: e.path,
            suggestion: e.suggestion,
          })),
        },
        onChunk ?? (() => {}),
        apiKey
      );

      currentSchema = parseRefinedSchema(refinedRaw);
      log.push(`  LLM refinement completed.`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      log.push(`  LLM refinement failed: ${errorMessage}`);

      // Try to at least validate current schema with Zod
      try {
        currentSchema = AppSchemaObj.parse(currentSchema);
      } catch {
        log.push(`  Zod parse also failed — keeping last valid schema.`);
      }
    }
  }

  // After all retries
  const finalErrors = validateSchema(currentSchema);
  log.push(`Repair complete after ${attempts} attempt(s). ${finalErrors.length} error(s) remaining.`);

  return {
    schema: currentSchema,
    wasRepaired: true,
    repairAttempts: attempts,
    remainingErrors: finalErrors,
    repairLog: log,
  };
}

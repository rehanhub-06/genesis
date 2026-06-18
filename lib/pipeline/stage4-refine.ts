// lib/pipeline/stage4-refine.ts — Stage 4: Schema Refinement
import { callGeminiStream } from '../gemini';
import { AppSchemaObj } from '../validation/schema';
import type { AppSchema } from '@/types/schema';

const SYSTEM_PROMPT = `You are a schema refinement engine. Given an AppSchema and a list of validation errors, fix the schema to resolve ALL issues.

Common fixes:
1. MISSING_ROLE: Add missing roles to auth.roles array.
2. FIELD_MISMATCH: Ensure every form field name in UI components has a matching column name in the corresponding DB table. Add missing columns or rename fields.
3. INVALID_TABLE_REF: Ensure every API endpoint's "table" field references an existing database table name. Fix typos or add missing tables.
4. ORPHAN_API: Ensure every API endpoint is reachable from at least one page component or action.
5. Ensure all required fields are present and correctly typed.
6. Ensure cross-referential integrity between pages, api, and database layers.

Rules:
- Preserve the original structure as much as possible — make minimal, targeted fixes.
- Do NOT remove existing valid data.
- If a table name is close to a valid one (likely typo), correct the reference.
- If a form field has no matching DB column, add the column to the appropriate table.
- Return the COMPLETE fixed schema as a single JSON object.
- The output must conform to the AppSchema Zod schema exactly.`;

export interface RefinementInput {
  schema: AppSchema;
  errors: Array<{
    type: string;
    message: string;
    path?: string;
    suggestion?: string;
  }>;
}

/**
 * Stage 4 — Refines an existing AppSchema based on validation errors.
 * Returns the corrected schema as a JSON string.
 */
export async function refineSchemaStream(
  input: RefinementInput,
  onChunk: (text: string) => void,
  apiKey?: string
): Promise<string> {
  return await callGeminiStream(
    {
      system: SYSTEM_PROMPT,
      user: `Fix this AppSchema to resolve the following validation errors:

CURRENT SCHEMA:
${JSON.stringify(input.schema, null, 2)}

VALIDATION ERRORS (${input.errors.length} total):
${JSON.stringify(input.errors, null, 2)}

Return the COMPLETE corrected schema as a single JSON object.`,
      temperature: 0.1,
      jsonMode: true,
      apiKey,
    },
    onChunk
  );
}

/**
 * Validates and parses a refined schema string.
 */
export function parseRefinedSchema(raw: string): AppSchema {
  const parsed = JSON.parse(raw);
  return AppSchemaObj.parse(parsed);
}

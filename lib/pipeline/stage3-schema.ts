// lib/pipeline/stage3-schema.ts — Stage 3: Full App Schema Generation
import { callGeminiStream } from '../gemini';
import { AppSchemaObj } from '../validation/schema';
import type { IntentResult, ArchitectureResult } from '@/types/schema';

const SYSTEM_PROMPT = `You are a full-stack schema generator. Given an intent and system architecture, produce a complete, production-ready AppSchema.

Rules:
- app_name: derive a clean, PascalCase app name from the intent.
- app_type: use the app_type from intent.
- description: write a clear one-sentence description.
- assumptions: list any assumptions you made to fill gaps. Each has { field, assumed, reason }.
- auth: set enabled=true if auth_required in intent. Include all roles. loginPage should be "/login". defaultRole is the most basic role.
- pages: convert the architecture pages into full UIPage objects:
  - Each page has: id (kebab-case), name, path, icon (emoji or icon name), roles (from visible_to_roles), components[].
  - Components must have: id (unique), type.
    CRITICAL: "type" MUST be exactly one of: "table", "form", "stats", "button", "card", "navbar", "chart". Do NOT invent or use any other component types.
  - For "table" components: include columns[] with {name, label, sortable}.
  - For "form" components: include fields[] with {name, label, type, required, options?} and submitLabel.
    CRITICAL: "type" MUST be exactly one of: "text", "email", "password", "number", "date", "select".
    CRITICAL: "options" MUST be an array of simple strings (NOT objects), e.g., ["Option 1", "Option 2"].
  - For "stats" components: include stats[] with {label, value, icon?}.
- api: convert api_operations into full APIEndpoint objects:
  - Each has: id, path (RESTful), method, description, table (matching DB table name), requiresAuth, roles?, inputFields?, outputFields?.
    CRITICAL: "inputFields" and "outputFields" MUST be arrays of simple strings (NOT objects), e.g., ["name", "email", "role"].
- database: create DB tables for each entity:
    CRITICAL: "database" MUST be an array of table objects (NOT a single object/map).
  - Each table has: name (snake_case), columns[] with {name, type, required, unique?, default?, references?}.
  - Always include id, created_at, updated_at columns.
  - type must be one of: "string", "integer", "boolean", "timestamp", "float".
- generated_at: current ISO timestamp.
- pipeline_version: "1.0.0".

The output MUST conform exactly to the AppSchema Zod schema. Return ONLY the JSON object.`;

/**
 * Stage 3 — Generates the full AppSchema from intent and architecture.
 * Uses the Zod schema object as responseSchema for strict conformance.
 */
export async function generateSchemaStream(
  intent: IntentResult,
  architecture: ArchitectureResult,
  onChunk: (text: string) => void,
  apiKey?: string
): Promise<string> {
  // Convert Zod schema to a JSON Schema-like object for Gemini's responseSchema
  // We use jsonMode instead since the Zod-to-JSON-schema conversion adds complexity
  // and the system prompt already fully specifies the required structure.
  return await callGeminiStream(
    {
      system: SYSTEM_PROMPT,
      user: `Generate the complete AppSchema from:

INTENT:
${JSON.stringify(intent, null, 2)}

ARCHITECTURE:
${JSON.stringify(architecture, null, 2)}

Return a single JSON object conforming to the AppSchema specification. Set generated_at to "${new Date().toISOString()}" and pipeline_version to "1.0.0".`,
      temperature: 0.1,
      jsonMode: true,
      apiKey,
    },
    onChunk
  );
}

/**
 * Validates raw JSON against the AppSchema Zod schema.
 * Returns the parsed object or throws with details.
 */
export function parseAndValidateSchema(raw: string) {
  const parsed = JSON.parse(raw);
  return AppSchemaObj.parse(parsed);
}

/**
 * Stage 3.5 — Targeted Zod Repair.
 * Sends the faulty JSON and specific error details back to the LLM for a targeted fix.
 */
export async function repairZodErrorsStream(
  faultyJson: string,
  errorDetails: string,
  onChunk: (text: string) => void,
  apiKey?: string
): Promise<string> {
  const REPAIR_PROMPT = `You are an expert JSON repair agent.
The following JSON failed validation against the required schema.

VALIDATION ERRORS:
${errorDetails}

Your task is to fix ONLY the invalid fields to make the JSON pass validation.
Do NOT regenerate the entire application from scratch. Keep the valid parts exactly as they are.
Return ONLY the corrected JSON object, no markdown fences or explanations.`;

  return await callGeminiStream(
    {
      system: REPAIR_PROMPT,
      user: `FAULTY JSON:\n${faultyJson}`,
      temperature: 0.1,
      jsonMode: true,
      apiKey,
    },
    onChunk
  );
}

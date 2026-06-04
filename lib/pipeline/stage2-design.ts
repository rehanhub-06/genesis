// lib/pipeline/stage2-design.ts — Stage 2: System Design / Architecture
import { callGeminiStream } from '../gemini';
import type { IntentResult } from '@/types/schema';

const SYSTEM_PROMPT = `You are a system architect. Given an extracted intent, produce a detailed system architecture.
Return valid JSON matching this schema:
{
  "pages": [
    {
      "name": string,
      "path": string (URL path, e.g. "/dashboard"),
      "purpose": string,
      "visible_to_roles": string[],
      "components_needed": string[] (e.g. ["table", "form", "stats", "chart", "button", "card", "navbar"])
    }
  ],
  "user_flows": string[] (describe key user journeys step by step),
  "entities": {
    "<EntityName>": {
      "fields": string[] (field names with types, e.g. "name:string", "email:string", "age:integer"),
      "relations": string[] (e.g. "belongs_to:User", "has_many:Order")
    }
  },
  "api_operations": [
    {
      "operation": string (e.g. "listUsers", "createOrder"),
      "entity": string,
      "method": "GET" | "POST" | "PUT" | "DELETE",
      "auth_required": boolean
    }
  ]
}

Rules:
- Generate a login page if auth is required.
- Include a dashboard page with stats/charts for admin roles.
- Every entity must have CRUD API operations.
- Design pages with appropriate UI component types (table for listing, form for creation, stats for summaries).
- Paths should be kebab-case and start with /.
- Include an "id" field (string or integer) for every entity.
- Include timestamps (created_at, updated_at) for every entity.
- Return ONLY the JSON object, no markdown fences or explanations.`;

/**
 * Stage 2 — Generates a system architecture design from the extracted intent.
 * Streams partial JSON chunks and returns the full JSON string.
 */
export async function generateDesignStream(
  intent: IntentResult,
  onChunk: (text: string) => void
): Promise<string> {
  return await callGeminiStream(
    {
      system: SYSTEM_PROMPT,
      user: `Design a system architecture for this extracted intent:\n\n${JSON.stringify(intent, null, 2)}`,
      temperature: 0.1,
      jsonMode: true,
    },
    onChunk
  );
}

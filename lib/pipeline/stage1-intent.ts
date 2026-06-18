// lib/pipeline/stage1-intent.ts — Stage 1: Intent Extraction
import { callGeminiStream } from '../gemini';

const SYSTEM_PROMPT = `You are an intent extraction engine. Extract structured architecture prerequisites from an app description.
Return valid JSON matching this schema:
{
  "app_type": string (e.g. "CRM", "E-Commerce", "Dashboard", "SaaS", "Blog", "Marketplace"),
  "core_purpose": string (one-sentence summary of the application's primary goal),
  "features": string[] (list of specific features the user wants),
  "entities": string[] (data entities/resources the app will manage, e.g. "User", "Product", "Order"),
  "roles": string[] (user roles required, e.g. "admin", "user", "manager"),
  "auth_required": boolean (whether authentication is needed),
  "ambiguities": string[] (aspects of the description that are unclear or underspecified),
  "conflicts": string[] (any contradictions or conflicting requirements detected),
  "is_vague": boolean (true if the description is too short, lacks any specific features, or misses critical context to the point an app cannot be built),
  "clarification_questions": string[] (1-3 questions to ask the user if the prompt is vague, ambiguous, or has conflicts)
}

Rules:
- Be thorough: infer features that are implied but not explicitly stated.
- If the prompt is vague but can be processed using reasonable assumptions, set is_vague to false, document your assumptions, and proceed.
- Set is_vague to true ONLY if the prompt is completely unactionable (e.g., "make me an app" with no other details).
- If you detect a conflict (e.g., "no login required" but wants "private profiles"), document it in "conflicts".
- For entities, use singular PascalCase names.
- Always include at least "user" in roles if auth is required.
- Return ONLY the JSON object, no markdown fences or explanations.`;

/**
 * Stage 1 — Extracts structured intent from a raw user prompt.
 * Streams partial JSON chunks via `onChunk` and returns the full JSON string.
 */
export async function extractIntentStream(
  userPrompt: string,
  onChunk: (text: string) => void,
  apiKey?: string
): Promise<string> {
  return await callGeminiStream(
    {
      system: SYSTEM_PROMPT,
      user: `Extract intent from this app description:\n\n"${userPrompt}"`,
      temperature: 0.1,
      jsonMode: true,
      apiKey,
    },
    onChunk
  );
}

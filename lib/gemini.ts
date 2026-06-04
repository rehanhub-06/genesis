// lib/gemini.ts — Gemini API Streaming Client Wrapper
import { GoogleGenAI } from '@google/genai';

export interface StreamOptions {
  system: string;
  user: string;
  temperature?: number;
  responseSchema?: Record<string, unknown>;
  jsonMode?: boolean;
}

/**
 * Calls the Gemini API with streaming enabled, invoking `onChunk` for each
 * text fragment received. Returns the fully concatenated response text.
 */
export async function callGeminiStream(
  { system, user, temperature = 0.1, responseSchema, jsonMode }: StreamOptions,
  onChunk: (chunk: string) => void
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY environment variable.');
  }

  const ai = new GoogleGenAI({ apiKey });

  // Build generation config
  const config: Record<string, unknown> = {
    temperature,
    systemInstruction: system,
  };

  if (responseSchema) {
    config.responseMimeType = 'application/json';
    config.responseSchema = responseSchema;
  } else if (jsonMode) {
    config.responseMimeType = 'application/json';
  }

  const responseStream = await ai.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: [user],
    config,
  });

  let fullOutputText = '';

  for await (const chunk of responseStream) {
    const chunkText = chunk.text ?? '';
    fullOutputText += chunkText;
    onChunk(chunkText);
  }

  return fullOutputText;
}

/**
 * Non-streaming convenience wrapper — calls `callGeminiStream` internally
 * and returns the full response text once complete.
 */
export async function callGemini(
  options: StreamOptions
): Promise<string> {
  return await callGeminiStream(options, () => { });
}

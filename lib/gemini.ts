// lib/gemini.ts — Gemini API Streaming Client Wrapper
import { GoogleGenAI } from '@google/genai';

export interface StreamOptions {
  system: string;
  user: string;
  temperature?: number;
  responseSchema?: Record<string, unknown>;
  jsonMode?: boolean;
  apiKey?: string;
}

/**
 * Calls the Gemini API with streaming enabled, invoking `onChunk` for each
 * text fragment received. Returns the fully concatenated response text.
 */
export async function callGeminiStream(
  { system, user, temperature = 0.1, responseSchema, jsonMode, apiKey }: StreamOptions,
  onChunk: (chunk: string) => void
): Promise<string> {
  const activeKey = apiKey || process.env.GEMINI_API_KEY;
  if (!activeKey) {
    throw new Error('Missing Gemini API Key. Please enter your API key in the UI settings or set GEMINI_API_KEY on the server.');
  }

  const ai = new GoogleGenAI({ apiKey: activeKey });

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

// app/api/generate/route.ts — SSE Streaming Endpoint
import { NextRequest } from 'next/server';
import { runPipelineSSE } from '@/lib/pipeline';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Creates an SSE streaming response for a given prompt.
 */
function createSSEStream(prompt: string): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await runPipelineSSE(prompt.trim(), {
          onEvent: (sseString: string) => {
            try {
              controller.enqueue(encoder.encode(sseString));
            } catch {
              // Stream may have been closed by the client
            }
          },
        });
      } catch (err) {
        const errorEvent = `event: error\ndata: ${JSON.stringify({
          message: err instanceof Error ? err.message : 'Unknown pipeline error',
        })}\n\n`;
        try {
          controller.enqueue(encoder.encode(errorEvent));
        } catch {
          // Stream closed
        }
      } finally {
        try {
          controller.close();
        } catch {
          // Already closed
        }
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

/**
 * GET /api/generate?prompt=...
 * Used by EventSource on the client side.
 */
export async function GET(req: NextRequest) {
  const prompt = req.nextUrl.searchParams.get('prompt');

  if (!prompt || prompt.trim().length === 0) {
    return new Response(
      JSON.stringify({ error: 'Missing or empty "prompt" query parameter.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!process.env.GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Server misconfiguration: GEMINI_API_KEY is not set.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return createSSEStream(prompt);
}

/**
 * POST /api/generate
 * Accepts: { prompt: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = body?.prompt;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing or empty "prompt" field in request body.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration: GEMINI_API_KEY is not set.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return createSSEStream(prompt);
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: 'Failed to process request.',
        details: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// app/api/generate/route.ts — SSE Streaming Endpoint
import { NextRequest } from 'next/server';
import { runPipelineSSE } from '@/lib/pipeline';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Creates an SSE streaming response for a given prompt.
 */
function createSSEStream(prompt: string, apiKey?: string): Response {
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
          apiKey,
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
 * GET /api/generate?prompt=...&apiKey=...
 * Used by EventSource on the client side.
 */
export async function GET(req: NextRequest) {
  const prompt = req.nextUrl.searchParams.get('prompt');
  const cookieKey = req.cookies.get('genesis_user_api_key')?.value;
  const apiKey = cookieKey || req.nextUrl.searchParams.get('apiKey') || undefined;

  if (!prompt || prompt.trim().length === 0) {
    return new Response(
      JSON.stringify({ error: 'Missing or empty "prompt" query parameter.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!apiKey || apiKey.trim().length === 0) {
    return new Response(
      JSON.stringify({ error: 'Missing Gemini API Key. Please enter your Gemini API Key in the top navigation bar of the studio page to continue.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return createSSEStream(prompt, apiKey);
}

/**
 * POST /api/generate
 * Accepts: { prompt: string, apiKey?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = body?.prompt;
    const cookieKey = req.cookies.get('genesis_user_api_key')?.value;
    const apiKey = cookieKey || body?.apiKey || undefined;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing or empty "prompt" field in request body.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!apiKey || apiKey.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing Gemini API Key. Please enter your Gemini API Key in the top navigation bar of the studio page to continue.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return createSSEStream(prompt, apiKey);
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

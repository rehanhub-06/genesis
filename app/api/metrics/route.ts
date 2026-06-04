// app/api/metrics/route.ts — GET Metrics Endpoint
import { NextRequest } from 'next/server';
import { getAggregatedMetrics, exportMetrics } from '@/lib/metrics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/metrics
 *
 * Query params:
 * - format=raw  → returns the full raw metrics array
 * - (default)   → returns aggregated metrics summary
 *
 * Returns pipeline run metrics: success rate, latency, retries, recent runs.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format');

    if (format === 'raw') {
      const raw = exportMetrics();
      return new Response(JSON.stringify({ metrics: raw, count: raw.length }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const aggregated = getAggregatedMetrics();
    return new Response(JSON.stringify(aggregated), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: 'Failed to retrieve metrics.',
        details: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

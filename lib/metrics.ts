// lib/metrics.ts — Pipeline metrics tracking (in-memory)
import type { PipelineMetrics } from '@/types/schema';

export interface AggregatedMetrics {
  totalRuns: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  averageLatencyMs: number;
  averageRetries: number;
  maxLatencyMs: number;
  minLatencyMs: number;
  recentRuns: PipelineMetrics[];
}

/** Maximum number of runs to keep in memory */
const MAX_HISTORY = 200;

/** In-memory store of pipeline run metrics */
const metricsStore: PipelineMetrics[] = [];

/**
 * Records a completed pipeline run.
 */
export function recordMetrics(metrics: PipelineMetrics): void {
  metricsStore.push(metrics);
  // Evict oldest entries when over capacity
  if (metricsStore.length > MAX_HISTORY) {
    metricsStore.splice(0, metricsStore.length - MAX_HISTORY);
  }
}

/**
 * Creates a new metrics entry with a timer. Call `stop()` when the pipeline
 * run completes to record the final metrics.
 */
export function startMetricsTimer(promptId: string, prompt: string) {
  const startTime = Date.now();
  const stageTimings: Record<string, number> = {};
  let currentStageStart = 0;
  let currentStageName = '';

  return {
    /** Mark the beginning of a pipeline stage */
    startStage(stageName: string) {
      // Close previous stage if open
      if (currentStageName && currentStageStart > 0) {
        stageTimings[currentStageName] = Date.now() - currentStageStart;
      }
      currentStageName = stageName;
      currentStageStart = Date.now();
    },

    /** Finish timing and record metrics */
    stop(result: { success: boolean; retries: number; errors: string[] }) {
      // Close last open stage
      if (currentStageName && currentStageStart > 0) {
        stageTimings[currentStageName] = Date.now() - currentStageStart;
      }

      const entry: PipelineMetrics = {
        promptId,
        prompt,
        success: result.success,
        retries: result.retries,
        latencyMs: Date.now() - startTime,
        errors: result.errors,
        timestamp: new Date().toISOString(),
        stageTimings,
      };

      recordMetrics(entry);
      return entry;
    },
  };
}

/**
 * Returns aggregated metrics across all recorded runs.
 */
export function getAggregatedMetrics(): AggregatedMetrics {
  const total = metricsStore.length;

  if (total === 0) {
    return {
      totalRuns: 0,
      successCount: 0,
      failureCount: 0,
      successRate: 0,
      averageLatencyMs: 0,
      averageRetries: 0,
      maxLatencyMs: 0,
      minLatencyMs: 0,
      recentRuns: [],
    };
  }

  const successCount = metricsStore.filter((m) => m.success).length;
  const totalLatency = metricsStore.reduce((sum, m) => sum + m.latencyMs, 0);
  const totalRetries = metricsStore.reduce((sum, m) => sum + m.retries, 0);
  const latencies = metricsStore.map((m) => m.latencyMs);

  return {
    totalRuns: total,
    successCount,
    failureCount: total - successCount,
    successRate: Math.round((successCount / total) * 10000) / 100, // 2 decimal %
    averageLatencyMs: Math.round(totalLatency / total),
    averageRetries: Math.round((totalRetries / total) * 100) / 100,
    maxLatencyMs: Math.max(...latencies),
    minLatencyMs: Math.min(...latencies),
    recentRuns: metricsStore.slice(-20), // Last 20 runs
  };
}

/**
 * Returns the full raw metrics history.
 */
export function exportMetrics(): PipelineMetrics[] {
  return [...metricsStore];
}

/**
 * Clears all stored metrics (primarily for testing).
 */
export function clearMetrics(): void {
  metricsStore.length = 0;
}

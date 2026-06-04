// lib/pipeline/index.ts — Pipeline Orchestrator
import { extractIntentStream } from './stage1-intent';
import { generateDesignStream } from './stage2-design';
import { generateSchemaStream, parseAndValidateSchema, repairZodErrorsStream } from './stage3-schema';
import { ZodError } from 'zod';
import { validateSchema } from '../validation/validators';
import { repairSchema } from '../validation/repair';
import { startMetricsTimer } from '../metrics';
import { diffSchemas } from '../diff';
import type {
  IntentResult,
  ArchitectureResult,
  AppSchema,
  SSEEvent,
} from '@/types/schema';

/**
 * Generates a short unique prompt ID.
 */
function generatePromptId(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Formats an SSE event string for streaming.
 */
function formatSSE(event: SSEEvent): string {
  return `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`;
}

export interface PipelineCallbacks {
  /** Called with each SSE-formatted string to write to the response stream */
  onEvent: (sseString: string) => void;
}

/**
 * Runs the full 4-stage pipeline with SSE chunk streaming.
 *
 * Flow:
 * 1. Clarification check — if prompt is too vague, return clarification questions
 * 2. Stage 1: Intent Extraction
 * 3. Stage 2: System Design
 * 4. Stage 3: Full Schema Generation (+ Zod validation)
 * 5. Validation + Repair (with diff)
 * 6. Complete event with final schema
 */
export async function runPipelineSSE(
  prompt: string,
  { onEvent }: PipelineCallbacks
): Promise<AppSchema | null> {
  const promptId = generatePromptId();
  const timer = startMetricsTimer(promptId, prompt);
  const errors: string[] = [];

  try {
    // ----------------------------------------------------------------
    // Stage 1: Intent Extraction
    // ----------------------------------------------------------------
    timer.startStage('intent');
    onEvent(formatSSE({
      event: 'stage_start',
      data: { stage: 1, label: 'Extracting intent...', promptId },
    }));

    let intentRaw = '';
    try {
      intentRaw = await extractIntentStream(prompt, (chunk) => {
        onEvent(formatSSE({
          event: 'chunk',
          data: { stage: 1, text: chunk },
        }));
      });
    } catch (err) {
      const msg = `Stage 1 (Intent) failed: ${err instanceof Error ? err.message : String(err)}`;
      errors.push(msg);
      onEvent(formatSSE({ event: 'error', data: { message: msg, stage: 1 } }));
      timer.stop({ success: false, retries: 0, errors });
      return null;
    }

    let intent: IntentResult;
    try {
      intent = JSON.parse(intentRaw) as IntentResult;
    } catch {
      const msg = 'Stage 1 (Intent) produced invalid JSON.';
      errors.push(msg);
      onEvent(formatSSE({ event: 'error', data: { message: msg, stage: 'intent', raw: intentRaw } }));
      timer.stop({ success: false, retries: 0, errors });
      return null;
    }

    // Determine prompt categorization
    let promptType: 'normal' | 'vague' | 'conflicting' = 'normal';
    if (intent.conflicts.length > 0) promptType = 'conflicting';
    else if (intent.ambiguities.length > 0 || intent.is_vague) promptType = 'vague';

    // ----------------------------------------------------------------
    // Clarification Check (AI Driven)
    // ----------------------------------------------------------------
    if (intent.is_vague || intent.conflicts.length > 0) {
      onEvent(formatSSE({
        event: 'clarification_needed',
        data: {
          promptId,
          questions: intent.clarification_questions || ['Could you provide more specific details about the app?'],
          suggestions: intent.conflicts.length > 0 ? ['There seem to be conflicting requirements.'] : [],
        },
      }));

      const finalMetrics = timer.stop({ success: false, retries: 0, errors: ['Prompt requires clarification'] });
      finalMetrics.promptType = promptType;
      return null;
    }

    // ----------------------------------------------------------------
    // Stage 2: System Design
    // ----------------------------------------------------------------
    timer.startStage('design');
    onEvent(formatSSE({
      event: 'stage_start',
      data: { stage: 2, label: 'Designing system architecture...', promptId },
    }));

    let designRaw = '';
    try {
      designRaw = await generateDesignStream(intent, (chunk) => {
        onEvent(formatSSE({
          event: 'chunk',
          data: { stage: 2, text: chunk },
        }));
      });
    } catch (err) {
      const msg = `Stage 2 (Design) failed: ${err instanceof Error ? err.message : String(err)}`;
      errors.push(msg);
      onEvent(formatSSE({ event: 'error', data: { message: msg, stage: 2 } }));
      timer.stop({ success: false, retries: 0, errors });
      return null;
    }

    let architecture: ArchitectureResult;
    try {
      architecture = JSON.parse(designRaw) as ArchitectureResult;
    } catch {
      const msg = 'Stage 2 (Design) produced invalid JSON.';
      errors.push(msg);
      onEvent(formatSSE({ event: 'error', data: { message: msg, stage: 2, raw: designRaw } }));
      timer.stop({ success: false, retries: 0, errors });
      return null;
    }

    // ----------------------------------------------------------------
    // Stage 3: Full Schema Generation
    // ----------------------------------------------------------------
    timer.startStage('schema');
    onEvent(formatSSE({
      event: 'stage_start',
      data: { stage: 3, label: 'Generating full application schema...', promptId },
    }));

    let schemaRaw = '';
    try {
      schemaRaw = await generateSchemaStream(intent, architecture, (chunk) => {
        onEvent(formatSSE({
          event: 'chunk',
          data: { stage: 3, text: chunk },
        }));
      });
    } catch (err) {
      const msg = `Stage 3 (Schema) failed: ${err instanceof Error ? err.message : String(err)}`;
      errors.push(msg);
      onEvent(formatSSE({ event: 'error', data: { message: msg, stage: 3 } }));
      timer.stop({ success: false, retries: 0, errors });
      return null;
    }

    let appSchema: AppSchema | null = null;
    const MAX_RETRIES = 2;
    let attempts = 0;

    while (attempts <= MAX_RETRIES && !appSchema) {
      try {
        appSchema = parseAndValidateSchema(schemaRaw);
      } catch (err) {
        attempts++;
        if (attempts > MAX_RETRIES) {
          const msg = `Stage 3 (Schema) failed after ${MAX_RETRIES} repair attempts: ${err instanceof Error ? err.message : String(err)}`;
          errors.push(msg);
          onEvent(formatSSE({ event: 'error', data: { message: msg, stage: 'schema' } }));
          timer.stop({ success: false, retries: attempts, errors });
          return null;
        }

        let errorDetails = String(err);
        if (err instanceof ZodError) {
          errorDetails = err.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n');
        }

        onEvent(formatSSE({
          event: 'stage_start',
          data: { stage: 3, label: `Repairing syntax errors (Attempt ${attempts})...`, promptId },
        }));

        try {
          schemaRaw = await repairZodErrorsStream(schemaRaw, errorDetails, (chunk) => {
            onEvent(formatSSE({
              event: 'chunk',
              data: { stage: 3, text: chunk },
            }));
          });
        } catch (repairErr) {
          const msg = `Stage 3.5 (Targeted Repair) failed: ${repairErr instanceof Error ? repairErr.message : String(repairErr)}`;
          errors.push(msg);
          onEvent(formatSSE({ event: 'error', data: { message: msg, stage: 3 } }));
          timer.stop({ success: false, retries: attempts, errors });
          return null;
        }
      }
    }

    // TypeScript doesn't know appSchema is definitely assigned here despite the while loop conditions
    if (!appSchema) return null;

    // ----------------------------------------------------------------
    // Stage 4: Validation + Repair
    // ----------------------------------------------------------------
    timer.startStage('validation');
    onEvent(formatSSE({
      event: 'validation_start',
      data: { stage: 4, label: 'Running cross-layer validation...', promptId },
    }));

    const validationErrors = validateSchema(appSchema);

    let remainingErrorsCount = 0;
    let autoRepairedCount = 0;
    const baseChecksCount = 18; // As requested in the mock

    if (validationErrors.length > 0) {
      onEvent(formatSSE({
        event: 'stage_start',
        data: {
          stage: 4,
          label: `Found ${validationErrors.length} issue(s) — repairing...`,
          promptId,
          errorCount: validationErrors.length,
        },
      }));

      timer.startStage('repair');
      const beforeRepair = appSchema;

      const repairResult = await repairSchema(appSchema, (chunk) => {
        onEvent(formatSSE({
          event: 'chunk',
          data: { stage: 4, text: chunk },
        }));
      });

      appSchema = repairResult.schema;
      remainingErrorsCount = repairResult.remainingErrors.length;
      autoRepairedCount = validationErrors.length - remainingErrorsCount;

      // Compute diff between pre-repair and post-repair
      const schemaDiff = diffSchemas(beforeRepair, appSchema);

      onEvent(formatSSE({
        event: 'chunk',
        data: {
          stage: 4,
          repairLog: repairResult.repairLog,
          wasRepaired: repairResult.wasRepaired,
          remainingErrors: remainingErrorsCount,
          diff: schemaDiff.summary,
        },
      }));

      if (remainingErrorsCount > 0) {
        for (const re of repairResult.remainingErrors) {
          errors.push(`Unresolved: ${re.message}`);
        }
      }
    }

    const passedChecksCount = Math.max(0, baseChecksCount - validationErrors.length);

    // ----------------------------------------------------------------
    // Complete
    // ----------------------------------------------------------------
    const finalMetrics = timer.stop({
      success: true,
      retries: validationErrors.length > 0 ? 1 : 0,
      errors,
    });
    finalMetrics.promptType = promptType;
    finalMetrics.validationStats = {
      passedChecks: passedChecksCount,
      issuesFound: validationErrors.length,
      autoRepaired: autoRepairedCount,
    };

    onEvent(formatSSE({
      event: 'complete',
      data: {
        promptId,
        schema: appSchema,
        validationStats: finalMetrics.validationStats,
        metrics: finalMetrics
      },
    }));

    return appSchema;
  } catch (err) {
    const msg = `Pipeline failed: ${err instanceof Error ? err.message : String(err)}`;
    errors.push(msg);
    onEvent(formatSSE({ event: 'error', data: { message: msg } }));
    timer.stop({ success: false, retries: 0, errors });
    return null;
  }
}

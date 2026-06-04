// app/api/validate/route.ts — Standalone Validation Endpoint
import { NextRequest } from 'next/server';
import { AppSchemaObj } from '@/lib/validation/schema';
import {
  validateSchema,
  groupErrorsByType,
  isSchemaValid,
} from '@/lib/validation/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/validate
 *
 * Accepts: { schema: AppSchema }
 * Returns: {
 *   valid: boolean,
 *   errorCount: number,
 *   errors: ValidationError[],
 *   errorsByType: Record<string, ValidationError[]>,
 *   zodErrors?: string[]
 * }
 *
 * First validates the schema against Zod, then runs cross-layer validators.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawSchema = body?.schema;

    if (!rawSchema || typeof rawSchema !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid "schema" field in request body.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 1: Zod schema validation
    const zodResult = AppSchemaObj.safeParse(rawSchema);

    if (!zodResult.success) {
      const zodErrors = zodResult.error.issues.map(
        (e) => `${e.path.join('.')}: ${e.message}`
      );

      return new Response(
        JSON.stringify({
          valid: false,
          errorCount: zodErrors.length,
          errors: [],
          errorsByType: {},
          zodErrors,
          message: 'Schema does not conform to the AppSchema Zod definition.',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 2: Cross-layer validation
    const schema = zodResult.data;
    const validationErrors = validateSchema(schema);
    const grouped = groupErrorsByType(validationErrors);

    return new Response(
      JSON.stringify({
        valid: validationErrors.length === 0,
        errorCount: validationErrors.length,
        errors: validationErrors,
        errorsByType: grouped,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: 'Failed to validate schema.',
        details: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

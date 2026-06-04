// lib/validation/validators.ts — Cross-layer validation checks
import type { AppSchema, UIPage, APIEndpoint, DBTable } from '@/types/schema';

export type ValidationErrorType =
  | 'MISSING_ROLE'
  | 'FIELD_MISMATCH'
  | 'INVALID_TABLE_REF'
  | 'ORPHAN_API';

export interface ValidationError {
  type: ValidationErrorType;
  message: string;
  path: string;
  suggestion?: string;
}

/**
 * Collects all DB table names from the schema.
 */
function getTableNames(schema: AppSchema): Set<string> {
  return new Set(schema.database.map((t) => t.name));
}

/**
 * Collects all DB column names for a specific table.
 */
function getTableColumnNames(schema: AppSchema, tableName: string): Set<string> {
  const table = schema.database.find((t) => t.name === tableName);
  if (!table) return new Set();
  return new Set(table.columns.map((c) => c.name));
}

/**
 * Collects all defined auth roles.
 */
function getAuthRoles(schema: AppSchema): Set<string> {
  return new Set(schema.auth.roles);
}

/**
 * Finds the closest match to `target` from a set of candidates using
 * simple Levenshtein-like similarity.
 */
function findClosestMatch(target: string, candidates: Set<string>): string | undefined {
  let bestMatch: string | undefined;
  let bestDistance = Infinity;

  for (const candidate of candidates) {
    const distance = levenshteinDistance(target.toLowerCase(), candidate.toLowerCase());
    if (distance < bestDistance && distance <= Math.max(target.length, candidate.length) * 0.5) {
      bestDistance = distance;
      bestMatch = candidate;
    }
  }

  return bestMatch;
}

/**
 * Levenshtein distance between two strings.
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[a.length][b.length];
}

/* ------------------------------------------------------------------ */
/*  Individual Validators                                             */
/* ------------------------------------------------------------------ */

/**
 * Check: Every role referenced in pages exists in auth.roles.
 */
function validateRoles(schema: AppSchema): ValidationError[] {
  const errors: ValidationError[] = [];
  const authRoles = getAuthRoles(schema);

  for (const page of schema.pages) {
    if (page.roles) {
      for (const role of page.roles) {
        if (!authRoles.has(role)) {
          errors.push({
            type: 'MISSING_ROLE',
            message: `Page "${page.name}" references role "${role}" which is not defined in auth.roles [${Array.from(authRoles).join(', ')}].`,
            path: `pages.${page.id}.roles`,
            suggestion: `Add "${role}" to auth.roles array.`,
          });
        }
      }
    }
  }

  // Also check API endpoint roles
  for (const endpoint of schema.api) {
    if (endpoint.roles) {
      for (const role of endpoint.roles) {
        if (!authRoles.has(role)) {
          errors.push({
            type: 'MISSING_ROLE',
            message: `API endpoint "${endpoint.id}" references role "${role}" which is not defined in auth.roles.`,
            path: `api.${endpoint.id}.roles`,
            suggestion: `Add "${role}" to auth.roles array.`,
          });
        }
      }
    }
  }

  return errors;
}

/**
 * Check: Every form field in UI components has a matching DB column in
 * a related table (determined via API endpoint → table mapping).
 */
function validateFieldMappings(schema: AppSchema): ValidationError[] {
  const errors: ValidationError[] = [];
  const tableNames = getTableNames(schema);

  // Build a map of which tables serve which pages via API endpoints
  // First, map paths to tables
  const pathToTables = new Map<string, Set<string>>();
  for (const endpoint of schema.api) {
    // Extract the base resource path (e.g., /api/users → users)
    const segments = endpoint.path.split('/').filter(Boolean);
    const basePath = segments[0] === 'api' ? segments[1] : segments[0];
    if (basePath) {
      if (!pathToTables.has(basePath)) {
        pathToTables.set(basePath, new Set());
      }
      pathToTables.get(basePath)!.add(endpoint.table);
    }
    // Also map by table name directly
    if (!pathToTables.has(endpoint.table)) {
      pathToTables.set(endpoint.table, new Set());
    }
    pathToTables.get(endpoint.table)!.add(endpoint.table);
  }

  for (const page of schema.pages) {
    // Determine which tables are related to this page
    const pageBase = page.path.split('/').filter(Boolean)[0] || '';
    const relatedTables = pathToTables.get(pageBase) ?? new Set<string>();

    // If we can't determine the related table, check against all tables
    const tablesToCheck = relatedTables.size > 0 ? relatedTables : tableNames;

    for (const component of page.components) {
      if (component.type === 'form' && component.fields) {
        for (const field of component.fields) {
          let found = false;
          for (const tableName of tablesToCheck) {
            const columns = getTableColumnNames(schema, tableName);
            if (columns.has(field.name)) {
              found = true;
              break;
            }
          }

          if (!found) {
            // Try to find a close match in any table
            const allColumns = new Set<string>();
            for (const table of schema.database) {
              for (const col of table.columns) {
                allColumns.add(col.name);
              }
            }
            const closest = findClosestMatch(field.name, allColumns);

            errors.push({
              type: 'FIELD_MISMATCH',
              message: `Form field "${field.name}" in component "${component.id}" on page "${page.name}" has no matching DB column.`,
              path: `pages.${page.id}.components.${component.id}.fields.${field.name}`,
              suggestion: closest
                ? `Did you mean "${closest}"? Or add column "${field.name}" to the relevant table.`
                : `Add column "${field.name}" to the relevant database table.`,
            });
          }
        }
      }
    }
  }

  return errors;
}

/**
 * Check: Every API endpoint references a valid DB table.
 */
function validateTableReferences(schema: AppSchema): ValidationError[] {
  const errors: ValidationError[] = [];
  const tableNames = getTableNames(schema);

  for (const endpoint of schema.api) {
    if (!tableNames.has(endpoint.table)) {
      const closest = findClosestMatch(endpoint.table, tableNames);
      errors.push({
        type: 'INVALID_TABLE_REF',
        message: `API endpoint "${endpoint.id}" (${endpoint.method} ${endpoint.path}) references table "${endpoint.table}" which does not exist.`,
        path: `api.${endpoint.id}.table`,
        suggestion: closest
          ? `Did you mean "${closest}"?`
          : `Create a table named "${endpoint.table}" in the database schema.`,
      });
    }
  }

  return errors;
}

/**
 * Check: Every API endpoint is referenced by at least one page component action,
 * or at least relates to a page's content (not orphaned).
 */
function validateOrphanAPIs(schema: AppSchema): ValidationError[] {
  const errors: ValidationError[] = [];

  // Collect all API paths and tables referenced from pages
  const referencedTables = new Set<string>();
  const referencedActions = new Set<string>();

  for (const page of schema.pages) {
    // The page path segments often relate to API paths
    const pageSegments = page.path.split('/').filter(Boolean);
    for (const seg of pageSegments) {
      referencedTables.add(seg);
    }

    for (const component of page.components) {
      // Button/form actions reference API endpoints
      if (component.action) {
        referencedActions.add(component.action);
      }

      // Table components implicitly need GET endpoints for their data
      if (component.type === 'table') {
        // The table data comes from some API — mark related page path
        referencedTables.add(pageSegments[0] || '');
      }

      // Form components implicitly need POST/PUT endpoints
      if (component.type === 'form') {
        referencedTables.add(pageSegments[0] || '');
      }
    }
  }

  for (const endpoint of schema.api) {
    const endpointPathBase = endpoint.path.split('/').filter(Boolean);
    const apiBase = endpointPathBase[0] === 'api'
      ? endpointPathBase[1]
      : endpointPathBase[0];

    // Check if the endpoint's table is related to any page
    const isReferenced =
      referencedTables.has(endpoint.table) ||
      referencedTables.has(apiBase || '') ||
      referencedActions.has(endpoint.path) ||
      referencedActions.has(endpoint.id);

    if (!isReferenced) {
      errors.push({
        type: 'ORPHAN_API',
        message: `API endpoint "${endpoint.id}" (${endpoint.method} ${endpoint.path}) is not referenced by any page component.`,
        path: `api.${endpoint.id}`,
        suggestion: `Add a component to one of the pages that uses this endpoint, or remove it if it's unnecessary.`,
      });
    }
  }

  return errors;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

/**
 * Runs all cross-layer validation checks on an AppSchema.
 * Returns an array of typed ValidationError objects.
 */
export function validateSchema(schema: AppSchema): ValidationError[] {
  return [
    ...validateRoles(schema),
    ...validateFieldMappings(schema),
    ...validateTableReferences(schema),
    ...validateOrphanAPIs(schema),
  ];
}

/**
 * Returns true if the schema has no validation errors.
 */
export function isSchemaValid(schema: AppSchema): boolean {
  return validateSchema(schema).length === 0;
}

/**
 * Groups validation errors by type for easier reporting.
 */
export function groupErrorsByType(
  errors: ValidationError[]
): Record<ValidationErrorType, ValidationError[]> {
  const groups: Record<ValidationErrorType, ValidationError[]> = {
    MISSING_ROLE: [],
    FIELD_MISMATCH: [],
    INVALID_TABLE_REF: [],
    ORPHAN_API: [],
  };

  for (const err of errors) {
    groups[err.type].push(err);
  }

  return groups;
}

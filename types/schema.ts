// types/schema.ts — Extracted TypeScript types from Zod Schema
// These types are inferred from the Zod schemas and used throughout the app.

export type FieldType = "text" | "email" | "password" | "number" | "date" | "select";
export type ComponentType = "table" | "form" | "stats" | "button" | "card" | "navbar" | "chart";
export type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE";
export type DBColumnType = "string" | "integer" | "boolean" | "timestamp" | "float";

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
}

export interface TableColumn {
  name: string;
  label: string;
  sortable?: boolean;
}

export interface StatItem {
  label: string;
  value: string;
  icon?: string;
}

export interface UIComponent {
  id: string;
  type: ComponentType;
  title?: string;
  columns?: TableColumn[];
  fields?: FormField[];
  submitLabel?: string;
  stats?: StatItem[];
  label?: string;
  variant?: "primary" | "secondary" | "danger" | "outline";
  action?: string;
}

export interface UIPage {
  id: string;
  name: string;
  path: string;
  icon?: string;
  roles?: string[];
  components: UIComponent[];
}

export interface APIEndpoint {
  id: string;
  path: string;
  method: HTTPMethod;
  description: string;
  table: string;
  requiresAuth: boolean;
  roles?: string[];
  inputFields?: string[];
  outputFields?: string[];
}

export interface DBColumn {
  name: string;
  type: DBColumnType;
  required: boolean;
  unique?: boolean;
  default?: string;
  references?: string;
}

export interface DBTable {
  name: string;
  columns: DBColumn[];
}

export interface AppSchema {
  app_name: string;
  app_type: string;
  description: string;
  assumptions: Array<{
    field: string;
    assumed: string;
    reason: string;
  }>;
  auth: {
    enabled: boolean;
    roles: string[];
    loginPage: string;
    defaultRole: string;
  };
  pages: UIPage[];
  api: APIEndpoint[];
  database: DBTable[];
  generated_at: string;
  pipeline_version: string;
}

// Pipeline stage types
export interface IntentResult {
  app_type: string;
  core_purpose: string;
  features: string[];
  entities: string[];
  roles: string[];
  auth_required: boolean;
  ambiguities: string[];
  conflicts: string[];
  is_vague: boolean;
  clarification_questions: string[];
}

export interface ArchitectureResult {
  pages: Array<{
    name: string;
    path: string;
    purpose: string;
    visible_to_roles: string[];
    components_needed: string[];
  }>;
  user_flows: string[];
  entities: Record<string, {
    fields: string[];
    relations: string[];
  }>;
  api_operations: Array<{
    operation: string;
    entity: string;
    method: string;
    auth_required: boolean;
  }>;
}

// SSE Event types
export type SSEEventType =
  | "stage_start"
  | "chunk"
  | "validation_start"
  | "complete"
  | "error"
  | "clarification_needed";

export interface SSEEvent {
  event: SSEEventType;
  data: Record<string, unknown>;
}

// Pipeline metrics
export interface PipelineMetrics {
  promptId: string;
  prompt: string;
  promptType?: "normal" | "vague" | "conflicting";
  success: boolean;
  retries: number;
  latencyMs: number;
  errors: string[];
  timestamp: string;
  stageTimings?: Record<string, number>;
  validationStats?: {
    passedChecks: number;
    issuesFound: number;
    autoRepaired: number;
  };
}

// Clarification types
export interface ClarificationResult {
  isTooVague: boolean;
  questions: string[];
  suggestions?: string[];
}

// lib/validation/schema.ts — Zod Schema definition (The Source of Truth Contract)
import { z } from "zod";

export const FieldTypeSchema = z.enum(["text", "email", "password", "number", "date", "select"]);
export const ComponentTypeSchema = z.enum(["table", "form", "stats", "button", "card", "navbar", "chart"]);
export const HTTPMethodSchema = z.enum(["GET", "POST", "PUT", "DELETE"]);
export const DBColumnTypeSchema = z.enum(["string", "integer", "boolean", "timestamp", "float"]);

export const FormFieldSchema = z.object({
  name: z.string(),
  label: z.string(),
  type: FieldTypeSchema,
  required: z.boolean(),
  options: z.array(z.string()).optional()
});

export const TableColumnSchema = z.object({
  name: z.string(),
  label: z.string(),
  sortable: z.boolean().optional()
});

export const StatItemSchema = z.object({
  label: z.string(),
  value: z.string(),
  icon: z.string().optional()
});

export const UIComponentSchema = z.object({
  id: z.string(),
  type: ComponentTypeSchema,
  title: z.string().optional(),
  columns: z.array(TableColumnSchema).optional(),
  fields: z.array(FormFieldSchema).optional(),
  submitLabel: z.string().optional(),
  stats: z.array(StatItemSchema).optional(),
  label: z.string().optional(),
  variant: z.enum(["primary", "secondary", "danger", "outline"]).optional(),
  action: z.string().optional()
});

export const UIPageSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  icon: z.string().optional(),
  roles: z.array(z.string()).optional(),
  components: z.array(UIComponentSchema)
});

export const APIEndpointSchema = z.object({
  id: z.string(),
  path: z.string(),
  method: HTTPMethodSchema,
  description: z.string(),
  table: z.string(),
  requiresAuth: z.boolean(),
  roles: z.array(z.string()).optional(),
  inputFields: z.array(z.string()).optional(),
  outputFields: z.array(z.string()).optional()
});

export const DBColumnSchema = z.object({
  name: z.string(),
  type: DBColumnTypeSchema,
  required: z.boolean(),
  unique: z.boolean().optional(),
  default: z.string().optional(),
  references: z.string().optional()
});

export const DBTableSchema = z.object({
  name: z.string(),
  columns: z.array(DBColumnSchema)
});

export const AppSchemaObj = z.object({
  app_name: z.string(),
  app_type: z.string(),
  description: z.string(),
  assumptions: z.array(z.object({
    field: z.string(),
    assumed: z.string(),
    reason: z.string()
  })),
  auth: z.object({
    enabled: z.boolean(),
    roles: z.array(z.string()),
    loginPage: z.string(),
    defaultRole: z.string()
  }),
  pages: z.array(UIPageSchema),
  api: z.array(APIEndpointSchema),
  database: z.array(DBTableSchema),
  generated_at: z.string(),
  pipeline_version: z.string()
});

export type AppSchema = z.infer<typeof AppSchemaObj>;

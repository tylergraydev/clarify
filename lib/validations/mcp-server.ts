import { z } from 'zod';

/** Valid transport types for MCP servers */
export const mcpServerTransports = ['stdio', 'sse', 'http'] as const;

/** Name pattern: letters, numbers, hyphens, underscores */
const nameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(100)
  .regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, hyphens, and underscores');

/**
 * Schema for creating/updating an MCP server via the settings form.
 * Uses a discriminated union on `transport` to enforce transport-specific fields.
 */
export const mcpServerFormSchema = z.discriminatedUnion('transport', [
  z.object({
    args: z.string().optional(),
    command: z.string().trim().min(1, 'Command is required'),
    env: z.string().optional(),
    name: nameSchema,
    transport: z.literal('stdio'),
  }),
  z.object({
    headers: z.string().optional(),
    name: nameSchema,
    transport: z.literal('sse'),
    url: z.string().trim().url('A valid URL is required'),
  }),
  z.object({
    headers: z.string().optional(),
    name: nameSchema,
    transport: z.literal('http'),
    url: z.string().trim().url('A valid URL is required'),
  }),
]);

export type McpServerFormValues = z.infer<typeof mcpServerFormSchema>;

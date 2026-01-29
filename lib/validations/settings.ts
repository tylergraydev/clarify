import { z } from 'zod';

/**
 * Pause behavior options for workflow settings
 * Maps to database pause_behavior column values
 */
export const pauseBehaviorOptions = [
  'continuous',
  'auto-pause',
  'quality-gates',
] as const;

/**
 * Workflow settings schema
 * Controls default pause behavior and step timeout constraints
 */
export const workflowSettingsSchema = z.object({
  defaultPauseBehavior: z.enum(pauseBehaviorOptions),
  stepTimeoutSeconds: z
    .number()
    .min(10, 'Minimum timeout is 10 seconds')
    .max(600, 'Maximum timeout is 600 seconds'),
});

export type WorkflowSettingsFormValues = z.infer<typeof workflowSettingsSchema>;

/**
 * Worktree settings schema
 * Controls git worktree behavior and cleanup
 */
export const worktreeSettingsSchema = z.object({
  autoCleanup: z.boolean(),
  createFeatureBranch: z.boolean(),
  pushOnCompletion: z.boolean(),
  worktreeLocation: z.string().min(1, 'Worktree location is required'),
});

export type WorktreeSettingsFormValues = z.infer<typeof worktreeSettingsSchema>;

/**
 * Logging settings schema
 * Controls log retention, export behavior, and storage location
 */
export const loggingSettingsSchema = z.object({
  exportLogsWithDatabase: z.boolean(),
  includeCliOutput: z.boolean(),
  logExportLocation: z.string().min(1, 'Log export location is required'),
  logRetentionDays: z
    .number()
    .min(1, 'Minimum retention is 1 day')
    .max(365, 'Maximum retention is 365 days'),
});

export type LoggingSettingsFormValues = z.infer<typeof loggingSettingsSchema>;

/**
 * Combined settings form schema
 * Encompasses all settings categories for full form validation
 */
export const settingsFormSchema = z.object({
  logging: loggingSettingsSchema,
  workflow: workflowSettingsSchema,
  worktree: worktreeSettingsSchema,
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;

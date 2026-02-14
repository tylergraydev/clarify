import { z } from 'zod';

/**
 * Pause behavior options for workflow settings
 * Maps to database pause_behavior column values
 */
export const pauseBehaviorOptions = ['continuous', 'auto-pause'] as const;

/**
 * Workflow settings schema
 * Controls default pause behavior and per-step-type timeout constraints
 */
export const workflowSettingsSchema = z.object({
  clarificationTimeoutSeconds: z
    .number()
    .min(10, 'Minimum timeout is 10 seconds')
    .max(600, 'Maximum timeout is 600 seconds'),
  defaultPauseBehavior: z.enum(pauseBehaviorOptions),
  discoveryTimeoutSeconds: z
    .number()
    .min(10, 'Minimum timeout is 10 seconds')
    .max(600, 'Maximum timeout is 600 seconds'),
  implementationTimeoutSeconds: z
    .number()
    .min(10, 'Minimum timeout is 10 seconds')
    .max(600, 'Maximum timeout is 600 seconds'),
  planningTimeoutSeconds: z
    .number()
    .min(10, 'Minimum timeout is 10 seconds')
    .max(600, 'Maximum timeout is 600 seconds'),
  refinementTimeoutSeconds: z
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
  logRetentionDays: z.number().min(1, 'Minimum retention is 1 day').max(365, 'Maximum retention is 365 days'),
});

export type LoggingSettingsFormValues = z.infer<typeof loggingSettingsSchema>;

/**
 * Chat settings schema
 * Controls conversation title generation and compaction behavior
 */
export const chatSettingsSchema = z.object({
  autoGenerateTitle: z.boolean(),
  autoPromptCompaction: z.boolean(),
  compactionTokenThreshold: z
    .number()
    .min(20000, 'Minimum threshold is 20,000 tokens')
    .max(200000, 'Maximum threshold is 200,000 tokens'),
  titleRegenerateInterval: z
    .number()
    .min(5, 'Minimum interval is 5 messages')
    .max(50, 'Maximum interval is 50 messages'),
});

export type ChatSettingsFormValues = z.infer<typeof chatSettingsSchema>;

/**
 * Terminal settings schema
 * Controls terminal appearance and behavior
 */
export const terminalSettingsSchema = z.object({
  cursorBlink: z.boolean(),
  fontFamily: z.string(),
  fontSize: z
    .number()
    .min(8, 'Minimum font size is 8')
    .max(32, 'Maximum font size is 32'),
  scrollback: z
    .number()
    .min(100, 'Minimum scrollback is 100 lines')
    .max(10000, 'Maximum scrollback is 10,000 lines'),
  shellPath: z.string(),
});

export type TerminalSettingsFormValues = z.infer<typeof terminalSettingsSchema>;

/**
 * Combined settings form schema
 * Encompasses all settings categories for full form validation
 */
export const settingsFormSchema = z.object({
  chat: chatSettingsSchema,
  logging: loggingSettingsSchema,
  terminal: terminalSettingsSchema,
  workflow: workflowSettingsSchema,
  worktree: worktreeSettingsSchema,
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;

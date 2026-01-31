import { z } from 'zod';

import { agentHookEventTypes } from '../../db/schema/agent-hooks.schema';
import { agentColors, agentModels, agentPermissionModes, agentTypes } from '../../db/schema/agents.schema';

// Agent tool input schema for validating tool configuration
export const agentToolInputSchema = z.object({
  name: z.string().trim().min(1, 'Tool name is required').max(255, 'Tool name is too long'),
  pattern: z.string().trim().max(1000, 'Pattern is too long').optional(),
});

export type AgentToolInput = z.infer<typeof agentToolInputSchema>;

// Agent skill input schema for validating skill configuration
export const agentSkillInputSchema = z.object({
  name: z.string().trim().min(1, 'Skill name is required').max(255, 'Skill name is too long'),
});

export type AgentSkillInput = z.infer<typeof agentSkillInputSchema>;

// Create agent skill schema for repository validation
export const createAgentSkillSchema = z.object({
  agentId: z.number().int().positive('Invalid agent ID'),
  orderIndex: z.number().int().nonnegative('Order index must be non-negative').optional(),
  requiredAt: z.string().nullable().optional(),
  skillName: z.string().trim().min(1, 'Skill name is required').max(255, 'Skill name is too long'),
});

export type CreateAgentSkillInput = z.infer<typeof createAgentSkillSchema>;

// Update agent skill schema for repository validation
export const updateAgentSkillSchema = z.object({
  orderIndex: z.number().int().nonnegative('Order index must be non-negative').optional(),
  requiredAt: z.string().nullable().optional(),
  skillName: z.string().trim().min(1, 'Skill name is required').max(255, 'Skill name is too long').optional(),
});

export type UpdateAgentSkillInput = z.infer<typeof updateAgentSkillSchema>;

// Create agent tool schema for repository validation
export const createAgentToolSchema = z.object({
  agentId: z.number().int().positive('Invalid agent ID'),
  disallowedAt: z.string().nullable().optional(),
  orderIndex: z.number().int().nonnegative('Order index must be non-negative').optional(),
  toolName: z.string().trim().min(1, 'Tool name is required').max(255, 'Tool name is too long'),
  toolPattern: z.string().trim().max(1000, 'Pattern is too long').optional(),
});

export type CreateAgentToolInput = z.infer<typeof createAgentToolSchema>;

// Update agent tool schema for repository validation
export const updateAgentToolSchema = z.object({
  disallowedAt: z.string().nullable().optional(),
  orderIndex: z.number().int().nonnegative('Order index must be non-negative').optional(),
  toolName: z.string().trim().min(1, 'Tool name is required').max(255, 'Tool name is too long').optional(),
  toolPattern: z.string().trim().max(1000, 'Pattern is too long').optional(),
});

export type UpdateAgentToolInput = z.infer<typeof updateAgentToolSchema>;

// Create agent schema for repository validation
export const createAgentSchema = z.object({
  builtInAt: z.string().nullable().optional(),
  color: z.enum(agentColors).optional(),
  deactivatedAt: z.string().optional(),
  description: z.string().trim().max(1000, 'Description is too long').optional(),
  displayName: z.string().trim().min(1, 'Display name is required').max(255, 'Display name is too long'),
  model: z.enum(agentModels).nullable().optional(),
  name: z
    .string()
    .trim()
    .min(1, 'Agent name is required')
    .max(100, 'Agent name is too long')
    .regex(
      /^[a-z][a-z0-9-]*$/,
      'Agent name must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens'
    ),
  parentAgentId: z.number().int().positive('Invalid parent agent ID').nullable().optional(),
  permissionMode: z.enum(agentPermissionModes).nullable().optional(),
  projectId: z.number().int().positive('Invalid project ID').nullable().optional(),
  systemPrompt: z.string().trim().min(1, 'System prompt is required').max(50000, 'System prompt is too long'),
  type: z.enum(agentTypes, {
    error: 'Please select a valid agent type',
  }),
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;

// Create agent form schema for dialog validation
// This is designed for form input in the create agent dialog
// Note: color is managed via state in the dialog but validated here for form submission
// Note: projectId is optional - when provided, creates a project-scoped agent
// Note: model and permissionMode use union with empty string for form input (inherit/default)
export const createAgentFormSchema = z.object({
  color: z.enum(agentColors, { message: 'Please select a color' }),
  description: z.string().trim().max(1000, 'Description is too long').optional(),
  displayName: z.string().trim().min(1, 'Display name is required').max(255, 'Display name is too long'),
  model: z.union([z.enum(agentModels), z.literal('')]).optional(),
  name: z
    .string()
    .trim()
    .min(1, 'Agent name is required')
    .max(100, 'Agent name is too long')
    .regex(
      /^[a-z][a-z0-9-]*$/,
      'Agent name must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens'
    ),
  permissionMode: z.union([z.enum(agentPermissionModes), z.literal('')]).optional(),
  projectId: z.number().int().positive('Invalid project ID').nullable().optional(),
  systemPrompt: z.string().trim().min(1, 'System prompt is required').max(50000, 'System prompt is too long'),
  type: z.enum(agentTypes, {
    error: 'Please select an agent type',
  }),
});

export type CreateAgentFormData = z.infer<typeof createAgentFormSchema>;

// Note: color is included in the schema for validation, though it's managed via state in AgentEditorDialog
// The form field component handles the state management while this schema validates on submit
// Note: model and permissionMode use union with empty string for form input (inherit/default)
export const updateAgentSchema = z.object({
  color: z.union([z.enum(agentColors), z.literal('')]).optional(),
  description: z.string().trim().max(1000, 'Description is too long').optional(),
  displayName: z.string().trim().min(1, 'Display name is required').max(255, 'Display name is too long'),
  model: z.union([z.enum(agentModels), z.literal('')]).optional(),
  permissionMode: z.union([z.enum(agentPermissionModes), z.literal('')]).optional(),
  systemPrompt: z.string().trim().min(1, 'System prompt is required').max(50000, 'System prompt is too long'),
});

export type UpdateAgentFormValues = z.input<typeof updateAgentSchema>;
export type UpdateAgentOutput = z.output<typeof updateAgentSchema>;

// Repository update schema - includes all fields that can be updated
export const updateAgentRepositorySchema = z.object({
  builtInAt: z.string().nullable().optional(),
  color: z.enum(agentColors).nullable().optional(),
  deactivatedAt: z.string().nullable().optional(),
  description: z.string().trim().max(1000, 'Description is too long').nullable().optional(),
  displayName: z.string().trim().min(1, 'Display name is required').max(255, 'Display name is too long').optional(),
  model: z.enum(agentModels).nullable().optional(),
  name: z
    .string()
    .trim()
    .min(1, 'Agent name is required')
    .max(100, 'Agent name is too long')
    .regex(
      /^[a-z][a-z0-9-]*$/,
      'Agent name must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens'
    )
    .optional(),
  parentAgentId: z.number().int().positive('Invalid parent agent ID').nullable().optional(),
  permissionMode: z.enum(agentPermissionModes).nullable().optional(),
  projectId: z.number().int().positive('Invalid project ID').nullable().optional(),
  systemPrompt: z
    .string()
    .trim()
    .min(1, 'System prompt is required')
    .max(50000, 'System prompt is too long')
    .optional(),
  type: z
    .enum(agentTypes, {
      error: 'Please select a valid agent type',
    })
    .optional(),
});

export type UpdateAgentRepositoryInput = z.infer<typeof updateAgentRepositorySchema>;

// Agent hook schemas for repository validation
export const createAgentHookSchema = z.object({
  agentId: z.number().int().positive('Invalid agent ID'),
  body: z.string().trim().min(1, 'Hook body is required'),
  eventType: z.enum(agentHookEventTypes, {
    error: 'Please select a valid event type (PreToolUse, PostToolUse, or Stop)',
  }),
  matcher: z.string().trim().nullable().optional(),
  orderIndex: z.number().int().nonnegative('Order index must be non-negative').optional(),
});

export type CreateAgentHookInput = z.infer<typeof createAgentHookSchema>;

export const updateAgentHookSchema = z.object({
  body: z.string().trim().min(1, 'Hook body is required').optional(),
  eventType: z
    .enum(agentHookEventTypes, {
      error: 'Please select a valid event type (PreToolUse, PostToolUse, or Stop)',
    })
    .optional(),
  matcher: z.string().trim().nullable().optional(),
  orderIndex: z.number().int().nonnegative('Order index must be non-negative').optional(),
});

export type UpdateAgentHookInput = z.infer<typeof updateAgentHookSchema>;

export const updateAgentHookOrderSchema = z.object({
  orderIndex: z.number().int().nonnegative('Order index must be non-negative'),
});

export type UpdateAgentHookOrderInput = z.infer<typeof updateAgentHookOrderSchema>;

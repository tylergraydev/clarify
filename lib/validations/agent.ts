import { z } from 'zod';

import { agentColors, agentModels, agentPermissionModes, agentTypes } from '../../db/schema/agents.schema';

// Agent tool input schema for validating tool configuration
export const agentToolInputSchema = z.object({
  name: z.string().min(1, 'Tool name is required').max(255, 'Tool name is too long'),
  pattern: z.string().max(1000, 'Pattern is too long').optional(),
});

export type AgentToolInput = z.infer<typeof agentToolInputSchema>;

// Agent skill input schema for validating skill configuration
export const agentSkillInputSchema = z.object({
  name: z.string().min(1, 'Skill name is required').max(255, 'Skill name is too long'),
});

export type AgentSkillInput = z.infer<typeof agentSkillInputSchema>;

// Create agent schema for repository validation
export const createAgentSchema = z.object({
  builtInAt: z.string().nullable().optional(),
  color: z.enum(agentColors).optional(),
  deactivatedAt: z.string().optional(),
  description: z.string().max(1000, 'Description is too long').optional(),
  displayName: z.string().min(1, 'Display name is required').max(255, 'Display name is too long'),
  model: z.enum(agentModels).nullable().optional(),
  name: z
    .string()
    .min(1, 'Agent name is required')
    .max(255, 'Agent name is too long')
    .regex(
      /^[a-z][a-z0-9-]*$/,
      'Agent name must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens'
    ),
  parentAgentId: z.number().int().positive('Invalid parent agent ID').nullable().optional(),
  permissionMode: z.enum(agentPermissionModes).nullable().optional(),
  projectId: z.number().int().positive('Invalid project ID').nullable().optional(),
  systemPrompt: z.string().min(1, 'System prompt is required').max(50000, 'System prompt is too long'),
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
  description: z.string().max(1000, 'Description is too long').optional(),
  displayName: z.string().min(1, 'Display name is required').max(255, 'Display name is too long'),
  model: z.union([z.enum(agentModels), z.literal('')]).optional(),
  name: z
    .string()
    .min(1, 'Agent name is required')
    .max(100, 'Agent name is too long')
    .regex(
      /^[a-z][a-z0-9-]*$/,
      'Agent name must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens'
    ),
  permissionMode: z.union([z.enum(agentPermissionModes), z.literal('')]).optional(),
  projectId: z.number().int().positive('Invalid project ID').nullable().optional(),
  systemPrompt: z.string().min(1, 'System prompt is required').max(50000, 'System prompt is too long'),
  type: z.enum(agentTypes, {
    error: 'Please select an agent type',
  }),
});

export type CreateAgentFormData = z.infer<typeof createAgentFormSchema>;

// Note: color is managed separately via state in AgentEditorDialog
// since it requires special handling with the color picker component
// Note: model and permissionMode use union with empty string for form input (inherit/default)
export const updateAgentSchema = z.object({
  description: z.string().max(1000, 'Description is too long'),
  displayName: z.string().min(1, 'Display name is required').max(255, 'Display name is too long'),
  model: z.union([z.enum(agentModels), z.literal('')]).optional(),
  permissionMode: z.union([z.enum(agentPermissionModes), z.literal('')]).optional(),
  systemPrompt: z.string().min(1, 'System prompt is required').max(50000, 'System prompt is too long'),
});

export type UpdateAgentFormValues = z.input<typeof updateAgentSchema>;
export type UpdateAgentOutput = z.output<typeof updateAgentSchema>;

// Repository update schema - includes all fields that can be updated
export const updateAgentRepositorySchema = z.object({
  builtInAt: z.string().nullable().optional(),
  color: z.enum(agentColors).nullable().optional(),
  deactivatedAt: z.string().nullable().optional(),
  description: z.string().max(1000, 'Description is too long').nullable().optional(),
  displayName: z.string().min(1, 'Display name is required').max(255, 'Display name is too long').optional(),
  model: z.enum(agentModels).nullable().optional(),
  name: z
    .string()
    .min(1, 'Agent name is required')
    .max(255, 'Agent name is too long')
    .regex(
      /^[a-z][a-z0-9-]*$/,
      'Agent name must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens'
    )
    .optional(),
  parentAgentId: z.number().int().positive('Invalid parent agent ID').nullable().optional(),
  permissionMode: z.enum(agentPermissionModes).nullable().optional(),
  projectId: z.number().int().positive('Invalid project ID').nullable().optional(),
  systemPrompt: z.string().min(1, 'System prompt is required').max(50000, 'System prompt is too long').optional(),
  type: z
    .enum(agentTypes, {
      error: 'Please select a valid agent type',
    })
    .optional(),
});

export type UpdateAgentRepositoryInput = z.infer<typeof updateAgentRepositorySchema>;

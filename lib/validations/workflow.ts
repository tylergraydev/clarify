import { z } from 'zod';

import { pauseBehaviors, workflowTypes } from '../../db/schema/workflows.schema';

export const createWorkflowSchema = z
  .object({
    autoStart: z.boolean().default(false),
    clarificationAgentId: z
      .string()
      .optional()
      .transform((val) => (val ? Number(val) : null))
      .refine((val) => val === null || (!isNaN(val) && val > 0), 'Invalid clarification agent selection'),
    featureName: z.string().min(1, 'Feature name is required').max(255, 'Feature name is too long'),
    featureRequest: z.string().min(1, 'Feature request is required').max(10000, 'Feature request is too long'),
    pauseBehavior: z.enum(pauseBehaviors).default('auto_pause'),
    projectId: z
      .string()
      .min(1, 'Project is required')
      .transform((val) => Number(val))
      .refine((val) => !isNaN(val) && val > 0, 'Please select a project'),
    repositoryIds: z.array(z.number().positive('Invalid repository')).min(1, 'At least one repository is required'),
    skipClarification: z.boolean().default(false),
    templateId: z
      .string()
      .optional()
      .transform((val) => (val ? Number(val) : null))
      .refine((val) => val === null || (!isNaN(val) && val > 0), 'Invalid template selection'),
    type: z.enum(workflowTypes),
  })
  .refine(
    (data) => {
      // Only validate for planning workflows (implementation workflows don't use clarification)
      if (data.type !== 'planning') return true;

      // For planning: either skipClarification is true OR clarificationAgentId is provided
      return data.skipClarification || data.clarificationAgentId !== null;
    },
    {
      message: 'Clarification agent is required when skip clarification is disabled',
      path: ['clarificationAgentId'], // Attach error to the agent field
    }
  );

export type CreateWorkflowFormValues = z.input<typeof createWorkflowSchema>;
export type CreateWorkflowOutput = z.output<typeof createWorkflowSchema>;

/**
 * Schema for updating a workflow (only allowed when status is 'created')
 * All fields are optional since the API accepts partial updates
 */
export const updateWorkflowSchema = z
  .object({
    clarificationAgentId: z.number().nullable().optional(),
    featureName: z.string().min(1, 'Feature name is required').max(255, 'Feature name is too long').optional(),
    featureRequest: z
      .string()
      .min(1, 'Feature request is required')
      .max(10000, 'Feature request is too long')
      .optional(),
    pauseBehavior: z.enum(pauseBehaviors).optional(),
    projectId: z.number().positive('Invalid project ID').optional(),
    skipClarification: z.boolean().optional(),
    type: z.enum(workflowTypes).optional(),
  })
  .refine(
    (data) => {
      // Only validate if BOTH fields are provided in the update
      // (partial updates can't be validated without knowing current workflow state)
      if (data.skipClarification === undefined || data.clarificationAgentId === undefined) {
        return true;
      }

      // Only validate for planning workflows
      if (data.type !== undefined && data.type !== 'planning') {
        return true;
      }

      // If both fields are present: skipClarification must be true OR clarificationAgentId must be provided
      return data.skipClarification || data.clarificationAgentId !== null;
    },
    {
      message: 'Clarification agent is required when skip clarification is disabled',
      path: ['clarificationAgentId'],
    }
  );

export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>;

/**
 * Schema for the edit workflow form (all editable fields are required since they are pre-populated)
 */
export const editWorkflowFormSchema = z
  .object({
    clarificationAgentId: z.number().nullable().optional(),
    featureName: z.string().min(1, 'Feature name is required').max(255, 'Feature name is too long'),
    featureRequest: z.string().min(1, 'Feature request is required').max(10000, 'Feature request is too long'),
    pauseBehavior: z.enum(pauseBehaviors),
    skipClarification: z.boolean(),
    type: z.enum(workflowTypes),
  })
  .refine(
    (data) => {
      // Only validate for planning workflows
      if (data.type !== 'planning') return true;

      // For planning: skipClarification must be true OR clarificationAgentId must be provided
      return data.skipClarification || data.clarificationAgentId !== null;
    },
    {
      message: 'Clarification agent is required when skip clarification is disabled',
      path: ['clarificationAgentId'],
    }
  );

export type EditWorkflowFormValues = z.infer<typeof editWorkflowFormSchema>;

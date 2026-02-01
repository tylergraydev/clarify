import { z } from 'zod';

import { pauseBehaviors, workflowTypes } from '../../db/schema/workflows.schema';

export const createWorkflowSchema = z.object({
  featureName: z.string().min(1, 'Feature name is required').max(255, 'Feature name is too long'),
  featureRequest: z.string().min(1, 'Feature request is required').max(10000, 'Feature request is too long'),
  pauseBehavior: z.enum(pauseBehaviors).default('auto_pause'),
  primaryRepositoryId: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : null))
    .refine((val) => val === null || (!isNaN(val) && val > 0), 'Invalid primary repository selection'),
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
});

export type CreateWorkflowFormValues = z.input<typeof createWorkflowSchema>;
export type CreateWorkflowOutput = z.output<typeof createWorkflowSchema>;

/**
 * Schema for updating a workflow (only allowed when status is 'created')
 * All fields are optional since the API accepts partial updates
 */
export const updateWorkflowSchema = z.object({
  featureName: z.string().min(1, 'Feature name is required').max(255, 'Feature name is too long').optional(),
  featureRequest: z.string().min(1, 'Feature request is required').max(10000, 'Feature request is too long').optional(),
  pauseBehavior: z.enum(pauseBehaviors).optional(),
  projectId: z.number().positive('Invalid project ID').optional(),
  skipClarification: z.boolean().optional(),
  type: z.enum(workflowTypes).optional(),
});

export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>;

/**
 * Schema for the edit workflow form (all editable fields are required since they are pre-populated)
 */
export const editWorkflowFormSchema = z.object({
  featureName: z.string().min(1, 'Feature name is required').max(255, 'Feature name is too long'),
  featureRequest: z.string().min(1, 'Feature request is required').max(10000, 'Feature request is too long'),
  pauseBehavior: z.enum(pauseBehaviors),
  skipClarification: z.boolean(),
  type: z.enum(workflowTypes),
});

export type EditWorkflowFormValues = z.infer<typeof editWorkflowFormSchema>;

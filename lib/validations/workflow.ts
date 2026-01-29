import { z } from 'zod';

import { pauseBehaviors, workflowTypes } from '@/db/schema/workflows.schema';

export const createWorkflowSchema = z.object({
  featureName: z
    .string()
    .min(1, 'Feature name is required')
    .max(255, 'Feature name is too long'),
  featureRequest: z
    .string()
    .min(1, 'Feature request is required')
    .max(10000, 'Feature request is too long'),
  pauseBehavior: z.enum(pauseBehaviors).default('auto_pause'),
  projectId: z
    .string()
    .min(1, 'Project is required')
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, 'Please select a project'),
  templateId: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : null))
    .refine(
      (val) => val === null || (!isNaN(val) && val > 0),
      'Invalid template selection'
    ),
  type: z.enum(workflowTypes),
});

export type CreateWorkflowFormValues = z.input<typeof createWorkflowSchema>;
export type CreateWorkflowOutput = z.output<typeof createWorkflowSchema>;

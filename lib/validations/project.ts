import { z } from 'zod';

export const createProjectSchema = z.object({
  description: z.string(),
  name: z.string().min(1, 'Project name is required').max(255, 'Project name is too long'),
});

export type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

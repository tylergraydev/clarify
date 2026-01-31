import { z } from 'zod';

export const createProjectSchema = z.object({
  description: z.string().optional(),
  name: z.string().min(1, 'Project name is required').max(255, 'Project name is too long'),
});

export type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = createProjectSchema.partial();

export type UpdateProjectFormValues = z.infer<typeof updateProjectSchema>;

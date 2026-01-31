import { z } from 'zod';

export const createProjectSchema = z.object({
  description: z.string().max(2000, 'Description is too long (max 2000 characters)').optional(),
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(255, 'Project name is too long')
    .refine((val) => val.trim().length > 0, 'Project name cannot be only whitespace'),
});

export type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

/**
 * Schema for editing existing projects.
 * Same validation rules as create, but semantically separate for clarity.
 */
export const editProjectSchema = z.object({
  description: z.string().max(2000, 'Description is too long (max 2000 characters)').optional(),
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(255, 'Project name is too long')
    .refine((val) => val.trim().length > 0, 'Project name cannot be only whitespace'),
});

export type EditProjectFormValues = z.infer<typeof editProjectSchema>;

export const updateProjectSchema = createProjectSchema.partial();

export type UpdateProjectFormValues = z.infer<typeof updateProjectSchema>;

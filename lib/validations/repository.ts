import { z } from "zod";

export const addRepositorySchema = z.object({
  defaultBranch: z.string().min(1, "Default branch is required"),
  name: z
    .string()
    .min(1, "Repository name is required")
    .max(255, "Repository name is too long"),
  path: z.string().min(1, "Repository path is required"),
});

export type AddRepositoryFormValues = z.infer<typeof addRepositorySchema>;

/**
 * Validation schema for updating a repository.
 * Note: Path is not editable after creation (would break git associations).
 */
export const updateRepositorySchema = z.object({
  defaultBranch: z.string().min(1, "Default branch is required"),
  name: z
    .string()
    .min(1, "Repository name is required")
    .max(255, "Repository name is too long"),
});

export type UpdateRepositoryFormValues = z.infer<typeof updateRepositorySchema>;

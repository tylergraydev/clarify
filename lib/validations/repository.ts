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

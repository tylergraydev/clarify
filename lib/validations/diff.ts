import { z } from 'zod';

export const diffOptionsSchema = z.object({
  base: z.string().optional(),
  contextLines: z.number().int().min(0).max(100).optional(),
  path: z.string().optional(),
  target: z.string().optional(),
});

export type DiffOptionsInput = z.infer<typeof diffOptionsSchema>;

export const fileDiffOptionsSchema = z.object({
  base: z.string().optional(),
  contextLines: z.number().int().min(0).max(100).optional(),
  filePath: z.string().min(1),
  target: z.string().optional(),
});

export type FileDiffOptionsInput = z.infer<typeof fileDiffOptionsSchema>;

export const gitLogOptionsSchema = z.object({
  limit: z.number().int().min(1).max(500).optional(),
  path: z.string().optional(),
  ref: z.string().optional(),
});

export type GitLogOptionsInput = z.infer<typeof gitLogOptionsSchema>;

export const createDiffCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required'),
  endLine: z.number().int().nullable().optional(),
  filePath: z.string().min(1, 'File path is required'),
  lineNumber: z.number().int().min(1),
  lineType: z.enum(['old', 'new']),
  parentId: z.number().int().nullable().optional(),
  workflowId: z.number().int(),
});

export type CreateDiffCommentInput = z.infer<typeof createDiffCommentSchema>;

export const updateDiffCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required'),
});

export type UpdateDiffCommentInput = z.infer<typeof updateDiffCommentSchema>;

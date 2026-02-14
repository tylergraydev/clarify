import { z } from 'zod';

export const createPrSchema = z.object({
  base: z.string().optional(),
  body: z.string().min(1, 'PR body is required'),
  draft: z.boolean().optional().default(false),
  head: z.string().optional(),
  title: z.string().min(1, 'PR title is required').max(256, 'Title is too long'),
});

export type CreatePrFormInput = z.infer<typeof createPrSchema>;

export const updatePrSchema = z.object({
  body: z.string().optional(),
  title: z.string().min(1, 'PR title is required').max(256, 'Title is too long').optional(),
});

export type UpdatePrFormInput = z.infer<typeof updatePrSchema>;

export const mergeStrategySchema = z.enum(['merge', 'squash', 'rebase']);

export type MergeStrategyInput = z.infer<typeof mergeStrategySchema>;

export const prCommentSchema = z.object({
  body: z.string().min(1, 'Comment body is required'),
  line: z.number().int().min(1),
  path: z.string().min(1),
  side: z.enum(['LEFT', 'RIGHT']).optional().default('RIGHT'),
});

export type PrCommentInput = z.infer<typeof prCommentSchema>;

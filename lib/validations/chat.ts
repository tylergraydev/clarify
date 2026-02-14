import { z } from 'zod';

export const forkRequestSchema = z.object({
  forkPointMessageId: z.number().int().positive(),
  generateSummary: z.boolean().optional().default(false),
  sourceConversationId: z.number().int().positive(),
});

export type ForkRequestInput = z.infer<typeof forkRequestSchema>;

export const compactionRequestSchema = z.object({
  conversationId: z.number().int().positive(),
  upToMessageId: z.number().int().positive().optional(),
});

export type CompactionRequestInput = z.infer<typeof compactionRequestSchema>;

export const exportToChatRequestSchema = z.object({
  messageIds: z.array(z.number().int().positive()).min(1),
  projectId: z.number().int().positive(),
  sourceConversationId: z.number().int().positive(),
});

export type ExportToChatRequestInput = z.infer<typeof exportToChatRequestSchema>;

export const generateTitleRequestSchema = z.object({
  conversationId: z.number().int().positive(),
});

export type GenerateTitleRequestInput = z.infer<typeof generateTitleRequestSchema>;

import { z } from "zod";

// Note: color is managed separately via state in AgentEditorDialog
// since it requires special handling with the color picker component
export const updateAgentSchema = z.object({
  description: z.string().max(1000, "Description is too long"),
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(255, "Display name is too long"),
  systemPrompt: z
    .string()
    .min(1, "System prompt is required")
    .max(50000, "System prompt is too long"),
});

export type UpdateAgentFormValues = z.input<typeof updateAgentSchema>;
export type UpdateAgentOutput = z.output<typeof updateAgentSchema>;

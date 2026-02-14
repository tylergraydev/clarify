/**
 * Token Pricing Constants
 *
 * Approximate cost per token for Claude models (USD).
 * Used for displaying cost estimates in the chat UI.
 */

export const PRICING = {
  haiku: { input: 0.25 / 1_000_000, output: 1.25 / 1_000_000 },
  opus: { input: 15 / 1_000_000, output: 75 / 1_000_000 },
  sonnet: { input: 3 / 1_000_000, output: 15 / 1_000_000 },
} as const;

export type ModelTier = keyof typeof PRICING;

/**
 * Estimate cost for a given number of tokens.
 */
export function estimateCost(
  inputTokens: number,
  outputTokens: number,
  model: ModelTier = 'sonnet'
): number {
  const pricing = PRICING[model];
  return inputTokens * pricing.input + outputTokens * pricing.output;
}

/**
 * Format a cost value as a human-readable string.
 */
export function formatCost(costUsd: number): string {
  if (costUsd < 0.01) return `$${costUsd.toFixed(4)}`;
  return `$${costUsd.toFixed(2)}`;
}

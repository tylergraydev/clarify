/**
 * Shared Usage Statistics Type
 *
 * Common usage statistics structure across all agent steps.
 * Replaces step-specific duplicates (ClarificationUsageStats, RefinementUsageStats,
 * FileDiscoveryUsageStats) with a single shared definition.
 */

/**
 * Common usage statistics structure across all agent steps.
 * Tracks token consumption, cost, and execution metrics.
 */
export interface UsageStats {
  /** Tokens used to create cache entries */
  cacheCreationInputTokens?: number;
  /** Tokens read from cache */
  cacheReadInputTokens?: number;
  /** Total cost in USD */
  costUsd: number;
  /** Total duration in milliseconds */
  durationMs: number;
  /** Input tokens consumed */
  inputTokens: number;
  /** Number of conversation turns */
  numTurns: number;
  /** Output tokens generated */
  outputTokens: number;
}

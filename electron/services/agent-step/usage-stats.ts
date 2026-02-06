/**
 * Agent Step Usage Statistics
 *
 * Utilities for extracting and formatting usage statistics
 * from Claude Agent SDK execution results.
 */

import type { SDKResultMessage } from '@anthropic-ai/claude-agent-sdk';

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

/**
 * Extract usage statistics from SDK result message.
 *
 * @param resultMessage - The SDK result message from agent execution
 * @returns Usage statistics if available, undefined otherwise
 */
export function extractUsageStats(resultMessage: SDKResultMessage): undefined | UsageStats {
  if (resultMessage.subtype !== 'success') {
    return undefined;
  }

  const usage = resultMessage.usage as Record<string, unknown>;

  return {
    cacheCreationInputTokens:
      typeof usage.cache_creation_input_tokens === 'number' ? usage.cache_creation_input_tokens : undefined,
    cacheReadInputTokens:
      typeof usage.cache_read_input_tokens === 'number' ? usage.cache_read_input_tokens : undefined,
    costUsd: resultMessage.total_cost_usd,
    durationMs: resultMessage.duration_ms,
    inputTokens: resultMessage.usage.input_tokens,
    numTurns: resultMessage.num_turns,
    outputTokens: resultMessage.usage.output_tokens,
  };
}

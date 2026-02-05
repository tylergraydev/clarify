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

  return {
    costUsd: resultMessage.total_cost_usd,
    durationMs: resultMessage.duration_ms,
    inputTokens: resultMessage.usage.input_tokens,
    numTurns: resultMessage.num_turns,
    outputTokens: resultMessage.usage.output_tokens,
  };
}

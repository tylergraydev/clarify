import type { SDKResultMessage } from '@anthropic-ai/claude-agent-sdk';

import { describe, expect, it } from 'vitest';

import { extractUsageStats } from '../usage-stats';

function makeResultMessage(overrides: Record<string, unknown>): SDKResultMessage {
  return {
    duration_ms: 5000,
    is_error: false,
    num_turns: 3,
    role: 'result',
    session_id: 'test-session',
    subtype: 'success',
    total_cost_usd: 0.05,
    type: 'result',
    usage: { input_tokens: 1000, output_tokens: 500 },
    ...overrides,
  } as unknown as SDKResultMessage;
}

describe('extractUsageStats', () => {
  it('returns undefined for error subtype', () => {
    const msg = makeResultMessage({ subtype: 'error' });
    expect(extractUsageStats(msg)).toBeUndefined();
  });

  it('extracts all fields for success subtype', () => {
    const msg = makeResultMessage({
      duration_ms: 5000,
      num_turns: 3,
      subtype: 'success',
      total_cost_usd: 0.05,
      usage: {
        cache_creation_input_tokens: 100,
        cache_read_input_tokens: 200,
        input_tokens: 1000,
        output_tokens: 500,
      },
    });

    const stats = extractUsageStats(msg);
    expect(stats).toBeDefined();
    expect(stats?.inputTokens).toBe(1000);
    expect(stats?.outputTokens).toBe(500);
    expect(stats?.costUsd).toBe(0.05);
    expect(stats?.durationMs).toBe(5000);
    expect(stats?.numTurns).toBe(3);
    expect(stats?.cacheCreationInputTokens).toBe(100);
    expect(stats?.cacheReadInputTokens).toBe(200);
  });

  it('returns undefined for cache fields when not numbers', () => {
    const msg = makeResultMessage({
      subtype: 'success',
      usage: {
        cache_creation_input_tokens: 'not a number',
        cache_read_input_tokens: undefined,
        input_tokens: 100,
        output_tokens: 50,
      },
    });

    const stats = extractUsageStats(msg);
    expect(stats).toBeDefined();
    expect(stats?.cacheCreationInputTokens).toBeUndefined();
    expect(stats?.cacheReadInputTokens).toBeUndefined();
  });
});

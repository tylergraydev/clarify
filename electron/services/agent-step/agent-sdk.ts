/**
 * Agent Step SDK Utilities
 *
 * Shared utilities for interacting with the Claude Agent SDK,
 * including cached query function loading and JSON parsing helpers.
 */

/**
 * Cached SDK query function to avoid repeated dynamic imports.
 */
let cachedQueryFn: (typeof import('@anthropic-ai/claude-agent-sdk'))['query'] | null = null;

/**
 * Get the SDK query function, loading it once and caching for subsequent calls.
 *
 * @returns The SDK query function
 * @throws Error if the SDK is not available
 */
export async function getQueryFunction(): Promise<(typeof import('@anthropic-ai/claude-agent-sdk'))['query']> {
  if (!cachedQueryFn) {
    try {
      const sdk = await import('@anthropic-ai/claude-agent-sdk');
      cachedQueryFn = sdk.query;
    } catch (error) {
      throw new Error(
        `Claude Agent SDK not available. Ensure @anthropic-ai/claude-agent-sdk is installed. ` +
          `Original error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  return cachedQueryFn;
}

/**
 * Safely parse a tool input JSON payload.
 *
 * @param payload - Raw JSON string from tool input
 * @returns Parsed object or null if parsing fails
 */
export function parseToolInputJson(payload: string): null | Record<string, unknown> {
  if (!payload) {
    return null;
  }

  try {
    const parsed = JSON.parse(payload);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

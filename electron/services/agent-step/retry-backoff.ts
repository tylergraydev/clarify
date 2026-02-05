/**
 * Agent Step Retry and Backoff Utilities
 *
 * Provides utilities for managing retry attempts with exponential backoff
 * for transient agent execution failures.
 */

import { BASE_RETRY_DELAY_MS, MAX_RETRY_ATTEMPTS } from './agent-step-constants';

/**
 * Retry tracker class for managing retry state across sessions.
 *
 * Provides methods to track, increment, check limits, and clear retry counts
 * for individual sessions.
 */
export class RetryTracker {
  private retryCountBySession = new Map<string, number>();

  /**
   * Clear all retry counts.
   *
   * Useful for testing or resetting state.
   */
  clearAll(): void {
    this.retryCountBySession.clear();
  }

  /**
   * Clear the retry count for a session.
   *
   * Should be called when a session completes successfully or
   * is cancelled to clean up tracking state.
   *
   * @param sessionId - The session ID
   */
  clearRetryCount(sessionId: string): void {
    this.retryCountBySession.delete(sessionId);
  }

  /**
   * Get the current retry count for a session.
   *
   * @param sessionId - The session ID
   * @returns The current retry count (0 if not retried)
   */
  getRetryCount(sessionId: string): number {
    return this.retryCountBySession.get(sessionId) ?? 0;
  }

  /**
   * Increment the retry count for a session.
   *
   * @param sessionId - The session ID
   * @returns The new retry count
   */
  incrementRetryCount(sessionId: string): number {
    const currentCount = this.getRetryCount(sessionId);
    const newCount = currentCount + 1;
    this.retryCountBySession.set(sessionId, newCount);
    return newCount;
  }

  /**
   * Check if retry limit has been reached for a session.
   *
   * @param sessionId - The session ID
   * @returns Whether the max retry limit has been reached
   */
  isRetryLimitReached(sessionId: string): boolean {
    return this.getRetryCount(sessionId) >= MAX_RETRY_ATTEMPTS;
  }
}

/**
 * Calculate exponential backoff delay for a retry attempt.
 *
 * Uses exponential backoff: 1s, 2s, 4s, 8s, etc.
 *
 * @param retryCount - The current retry attempt number (1-indexed)
 * @returns The delay in milliseconds
 *
 * @example
 * ```ts
 * calculateBackoffDelay(1) // Returns 1000ms (1s)
 * calculateBackoffDelay(2) // Returns 2000ms (2s)
 * calculateBackoffDelay(3) // Returns 4000ms (4s)
 * ```
 */
export function calculateBackoffDelay(retryCount: number): number {
  return BASE_RETRY_DELAY_MS * Math.pow(2, retryCount - 1);
}

/**
 * Check if an error message indicates a transient failure that should be retried.
 *
 * Detects common patterns for network errors, timeouts, rate limits, and
 * temporary service unavailability.
 *
 * @param errorMessage - The error message to check
 * @returns Whether the error is likely transient
 *
 * @example
 * ```ts
 * isTransientError('Request timeout after 120s') // true
 * isTransientError('Network connection failed') // true
 * isTransientError('Invalid input format') // false
 * ```
 */
export function isTransientError(errorMessage: string): boolean {
  const transientPatterns = [
    /timeout/i,
    /network/i,
    /connection/i,
    /rate limit/i,
    /temporarily unavailable/i,
    /service unavailable/i,
    /too many requests/i,
    /ECONNREFUSED/i,
    /ENOTFOUND/i,
    /ETIMEDOUT/i,
  ];

  return transientPatterns.some((pattern) => pattern.test(errorMessage));
}

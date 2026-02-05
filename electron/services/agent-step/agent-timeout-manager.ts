/**
 * Agent Timeout Manager
 *
 * Centralizes timeout promise creation and cleanup logic for agent step services.
 * This utility eliminates 100-150 lines of duplicated timeout management code across
 * clarification, refinement, and file discovery services by providing a standardized
 * interface for timeout handling.
 *
 * The timeout manager handles:
 * - Creating timeout promises with configurable durations
 * - Checking abort signals to prevent race conditions
 * - Invoking timeout callbacks to generate outcomes
 * - Providing cleanup mechanisms for timeout cancellation
 */

/**
 * Configuration for creating a timeout promise.
 *
 * @template TOutcome - The type of outcome returned when the timeout triggers
 */
export interface TimeoutPromiseConfig<TOutcome> {
  /**
   * AbortController to check for cancellation before resolving the timeout.
   * This prevents duplicate resolutions when the agent is cancelled externally.
   */
  abortController: AbortController;

  /**
   * Callback function invoked when the timeout triggers.
   * Should return the timeout outcome (e.g., TIMEOUT result with error message).
   */
  onTimeout: () => TOutcome;

  /**
   * The timeout duration in seconds.
   */
  timeoutSeconds: number;
}

/**
 * Result object returned by createTimeoutPromise.
 *
 * @template TOutcome - The type of outcome returned when the timeout triggers
 */
export interface TimeoutPromiseResult<TOutcome> {
  /**
   * Cleanup function that clears the timeout.
   * Safe to call multiple times.
   */
  cleanup: () => void;

  /**
   * Promise that resolves when the timeout triggers.
   */
  promise: Promise<TOutcome>;

  /**
   * Timeout ID for manual cleanup if needed.
   */
  timeoutId: ReturnType<typeof setTimeout>;
}

/**
 * Safely clears a timeout, handling null/undefined values.
 *
 * This helper prevents errors when attempting to clear timeouts that
 * may not have been set or have already been cleared.
 *
 * @param timeoutId - The timeout ID to clear, or null/undefined
 */
export function clearTimeoutSafely(timeoutId: null | ReturnType<typeof setTimeout> | undefined): void {
  if (timeoutId !== null && timeoutId !== undefined) {
    clearTimeout(timeoutId);
  }
}

/**
 * Creates a timeout promise that resolves after the specified duration.
 *
 * The promise will only resolve if the abort signal has not been triggered,
 * preventing race conditions between timeout and cancellation.
 *
 * Example usage:
 * ```typescript
 * const { promise, cleanup } = createTimeoutPromise({
 *   timeoutSeconds: 60,
 *   abortController: myAbortController,
 *   onTimeout: () => ({
 *     outcome: {
 *       type: 'TIMEOUT',
 *       error: 'Operation timed out after 60 seconds',
 *       elapsedSeconds: 60,
 *     },
 *   }),
 * });
 *
 * try {
 *   const result = await Promise.race([executionPromise, promise]);
 *   return result;
 * } finally {
 *   cleanup();
 * }
 * ```
 *
 * @template TOutcome - The type of outcome returned when the timeout triggers
 * @param config - Configuration for the timeout promise
 * @returns Object containing the promise, timeoutId, and cleanup function
 */
export function createTimeoutPromise<TOutcome>(config: TimeoutPromiseConfig<TOutcome>): TimeoutPromiseResult<TOutcome> {
  const { abortController, onTimeout, timeoutSeconds } = config;

  let timeoutId: null | ReturnType<typeof setTimeout> = null;

  const promise = new Promise<TOutcome>((resolve) => {
    timeoutId = setTimeout(() => {
      // Check abort signal before resolving to prevent race conditions
      // If the operation was already cancelled, don't resolve the timeout
      if (!abortController.signal.aborted) {
        const outcome = onTimeout();
        resolve(outcome);
      }
    }, timeoutSeconds * 1000);
  });

  // Ensure timeoutId is set before returning
  const finalTimeoutId = timeoutId!;

  const cleanup = () => {
    clearTimeoutSafely(finalTimeoutId);
  };

  return {
    cleanup,
    promise,
    timeoutId: finalTimeoutId,
  };
}

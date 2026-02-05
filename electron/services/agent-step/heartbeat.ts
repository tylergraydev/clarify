/**
 * Agent Step Extended Thinking Heartbeat
 *
 * Utilities for managing heartbeat intervals during extended thinking mode.
 * Provides periodic progress updates to the UI when partial streaming is disabled.
 */

import { EXTENDED_THINKING_HEARTBEAT_INTERVAL_MS } from './agent-step-constants';

/**
 * Callback function invoked on each heartbeat tick.
 */
export type HeartbeatCallback = (data: HeartbeatData) => void;

/**
 * Heartbeat data provided to the callback function.
 */
export interface HeartbeatData {
  /** Elapsed time in milliseconds since heartbeat started */
  elapsedMs: number;
  /** Timestamp of this heartbeat tick */
  timestamp: number;
}

/**
 * Start a heartbeat interval for extended thinking mode.
 *
 * The heartbeat emits periodic progress updates to track long-running
 * agent executions when partial streaming is disabled.
 *
 * @param callback - Function to call on each heartbeat tick
 * @param intervalMs - Optional custom interval in milliseconds (defaults to EXTENDED_THINKING_HEARTBEAT_INTERVAL_MS)
 * @returns Interval handle that can be cleared with clearInterval
 *
 * @example
 * ```ts
 * const heartbeat = startHeartbeat((data) => {
 *   console.log(`Elapsed: ${data.elapsedMs}ms`);
 *   emitProgressUpdate(data);
 * });
 *
 * // Later, stop the heartbeat
 * if (heartbeat) {
 *   clearInterval(heartbeat);
 * }
 * ```
 */
export function startHeartbeat(
  callback: HeartbeatCallback,
  intervalMs: number = EXTENDED_THINKING_HEARTBEAT_INTERVAL_MS
): NodeJS.Timeout {
  const startTime = Date.now();

  return setInterval(() => {
    const elapsedMs = Date.now() - startTime;
    const timestamp = Date.now();

    callback({
      elapsedMs,
      timestamp,
    });
  }, intervalMs);
}

/**
 * Safely clear a heartbeat interval.
 *
 * @param interval - The interval handle to clear (can be null/undefined)
 *
 * @example
 * ```ts
 * let heartbeat: NodeJS.Timeout | null = null;
 * heartbeat = startHeartbeat(callback);
 *
 * // Later
 * stopHeartbeat(heartbeat);
 * heartbeat = null;
 * ```
 */
export function stopHeartbeat(interval: NodeJS.Timeout | null | undefined): void {
  if (interval) {
    clearInterval(interval);
  }
}

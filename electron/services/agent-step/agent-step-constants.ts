/**
 * Agent Step Shared Constants
 *
 * Common configuration constants used across all agent step services
 * (clarification, refinement, file discovery, implementation planning).
 */

/**
 * Maximum number of retry attempts for transient errors.
 */
export const MAX_RETRY_ATTEMPTS = 3;

/**
 * Base delay for exponential backoff in milliseconds.
 */
export const BASE_RETRY_DELAY_MS = 1000;

/**
 * Heartbeat interval for extended thinking progress updates in milliseconds.
 * Sends periodic status updates to UI when partial streaming is disabled.
 */
export const EXTENDED_THINKING_HEARTBEAT_INTERVAL_MS = 2000; // 2 seconds

/**
 * Default timeout values for each step in seconds.
 * Each step has different computational requirements:
 * - Clarification: Quick analysis of feature request clarity
 * - Refinement: Deeper codebase exploration for context enhancement
 * - File Discovery: Comprehensive file system analysis
 * - Implementation Planning: Detailed plan generation (future)
 */
export const STEP_TIMEOUTS = {
  /** Default timeout for clarification operations in seconds */
  clarification: 120,
  /** Default timeout for file discovery operations in seconds */
  fileDiscovery: 300,
  /** Default timeout for implementation planning operations in seconds */
  implementationPlanning: 600,
  /** Default timeout for refinement operations in seconds */
  refinement: 180,
} as const;

/**
 * Type for valid step names.
 */
export type StepName = keyof typeof STEP_TIMEOUTS;

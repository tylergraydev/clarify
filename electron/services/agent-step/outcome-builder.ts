/**
 * Agent Step Outcome Builder Utilities
 *
 * Factory functions for building outcomes with pause information and retry context.
 * Centralizes outcome building logic to eliminate duplication across agent step services.
 */

import type { ExecuteAgentResult, OutcomePauseInfo } from './step-types';

import { isPauseRequested } from './workflow-pause';

/**
 * Build an error outcome with retry context.
 *
 * Creates an error outcome with retry information attached:
 * - error: Error message
 * - type: Set to 'ERROR'
 * - retryCount: Current retry attempt number
 * - skipFallbackAvailable: Whether skip fallback is available (optional)
 * - stack: Error stack trace (optional)
 *
 * @param errorMessage - The error message
 * @param retryCount - Current retry attempt number
 * @param skipFallbackAvailable - Whether skip fallback is available (clarification/refinement/discovery)
 * @param errorStack - Optional error stack trace
 * @returns Error outcome with retry information
 */
export function buildErrorOutcomeWithRetry(
  errorMessage: string,
  retryCount: number,
  skipFallbackAvailable?: boolean,
  errorStack?: string
): {
  error: string;
  retryCount: number;
  skipFallbackAvailable?: boolean;
  stack?: string;
  type: string;
} {
  const errorOutcome: {
    error: string;
    retryCount: number;
    skipFallbackAvailable?: boolean;
    stack?: string;
    type: string;
  } = {
    error: errorMessage,
    retryCount,
    type: 'ERROR',
  };

  // Only add optional fields if provided
  if (skipFallbackAvailable !== undefined) {
    errorOutcome.skipFallbackAvailable = skipFallbackAvailable;
  }

  if (errorStack !== undefined) {
    errorOutcome.stack = errorStack;
  }

  return errorOutcome;
}

/**
 * Build an outcome with pause information attached.
 *
 * Takes a base outcome from agent execution and augments it with:
 * - pauseRequested: Whether workflow should pause after this step
 * - retryCount: Set to 0 for new successful executions
 * - sdkSessionId: SDK session ID for potential resumption
 * - usage: Usage statistics from SDK result
 * - skipFallbackAvailable: Whether skip fallback is available (optional)
 *
 * This function checks the workflow's pause behavior and determines
 * if the workflow should pause after this step completes.
 *
 * @template TOutcome - Step-specific outcome type
 * @template TUsage - Step-specific usage statistics type
 *
 * @param baseOutcome - The base outcome object from agent execution
 * @param workflowId - Workflow ID for pause request checking
 * @param isGateStep - Whether this is a gate step (affects gates_only pause behavior)
 * @param executeResult - Execution result containing SDK session ID and usage stats
 * @param skipFallbackAvailable - Whether skip fallback is available (clarification/refinement only)
 * @returns Outcome with pause information attached
 */
export function buildOutcomeWithPauseInfo<TOutcome, TUsage = unknown>(
  baseOutcome: TOutcome,
  workflowId: number,
  isGateStep: boolean,
  executeResult: ExecuteAgentResult<TOutcome, TUsage>,
  skipFallbackAvailable?: boolean
): OutcomePauseInfo<TUsage> & TOutcome {
  const pauseRequested = isPauseRequested(workflowId, isGateStep);

  const outcomeWithPause: OutcomePauseInfo<TUsage> & TOutcome = {
    ...baseOutcome,
    pauseRequested,
    retryCount: 0,
    sdkSessionId: executeResult.sdkSessionId,
    usage: executeResult.usage,
  };

  // Only add skipFallbackAvailable if explicitly provided
  if (skipFallbackAvailable !== undefined) {
    outcomeWithPause.skipFallbackAvailable = skipFallbackAvailable;
  }

  return outcomeWithPause;
}

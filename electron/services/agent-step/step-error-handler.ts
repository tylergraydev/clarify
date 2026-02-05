/**
 * Step Error Handler
 *
 * Standardized error handling for agent step services.
 * Extracts common error processing logic from catch blocks.
 */

import type { StepAuditLogger } from './step-audit-logger';

import { debugLoggerService } from '../debug-logger.service';
import { buildErrorOutcomeWithRetry } from './outcome-builder';
import { isTransientError } from './retry-backoff';

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Context required for handling a step error.
 */
export interface StepErrorContext {
  /** Agent ID if available (for audit logging) */
  agentId: number | undefined;
  /** Agent name if available (for audit logging) */
  agentName: string | undefined;
  /** The audit logger instance for the step */
  auditLogger: StepAuditLogger;
  /** The error that occurred */
  error: unknown;
  /** Additional event data for audit logging */
  extraEventData?: Record<string, unknown>;
  /** Function to get current retry count */
  getRetryCount: () => number;
  /** Function to check if retry limit reached */
  isRetryLimitReached: () => boolean;
  /** The session ID for debug logging */
  sessionId: string;
  /** The workflow step ID */
  stepId: number;
  /** Human-readable step name for logging */
  stepName: string;
  /** The workflow ID */
  workflowId: number;
}

/**
 * Result of handling a step error.
 */
export interface StepErrorResult {
  /** Whether the error is retryable and retry limit not reached */
  canRetry: boolean;
  /** The extracted error message */
  errorMessage: string;
  /** The extracted error stack trace */
  errorStack: string | undefined;
  /** Whether the error is transient */
  isTransient: boolean;
  /** The current retry count */
  retryCount: number;
  /** Whether retry limit has been reached */
  retryLimitReached: boolean;
}

// =============================================================================
// Error Handler Function
// =============================================================================

/**
 * Build an error outcome from error result.
 *
 * Convenience function that combines handleStepError result with buildErrorOutcomeWithRetry.
 *
 * @param errorResult - The result from handleStepError
 * @param skipFallbackAvailable - Whether skip fallback is available for this step
 * @returns The error outcome with retry information
 */
export function buildErrorOutcomeFromResult(
  errorResult: StepErrorResult,
  skipFallbackAvailable = true
): ReturnType<typeof buildErrorOutcomeWithRetry> {
  return buildErrorOutcomeWithRetry(
    errorResult.errorMessage,
    errorResult.retryCount,
    skipFallbackAvailable,
    errorResult.errorStack
  );
}

/**
 * Handle an error in a step operation.
 *
 * Performs standardized error processing:
 * 1. Extract error message and stack
 * 2. Check retry eligibility
 * 3. Log error details to debug logger
 * 4. Log error to audit logger
 *
 * @param context - The error context containing session and error info
 * @returns Error result with extracted information
 *
 * @example
 * ```typescript
 * } catch (error) {
 *   session.phase = 'error';
 *   this.emitPhaseChange(session.sessionId, session.phase, onStreamMessage);
 *
 *   const errorResult = handleStepError({
 *     agentId: session.agentConfig?.id,
 *     agentName: session.agentConfig?.name,
 *     auditLogger: this.auditLogger,
 *     error,
 *     getRetryCount: () => this.getRetryCount(workflowId),
 *     isRetryLimitReached: () => this.isRetryLimitReached(workflowId),
 *     sessionId: session.sessionId,
 *     stepId: options.stepId,
 *     stepName: 'Clarification',
 *     workflowId,
 *   });
 *
 *   this.activeSessions.delete(workflowId);
 *   return buildErrorOutcomeWithRetry(
 *     errorResult.errorMessage,
 *     errorResult.retryCount,
 *     true,
 *     errorResult.errorStack
 *   );
 * }
 * ```
 */
export function handleStepError(context: StepErrorContext): StepErrorResult {
  const {
    agentId,
    agentName,
    auditLogger,
    error,
    extraEventData,
    getRetryCount,
    isRetryLimitReached,
    sessionId,
    stepId,
    stepName,
    workflowId,
  } = context;

  // Extract error details
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Check retry eligibility
  const retryCount = getRetryCount();
  const isTransient = isTransientError(errorMessage);
  const retryLimitReached = isRetryLimitReached();
  const canRetry = isTransient && !retryLimitReached;

  // Log to debug logger
  debugLoggerService.logSdkEvent(sessionId, `${stepName} error`, {
    error: errorMessage,
    isRetryable: isTransient,
    retryCount,
    retryLimitReached,
    ...extraEventData,
  });

  // Log to audit logger
  auditLogger.logStepError(workflowId, stepId, agentId, agentName, errorMessage, {
    error: errorMessage,
    isRetryable: isTransient,
    retryCount,
    retryLimitReached,
    sessionId,
    stack: errorStack,
    ...extraEventData,
  });

  return {
    canRetry,
    errorMessage,
    errorStack,
    isTransient,
    retryCount,
    retryLimitReached,
  };
}

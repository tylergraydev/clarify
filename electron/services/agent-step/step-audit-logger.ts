/**
 * Step Audit Logger Utility Class
 *
 * Centralizes audit logging calls for agent step services with step-specific event type mapping.
 * Eliminates 200-300 lines of repetitive audit logging code by providing a consistent interface
 * with automatic event type naming based on the step name.
 *
 * ## Usage
 *
 * ```typescript
 * const logger = new StepAuditLogger('clarification');
 * logger.logStepStarted(workflowId, stepId, agentId, { featureRequestLength: 500 });
 * logger.logAgentLoaded(workflowId, stepId, agentId, agentName, { model: 'claude-sonnet-4' });
 * logger.logStepCompleted(workflowId, stepId, agentId, agentName, { outcomeType: 'SUCCESS' });
 * ```
 *
 * Event type naming pattern: `${stepName}_${eventSuffix}`
 * Examples: 'clarification_started', 'refinement_exploring', 'file_discovery_completed'
 */

import { logAuditEntry } from './audit-log';

/**
 * Standardized audit logging for agent step services.
 * Each method corresponds to a common audit event across all agent steps.
 */
export class StepAuditLogger {
  /**
   * Create a new step audit logger with a specific step name prefix.
   *
   * @param stepName - The step name for event type prefixing (e.g., 'clarification', 'refinement', 'file_discovery')
   */
  constructor(private readonly stepName: string) {}

  /**
   * Log when agent configuration is loaded from the database.
   *
   * @param workflowId - The workflow ID
   * @param stepId - The workflow step ID
   * @param agentId - The agent ID
   * @param agentName - The agent name
   * @param eventData - Additional event-specific data (model, toolsCount, etc.)
   */
  logAgentLoaded(
    workflowId: number,
    stepId: number,
    agentId: number,
    agentName: string,
    eventData: Record<string, unknown>
  ): void {
    logAuditEntry(`${this.stepName}_agent_loaded`, `Loaded ${this.stepName} agent: ${agentName}`, {
      agentId,
      agentName,
      eventData,
      severity: 'info',
      workflowId,
      workflowStepId: stepId,
    });
  }

  /**
   * Log when maximum retry limit is reached.
   *
   * @param workflowId - The workflow ID
   * @param stepId - The workflow step ID
   * @param maxRetries - Maximum allowed retries
   * @param eventData - Additional event-specific data (sessionId, etc.)
   */
  logRetryLimitReached(
    workflowId: number,
    stepId: number,
    maxRetries: number,
    eventData: Record<string, unknown>
  ): void {
    logAuditEntry(`${this.stepName}_retry_limit_reached`, 'Maximum retry attempts reached', {
      eventData: {
        maxRetries,
        ...eventData,
      },
      severity: 'warning',
      workflowId,
      workflowStepId: stepId,
    });
  }

  /**
   * Log when a retry attempt starts.
   *
   * @param workflowId - The workflow ID
   * @param stepId - The workflow step ID
   * @param retryCount - Current retry attempt number
   * @param maxRetries - Maximum allowed retries
   * @param eventData - Additional event-specific data (backoffDelayMs, sessionId, etc.)
   */
  logRetryStarted(
    workflowId: number,
    stepId: number,
    retryCount: number,
    maxRetries: number,
    eventData: Record<string, unknown>
  ): void {
    logAuditEntry(
      `${this.stepName}_retry_started`,
      `Retrying ${this.stepName} (attempt ${retryCount}/${maxRetries})`,
      {
        eventData,
        severity: 'info',
        workflowId,
        workflowStepId: stepId,
      }
    );
  }

  /**
   * Log when user cancels a step.
   *
   * @param workflowId - The workflow ID
   * @param stepId - The workflow step ID
   * @param agentId - The agent ID (if agent was loaded)
   * @param agentName - The agent name (if agent was loaded)
   * @param eventData - Additional event-specific data (phase, reason, etc.)
   */
  logStepCancelled(
    workflowId: number,
    stepId: number,
    agentId: number | undefined,
    agentName: string | undefined,
    eventData: Record<string, unknown>
  ): void {
    logAuditEntry(`${this.stepName}_cancelled`, `${this.capitalize(this.stepName)} step cancelled by user`, {
      agentId,
      agentName,
      eventData,
      severity: 'info',
      workflowId,
      workflowStepId: stepId,
    });
  }

  /**
   * Log when a step completes successfully with outcome-specific data.
   *
   * @param workflowId - The workflow ID
   * @param stepId - The workflow step ID
   * @param agentId - The agent ID
   * @param agentName - The agent name
   * @param message - Human-readable completion message
   * @param eventData - Outcome-specific data
   * @param afterState - Optional state after completion
   */
  logStepCompleted(
    workflowId: number,
    stepId: number,
    agentId: number,
    agentName: string,
    message: string,
    eventData: Record<string, unknown>,
    afterState?: Record<string, unknown>
  ): void {
    logAuditEntry(`${this.stepName}_completed`, message, {
      afterState,
      agentId,
      agentName,
      eventData,
      severity: 'info',
      workflowId,
      workflowStepId: stepId,
    });
  }

  /**
   * Log when a step encounters an error.
   *
   * @param workflowId - The workflow ID
   * @param stepId - The workflow step ID
   * @param agentId - The agent ID (if agent was loaded)
   * @param agentName - The agent name (if agent was loaded)
   * @param errorMessage - The error message
   * @param eventData - Additional event-specific data (isRetryable, retryCount, stack, etc.)
   */
  logStepError(
    workflowId: number,
    stepId: number,
    agentId: number | undefined,
    agentName: string | undefined,
    errorMessage: string,
    eventData: Record<string, unknown>
  ): void {
    logAuditEntry(`${this.stepName}_error`, `${this.capitalize(this.stepName)} step failed: ${errorMessage}`, {
      agentId,
      agentName,
      eventData,
      severity: 'error',
      workflowId,
      workflowStepId: stepId,
    });
  }

  /**
   * Log when agent starts exploring/analyzing (SDK execution begins).
   *
   * @param workflowId - The workflow ID
   * @param stepId - The workflow step ID
   * @param agentId - The agent ID
   * @param agentName - The agent name
   * @param eventData - Additional event-specific data (model, promptLength, etc.)
   */
  logStepExploring(
    workflowId: number,
    stepId: number,
    agentId: number,
    agentName: string,
    eventData: Record<string, unknown>
  ): void {
    logAuditEntry(`${this.stepName}_exploring`, `${this.capitalize(this.stepName)} agent is analyzing`, {
      agentId,
      agentName,
      eventData,
      severity: 'debug',
      workflowId,
      workflowStepId: stepId,
    });
  }

  /**
   * Log when a step starts execution.
   *
   * @param workflowId - The workflow ID
   * @param stepId - The workflow step ID
   * @param agentId - The agent ID being used
   * @param eventData - Additional event-specific data
   */
  logStepStarted(workflowId: number, stepId: number, agentId: number, eventData: Record<string, unknown>): void {
    logAuditEntry(`${this.stepName}_started`, `${this.capitalize(this.stepName)} step started`, {
      agentId,
      eventData,
      severity: 'info',
      workflowId,
      workflowStepId: stepId,
    });
  }

  /**
   * Log when a step times out.
   *
   * @param workflowId - The workflow ID
   * @param stepId - The workflow step ID
   * @param agentId - The agent ID
   * @param agentName - The agent name
   * @param elapsedSeconds - How long the step ran before timeout
   * @param eventData - Additional event-specific data
   */
  logStepTimeout(
    workflowId: number,
    stepId: number,
    agentId: number,
    agentName: string,
    elapsedSeconds: number,
    eventData: Record<string, unknown>
  ): void {
    logAuditEntry(
      `${this.stepName}_timeout`,
      `${this.capitalize(this.stepName)} timed out after ${elapsedSeconds} seconds`,
      {
        agentId,
        agentName,
        eventData,
        severity: 'warning',
        workflowId,
        workflowStepId: stepId,
      }
    );
  }

  /**
   * Capitalize the first letter of a string (for human-readable messages).
   *
   * @param str - The string to capitalize
   * @returns The capitalized string
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

/**
 * Agent Step Audit Logging
 *
 * Utilities for creating audit log entries from agent step services.
 * Provides a consistent interface for tracking agent execution events.
 */

import type { NewAuditLog } from '../../../db/schema';

import { getDatabase } from '../../../db';
import { createAuditLogsRepository } from '../../../db/repositories';
import { debugLoggerService } from '../debug-logger.service';

/**
 * Options for creating an audit log entry.
 */
export interface AuditLogOptions {
  /** State after the event occurred */
  afterState?: Record<string, unknown>;
  /** Agent ID associated with this event */
  agentId?: number;
  /** Agent name for human-readable identification */
  agentName?: string;
  /** State before the event occurred */
  beforeState?: Record<string, unknown>;
  /** Additional structured event data */
  eventData?: Record<string, unknown>;
  /** Severity level of the event */
  severity?: 'debug' | 'error' | 'info' | 'warning';
  /** Workflow ID this event belongs to */
  workflowId?: number;
  /** Workflow step ID this event belongs to */
  workflowStepId?: number;
}

/**
 * Create an audit log entry for an agent step event.
 *
 * This helper wraps audit log creation with error handling to ensure
 * that audit failures don't break agent execution.
 *
 * @param eventType - Type identifier for the event (e.g., 'agent_started', 'agent_completed')
 * @param message - Human-readable description of the event
 * @param options - Additional audit log options
 */
export function logAuditEntry(eventType: string, message: string, options: AuditLogOptions = {}): void {
  try {
    const db = getDatabase();
    const auditLogsRepo = createAuditLogsRepository(db);

    const auditEntry: NewAuditLog = {
      afterState: options.afterState ?? null,
      beforeState: options.beforeState ?? null,
      eventCategory: 'step',
      eventData: {
        agentId: options.agentId,
        agentName: options.agentName,
        ...options.eventData,
      },
      eventType,
      message,
      severity: options.severity ?? 'info',
      source: 'system',
      workflowId: options.workflowId ?? null,
      workflowStepId: options.workflowStepId ?? null,
    };

    auditLogsRepo.create(auditEntry);
  } catch (error) {
    // Log to debug logger but don't throw - audit failures shouldn't break execution
    debugLoggerService.logSdkEvent('system', 'Failed to create audit log entry', {
      error: error instanceof Error ? error.message : 'Unknown error',
      eventType,
    });
  }
}

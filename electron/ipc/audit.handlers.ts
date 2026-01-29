/**
 * Audit IPC Handlers
 *
 * Handles all audit log operations including:
 * - Creating audit log entries
 * - Querying logs by workflow, step, or filters
 * - Exporting audit logs as markdown or JSON
 */
import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { AuditLogsRepository } from '../../db/repositories';
import type { AuditLog, NewAuditLog } from '../../db/schema';

import { IpcChannels } from './channels';

/**
 * Filter options for listing audit logs
 */
interface AuditListFilters {
  eventCategory?: string;
  limit?: number;
  severity?: string;
  workflowId?: number;
}

/**
 * Export format options
 */
type ExportFormat = 'json' | 'markdown';

/**
 * Export options for audit logs
 */
interface ExportOptions {
  format: ExportFormat;
  workflowId: number;
}

/**
 * Export result
 */
interface ExportResult {
  content: string;
  format: ExportFormat;
}

/**
 * Register all audit log-related IPC handlers.
 *
 * @param auditLogsRepository - The audit logs repository for database operations
 */
export function registerAuditHandlers(auditLogsRepository: AuditLogsRepository): void {
  // Create a new audit log entry
  ipcMain.handle(IpcChannels.audit.create, (_event: IpcMainInvokeEvent, data: NewAuditLog): AuditLog => {
    return auditLogsRepository.create(data);
  });

  // Export audit logs for a workflow as markdown or JSON
  ipcMain.handle(
    IpcChannels.audit.export,
    (_event: IpcMainInvokeEvent, options: ExportOptions): ExportResult => {
      const logs = auditLogsRepository.findByWorkflowId(options.workflowId);

      let content: string;
      if (options.format === 'markdown') {
        content = exportAsMarkdown(logs, options.workflowId);
      } else {
        content = exportAsJson(logs, options.workflowId);
      }

      return {
        content,
        format: options.format,
      };
    }
  );

  // List audit logs with optional filters
  ipcMain.handle(
    IpcChannels.audit.list,
    (_event: IpcMainInvokeEvent, filters?: AuditListFilters): Array<AuditLog> => {
      return auditLogsRepository.findAll(filters);
    }
  );

  // Find all audit logs for a specific workflow
  ipcMain.handle(
    IpcChannels.audit.findByWorkflow,
    (_event: IpcMainInvokeEvent, workflowId: number): Array<AuditLog> => {
      return auditLogsRepository.findByWorkflowId(workflowId);
    }
  );

  // Find audit logs for a specific step
  ipcMain.handle(
    IpcChannels.audit.findByStep,
    (_event: IpcMainInvokeEvent, stepId: number): Array<AuditLog> => {
      return auditLogsRepository.findByWorkflowStepId(stepId);
    }
  );
}

/**
 * Export audit logs as JSON
 */
function exportAsJson(logs: Array<AuditLog>, workflowId: number): string {
  const exportData = {
    entries: logs,
    generatedAt: new Date().toISOString(),
    totalEntries: logs.length,
    workflowId,
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Export audit logs as markdown
 */
function exportAsMarkdown(logs: Array<AuditLog>, workflowId: number): string {
  const lines: Array<string> = [];

  lines.push(`# Audit Log Export - Workflow #${workflowId}`);
  lines.push('');
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push(`**Total Entries:** ${logs.length}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  if (logs.length === 0) {
    lines.push('*No audit log entries found for this workflow.*');
  } else {
    for (const log of logs) {
      lines.push(formatLogAsMarkdown(log));
    }
  }

  return lines.join('\n');
}

/**
 * Format a single audit log entry as markdown
 */
function formatLogAsMarkdown(log: AuditLog): string {
  const severityIcon = getSeverityIcon(log.severity);
  const timestamp = log.timestamp;
  const lines: Array<string> = [];

  lines.push(`### ${severityIcon} ${log.eventType}`);
  lines.push('');
  lines.push(`**Time:** ${timestamp}`);
  lines.push(`**Category:** ${log.eventCategory}`);
  lines.push(`**Severity:** ${log.severity}`);
  lines.push(`**Source:** ${log.source}`);

  if (log.workflowStepId) {
    lines.push(`**Step ID:** ${log.workflowStepId}`);
  }

  lines.push('');
  lines.push(`**Message:** ${log.message}`);

  if (log.eventData) {
    lines.push('');
    lines.push('**Event Data:**');
    lines.push('```json');
    lines.push(JSON.stringify(log.eventData, null, 2));
    lines.push('```');
  }

  if (log.beforeState || log.afterState) {
    lines.push('');
    lines.push('**State Changes:**');

    if (log.beforeState) {
      lines.push('');
      lines.push('*Before:*');
      lines.push('```json');
      lines.push(JSON.stringify(log.beforeState, null, 2));
      lines.push('```');
    }

    if (log.afterState) {
      lines.push('');
      lines.push('*After:*');
      lines.push('```json');
      lines.push(JSON.stringify(log.afterState, null, 2));
      lines.push('```');
    }
  }

  lines.push('');
  lines.push('---');
  lines.push('');

  return lines.join('\n');
}

/**
 * Get severity icon for markdown display
 */
function getSeverityIcon(severity: string): string {
  switch (severity) {
    case 'debug':
      return '[DEBUG]';
    case 'error':
      return '[ERROR]';
    case 'info':
      return '[INFO]';
    case 'warning':
      return '[WARN]';
    default:
      return '[LOG]';
  }
}

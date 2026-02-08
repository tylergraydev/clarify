import { differenceInMinutes, parseISO } from 'date-fns';

/**
 * Calculates the average duration in minutes from completed workflows
 */
export function calculateAverageDuration(
  workflows: Array<{
    completedAt: null | string;
    durationMs: null | number;
    startedAt: null | string;
    status: string;
  }>
): number {
  const completedWorkflows = workflows.filter((workflow) => workflow.status === 'completed');

  if (completedWorkflows.length === 0) {
    return 0;
  }

  let totalMinutes = 0;
  let validCount = 0;

  for (const workflow of completedWorkflows) {
    // Prefer durationMs if available
    if (workflow.durationMs !== null && workflow.durationMs > 0) {
      totalMinutes += workflow.durationMs / 60000; // Convert ms to minutes
      validCount++;
      continue;
    }

    // Fall back to calculating from startedAt and completedAt
    if (workflow.startedAt && workflow.completedAt) {
      const startDate = parseISO(workflow.startedAt);
      const completedDate = parseISO(workflow.completedAt);
      const minutes = differenceInMinutes(completedDate, startDate);

      if (minutes > 0) {
        totalMinutes += minutes;
        validCount++;
      }
    }
  }

  if (validCount === 0) {
    return 0;
  }

  return Math.round(totalMinutes / validCount);
}

/**
 * Calculates the completion rate as a percentage
 */
export function calculateCompletionRate(workflows: Array<{ status: string }>): number {
  if (workflows.length === 0) {
    return 0;
  }

  const completedCount = workflows.filter((workflow) => workflow.status === 'completed').length;

  return Math.round((completedCount / workflows.length) * 100);
}

/**
 * Formats duration in minutes to a human-readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes === 0) {
    return '0m';
  }

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Formats duration in milliseconds to human-readable format (e.g., "8m 32s", "1h 15m", "45s", "-" for null)
 */
export function formatWorkflowDuration(durationMs: null | number): string {
  if (!durationMs) {
    return '-';
  }

  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

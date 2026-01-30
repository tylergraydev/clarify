import {
  differenceInHours,
  differenceInMinutes,
  formatDistanceToNow,
  parseISO,
} from "date-fns";

import type {
  WorkflowDurationData,
  WorkflowProgressData,
  WorkflowStatus,
  WorkflowStatusBadgeVariant,
} from "../_types";

// ============================================================================
// Progress Utilities
// ============================================================================

/**
 * Calculates progress percentage from current step and total steps
 *
 * @param currentStep - The current step number (can be null/undefined)
 * @param totalSteps - The total number of steps (can be null/undefined)
 * @returns Progress percentage as an integer (0-100)
 *
 * @example
 * calculateProgress(3, 10) // returns 30
 * calculateProgress(null, 10) // returns 0
 * calculateProgress(5, 0) // returns 0
 */
export const calculateProgress = (
  currentStep: null | number | undefined,
  totalSteps: null | number | undefined
): number => {
  if (!currentStep || !totalSteps || totalSteps === 0) {
    return 0;
  }

  return Math.round((currentStep / totalSteps) * 100);
};

/**
 * Calculates progress from a workflow data object
 *
 * @param workflow - Object containing currentStepNumber and totalSteps
 * @returns Progress percentage as an integer (0-100)
 */
export const calculateWorkflowProgress = (
  workflow: WorkflowProgressData
): number => {
  return calculateProgress(workflow.currentStepNumber, workflow.totalSteps);
};

// ============================================================================
// Time Formatting Utilities
// ============================================================================

/**
 * Calculates and formats elapsed time from a start date to now
 *
 * @param startedAt - ISO timestamp string when the workflow started (can be null)
 * @returns Human-readable elapsed time string (e.g., "2h 30m", "45m", "Not started")
 *
 * @example
 * calculateElapsedTime("2024-01-15T10:00:00Z") // returns "2h 30m" (if current time is 12:30)
 * calculateElapsedTime(null) // returns "Not started"
 */
export const calculateElapsedTime = (startedAt: null | string): string => {
  if (!startedAt) {
    return "Not started";
  }

  const startDate = parseISO(startedAt);
  const now = new Date();
  const hours = differenceInHours(now, startDate);
  const minutes = differenceInMinutes(now, startDate) % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
};

/**
 * Formats a duration in milliseconds to a human-readable string
 *
 * @param durationMs - Duration in milliseconds
 * @returns Human-readable duration string (e.g., "2h 30m", "45m", "0m")
 *
 * @example
 * formatWorkflowDuration(9000000) // returns "2h 30m"
 * formatWorkflowDuration(2700000) // returns "45m"
 * formatWorkflowDuration(0) // returns "0m"
 */
export const formatWorkflowDuration = (
  durationMs: null | number | undefined
): string => {
  if (!durationMs || durationMs <= 0) {
    return "0m";
  }

  const totalMinutes = Math.floor(durationMs / 60000);

  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Formats a timestamp to relative time (e.g., "2 hours ago")
 *
 * @param timestamp - ISO timestamp string (can be null)
 * @returns Relative time string with suffix (e.g., "2 hours ago", "in 5 minutes")
 *
 * @example
 * formatRelativeTime("2024-01-15T10:00:00Z") // returns "2 hours ago"
 * formatRelativeTime(null) // returns "Unknown"
 */
export const formatRelativeTime = (timestamp: null | string): string => {
  if (!timestamp) {
    return "Unknown";
  }

  return formatDistanceToNow(parseISO(timestamp), { addSuffix: true });
};

/**
 * Formats a duration in minutes to a human-readable string
 *
 * @param minutes - Duration in minutes
 * @returns Human-readable duration string (e.g., "2h 30m", "45m", "0m")
 *
 * @example
 * formatDurationMinutes(150) // returns "2h 30m"
 * formatDurationMinutes(45) // returns "45m"
 * formatDurationMinutes(0) // returns "0m"
 */
export const formatDurationMinutes = (minutes: number): string => {
  if (minutes === 0) {
    return "0m";
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
};

// ============================================================================
// Status Utilities
// ============================================================================

/**
 * Maps workflow status to badge variant for consistent styling across widgets
 *
 * @param status - The workflow status string
 * @returns The appropriate badge variant for the status
 *
 * @example
 * getStatusBadgeVariant("running") // returns "planning"
 * getStatusBadgeVariant("completed") // returns "completed"
 * getStatusBadgeVariant("failed") // returns "failed"
 */
export const getStatusBadgeVariant = (
  status: string
): WorkflowStatusBadgeVariant => {
  switch (status) {
    case "cancelled":
    case "failed":
      return "failed";
    case "completed":
      return "completed";
    case "editing":
    case "paused":
      return "clarifying";
    case "running":
      return "planning";
    default:
      return "default";
  }
};

/**
 * Formats a status string for display (capitalizes first letter)
 *
 * @param status - The workflow status string
 * @returns Formatted status string with first letter capitalized
 *
 * @example
 * formatStatus("running") // returns "Running"
 * formatStatus("in_progress") // returns "In_progress"
 */
export const formatStatus = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

/**
 * Checks if a workflow status is considered "active" (in progress)
 *
 * @param status - The workflow status to check
 * @returns True if the status is active (running, paused, or editing)
 */
export const isActiveStatus = (status: WorkflowStatus): boolean => {
  return status === "running" || status === "paused" || status === "editing";
};

/**
 * Checks if a workflow status is considered "terminal" (finished)
 *
 * @param status - The workflow status to check
 * @returns True if the status is terminal (completed, failed, or cancelled)
 */
export const isTerminalStatus = (status: WorkflowStatus): boolean => {
  return (
    status === "completed" || status === "failed" || status === "cancelled"
  );
};

// ============================================================================
// Statistics Utilities
// ============================================================================

/**
 * Calculates the average duration in minutes from completed workflows
 *
 * @param workflows - Array of workflow objects with duration data
 * @returns Average duration in minutes (rounded to nearest integer)
 *
 * @example
 * calculateAverageDuration([{ status: "completed", durationMs: 3600000 }]) // returns 60
 */
export const calculateAverageDuration = (
  workflows: Array<WorkflowDurationData>
): number => {
  const completedWorkflows = workflows.filter(
    (workflow) => workflow.status === "completed"
  );

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
};

/**
 * Calculates the completion rate as a percentage
 *
 * @param workflows - Array of workflow objects with status property
 * @returns Completion rate percentage (0-100)
 *
 * @example
 * calculateCompletionRate([{ status: "completed" }, { status: "failed" }]) // returns 50
 */
export const calculateCompletionRate = (
  workflows: Array<{ status: string }>
): number => {
  if (workflows.length === 0) {
    return 0;
  }

  const completedCount = workflows.filter(
    (workflow) => workflow.status === "completed"
  ).length;

  return Math.round((completedCount / workflows.length) * 100);
};

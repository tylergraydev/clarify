/**
 * Shared IPC Utility Functions
 *
 * Common validation helpers, stream forwarding, structured output parsing,
 * and workflow state transition utilities shared across all workflow step
 * IPC handlers (clarification, refinement, discovery, etc.).
 */
import type { BrowserWindow } from 'electron';

import type { WorkflowsRepository, WorkflowStepsRepository } from '../../db/repositories';

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Advance the workflow after a step is skipped.
 *
 * Similar to advanceWorkflowAfterStep but includes additional checks:
 * - Only advances if the workflow is in 'running' or 'awaiting_input' status
 * - Only advances if no other steps are currently running
 *
 * @param workflowsRepo - Repository for updating workflow status
 * @param workflowStepsRepo - Repository for finding and starting steps
 * @param workflowId - The workflow to advance
 * @param skippedStepNumber - The step number of the skipped step
 */
export function advanceWorkflowAfterSkip(
  workflowsRepo: WorkflowsRepository,
  workflowStepsRepo: WorkflowStepsRepository,
  workflowId: number,
  skippedStepNumber: number
): void {
  const workflow = workflowsRepo.findById(workflowId);
  if (!workflow) return;
  if (workflow.status !== 'running' && workflow.status !== 'awaiting_input') return;

  type PauseBehavior = 'auto_pause' | 'continuous';
  const pauseBehavior = (workflow.pauseBehavior ?? 'auto_pause') as PauseBehavior;
  const allSteps = workflowStepsRepo.findByWorkflowId(workflowId);
  const runningStatuses = ['running', 'paused', 'editing', 'awaiting_input'];
  const hasRunningStep = allSteps.some((s) => runningStatuses.includes(s.status));

  if (!hasRunningStep) {
    const nextStep = allSteps
      .filter((s) => s.status === 'pending' && s.stepNumber > skippedStepNumber)
      .sort((a, b) => a.stepNumber - b.stepNumber)[0];

    if (nextStep && pauseBehavior === 'continuous') {
      workflowsRepo.updateStatus(workflowId, 'running');
      workflowStepsRepo.start(nextStep.id);
    } else {
      workflowsRepo.updateStatus(workflowId, 'paused');
    }
  }
}

/**
 * Advance the workflow to the next pending step after a step completes.
 *
 * Checks the workflow's pause behavior setting:
 * - 'continuous': Automatically starts the next pending step and sets workflow to 'running'
 * - 'auto_pause' (default): Pauses the workflow after the current step
 *
 * @param workflowsRepo - Repository for updating workflow status
 * @param workflowStepsRepo - Repository for finding and starting steps
 * @param workflowId - The workflow to advance
 * @param currentStepId - The step that just completed (used to find the next one by stepNumber)
 */
export function advanceWorkflowAfterStep(
  workflowsRepo: WorkflowsRepository,
  workflowStepsRepo: WorkflowStepsRepository,
  workflowId: number,
  currentStepId: number
): void {
  const workflow = workflowsRepo.findById(workflowId);
  if (!workflow) return;

  type PauseBehavior = 'auto_pause' | 'continuous';
  const pauseBehavior = (workflow.pauseBehavior ?? 'auto_pause') as PauseBehavior;

  if (pauseBehavior === 'continuous') {
    workflowsRepo.updateStatus(workflowId, 'running');
    const allSteps = workflowStepsRepo.findByWorkflowId(workflowId);
    const currentStep = allSteps.find((s) => s.id === currentStepId);
    if (currentStep) {
      const nextStep = allSteps
        .filter((s) => s.status === 'pending' && s.stepNumber > currentStep.stepNumber)
        .sort((a, b) => a.stepNumber - b.stepNumber)[0];
      if (nextStep) {
        workflowStepsRepo.start(nextStep.id);
      }
    }
  } else {
    workflowsRepo.updateStatus(workflowId, 'paused');
  }
}

// =============================================================================
// Structured Output Parsing
// =============================================================================

/**
 * Creates a stream message forwarder that sends step streaming events to the
 * renderer process's main window.
 *
 * @param getMainWindow - Function that returns the current main BrowserWindow (or null)
 * @param channel - The IPC channel to send messages on
 * @param extraFields - Optional extra fields to inject into every message (e.g. `{ workflowId }`)
 * @returns A callback suitable for passing as a stream message handler
 */
export function createStreamForwarder<T>(
  getMainWindow: (() => BrowserWindow | null) | undefined,
  channel: string,
  extraFields?: Record<string, unknown>
): (message: T) => void {
  return (message: T) => {
    const mainWindow = getMainWindow?.();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(channel, extraFields ? { ...message, ...extraFields } : message);
    }
  };
}

// =============================================================================
// Stream Forwarding
// =============================================================================

/**
 * Safely parses the `outputStructured` field from a workflow step record.
 *
 * The field can be stored as either a JSON string or a plain object. This helper
 * normalizes it to an object (or returns an empty object if absent).
 *
 * @param outputStructured - The raw `outputStructured` value from a step record
 * @returns The parsed object
 */
export function parseOutputStructured(outputStructured: unknown): Record<string, unknown> {
  if (!outputStructured) {
    return {};
  }
  if (typeof outputStructured === 'string') {
    try {
      const parsed: unknown = JSON.parse(outputStructured);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return {};
    } catch {
      return {};
    }
  }
  if (typeof outputStructured === 'object' && !Array.isArray(outputStructured)) {
    return outputStructured as Record<string, unknown>;
  }
  return {};
}

// =============================================================================
// Workflow State Transitions
// =============================================================================

/**
 * Validates that a value is a valid number ID.
 *
 * @param value - The value to validate
 * @param name - The name of the parameter for error messages
 * @returns The validated number
 * @throws Error if the value is not a valid number
 */
export function validateNumberId(value: unknown, name: string): number {
  if (typeof value !== 'number' || isNaN(value) || value <= 0) {
    throw new Error(`Invalid ${name}: expected positive number, got ${String(value)}`);
  }
  return value;
}

/**
 * Validates that a value is a non-empty string.
 *
 * @param value - The value to validate
 * @param name - The name of the parameter for error messages
 * @returns The validated string
 * @throws Error if the value is not a non-empty string
 */
export function validateString(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Invalid ${name}: expected non-empty string`);
  }
  return value;
}

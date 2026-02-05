/**
 * Agent Step Workflow Pause Utilities
 *
 * Utilities for checking workflow pause behavior and determining
 * if a step should pause execution.
 */

import type { Workflow } from '../../../db/schema';
import type { PauseBehavior } from './step-types';

import { getDatabase } from '../../../db';
import { createWorkflowsRepository } from '../../../db/repositories';

/**
 * Load workflow from database by ID.
 *
 * @param workflowId - The workflow ID to load
 * @returns The workflow or undefined if not found
 */
export function getWorkflow(workflowId: number): undefined | Workflow {
  const db = getDatabase();
  const workflowsRepo = createWorkflowsRepository(db);
  return workflowsRepo.findById(workflowId);
}

/**
 * Check if a pause is requested based on workflow's pause behavior.
 *
 * The pause behavior determines when the workflow should pause:
 * - auto_pause: Pause after every step
 * - continuous: Never pause (run all steps)
 * - gates_only: Only pause at designated gate steps
 *
 * @param workflowId - The workflow ID
 * @param isGateStep - Whether this step is a gate step (e.g., clarification)
 * @returns Whether pause is requested
 */
export function isPauseRequested(workflowId: number, isGateStep = false): boolean {
  const workflow = getWorkflow(workflowId);
  if (!workflow) return false;

  const pauseBehavior = (workflow.pauseBehavior ?? 'auto_pause') as PauseBehavior;

  switch (pauseBehavior) {
    case 'auto_pause':
      // Pause after every step
      return true;
    case 'continuous':
      // Never pause
      return false;
    case 'gates_only':
      // Only pause at gate steps
      return isGateStep;
    default:
      // Default to auto-pause for unknown behaviors
      return true;
  }
}

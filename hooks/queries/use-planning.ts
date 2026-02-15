'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { PlanningEditInput, PlanningFeedbackInput, PlanningStartInput, WorkflowStep } from '@/types/electron';

import { planningKeys } from '@/lib/queries/planning';
import { stepKeys } from '@/lib/queries/steps';

import { useElectronDb } from '../use-electron';
import { invalidateStepQueries } from './invalidation-utils';

// ============================================================================
// Constants
// ============================================================================

const PLANNING_STEP_TYPE = 'implementationPlanning';

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Approve the current plan.
 * Invalidates step and planning state queries on success.
 */
export function useApprovePlan() {
  const queryClient = useQueryClient();
  const { planning } = useElectronDb();

  return useMutation({
    mutationFn: ({ stepId, workflowId }: { stepId: number; workflowId: number }) =>
      planning.approvePlan(workflowId, stepId),
    onSuccess: (_result, { workflowId }: { stepId: number; workflowId: number }) => {
      invalidateStepQueries(queryClient, workflowId, planningKeys.state(workflowId));
    },
  });
}

/**
 * Cancel an active planning session.
 * Invalidates step and planning state queries on success.
 */
export function useCancelPlanning() {
  const queryClient = useQueryClient();
  const { planning } = useElectronDb();

  return useMutation({
    mutationFn: (workflowId: number) => planning.cancel(workflowId),
    onSuccess: (_result, workflowId) => {
      invalidateStepQueries(queryClient, workflowId, planningKeys.state(workflowId));
    },
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Save a directly edited plan.
 * Invalidates step and planning state queries on success.
 */
export function useEditPlan() {
  const queryClient = useQueryClient();
  const { planning } = useElectronDb();

  return useMutation({
    mutationFn: (input: PlanningEditInput) => planning.editPlan(input),
    onSuccess: (_result, input) => {
      invalidateStepQueries(queryClient, input.workflowId, planningKeys.state(input.workflowId));
    },
  });
}

/**
 * Fetch the live planning service state for a workflow.
 * Returns the current phase, agent config, and session info.
 */
export function usePlanningState(workflowId: number) {
  const { isElectron, planning } = useElectronDb();

  return useQuery({
    ...planningKeys.state(workflowId),
    enabled: isElectron && workflowId > 0,
    queryFn: () => planning.getState(workflowId),
    refetchInterval: 1000,
  });
}

/**
 * Fetch the planning step for a workflow.
 * Queries all steps for the workflow and filters to find the planning step.
 */
export function usePlanningStep(workflowId: number) {
  const { isElectron, steps } = useElectronDb();

  return useQuery({
    ...stepKeys.byWorkflow(workflowId),
    enabled: isElectron && workflowId > 0,
    queryFn: async () => {
      const workflowSteps = await steps.list(workflowId);
      return workflowSteps.find((step: WorkflowStep) => step.stepType === PLANNING_STEP_TYPE) ?? null;
    },
    select: (step) => {
      if (!step) return null;

      return {
        ...step,
        outputStructured: step.outputStructured ? (step.outputStructured as Record<string, unknown>) : null,
      };
    },
  });
}

/**
 * Retry planning from scratch.
 * Invalidates step and planning state queries on success.
 */
export function useRetryPlanning() {
  const queryClient = useQueryClient();
  const { planning } = useElectronDb();

  return useMutation({
    mutationFn: (input: PlanningStartInput) => planning.retry(input),
    onSuccess: (_result, input) => {
      invalidateStepQueries(queryClient, input.workflowId, planningKeys.state(input.workflowId));
    },
  });
}

/**
 * Start a planning session for a workflow.
 * Invalidates step and planning state queries on success.
 */
export function useStartPlanning() {
  const queryClient = useQueryClient();
  const { planning } = useElectronDb();

  return useMutation({
    mutationFn: (input: PlanningStartInput) => planning.start(input),
    onSuccess: (_result, input) => {
      invalidateStepQueries(queryClient, input.workflowId, planningKeys.state(input.workflowId));
    },
  });
}

/**
 * Submit feedback on a generated plan.
 * Invalidates step and planning state queries on success.
 */
export function useSubmitPlanFeedback() {
  const queryClient = useQueryClient();
  const { planning } = useElectronDb();

  return useMutation({
    mutationFn: (input: PlanningFeedbackInput) => planning.submitFeedback(input),
    onSuccess: (_result, input) => {
      invalidateStepQueries(queryClient, input.workflowId, planningKeys.state(input.workflowId));
    },
  });
}

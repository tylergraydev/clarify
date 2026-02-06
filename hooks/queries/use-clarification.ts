'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ClarificationRefinementInput, ClarificationStartInput, WorkflowStep } from '@/types/electron';

import { clarificationKeys } from '@/lib/queries/clarification';
import { stepKeys } from '@/lib/queries/steps';
import { workflowKeys } from '@/lib/queries/workflows';

import { useElectronDb } from '../use-electron';

// ============================================================================
// Constants
// ============================================================================

const CLARIFICATION_STEP_TYPE = 'clarification';

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch the live clarification service state for a workflow.
 * Returns the current phase, agent config, questions, and skip reason.
 */
export function useClarificationState(workflowId: number) {
  const { clarification, isElectron } = useElectronDb();

  return useQuery({
    ...clarificationKeys.state(workflowId),
    enabled: isElectron && workflowId > 0,
    queryFn: () => clarification.getState(workflowId),
    refetchInterval: 1000,
  });
}

/**
 * Fetch the clarification step for a workflow.
 * Queries all steps for the workflow and filters to find the clarification step,
 * returning the step record with parsed `outputStructured`.
 */
export function useClarificationStep(workflowId: number) {
  const { isElectron, steps } = useElectronDb();

  return useQuery({
    ...stepKeys.byWorkflow(workflowId),
    enabled: isElectron && workflowId > 0,
    queryFn: async () => {
      const workflowSteps = await steps.list(workflowId);
      return workflowSteps.find((step: WorkflowStep) => step.stepType === CLARIFICATION_STEP_TYPE) ?? null;
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

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Retry a failed clarification session.
 * Invalidates step, clarification state, and workflow detail queries on success.
 */
export function useRetryClarification() {
  const queryClient = useQueryClient();
  const { clarification } = useElectronDb();

  return useMutation({
    mutationFn: (input: ClarificationStartInput) => clarification.retry(input),
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({
        queryKey: stepKeys.byWorkflow(input.workflowId).queryKey,
      });
      void queryClient.invalidateQueries({
        queryKey: stepKeys.listByWorkflow(input.workflowId).queryKey,
      });
      void queryClient.invalidateQueries({
        queryKey: clarificationKeys.state(input.workflowId).queryKey,
      });
      void queryClient.invalidateQueries({
        queryKey: workflowKeys.detail(input.workflowId).queryKey,
      });
    },
  });
}

/**
 * Skip clarification for a workflow.
 * Invalidates step, clarification state, and workflow detail queries on success.
 */
export function useSkipClarification() {
  const queryClient = useQueryClient();
  const { clarification } = useElectronDb();

  return useMutation({
    mutationFn: ({ reason, workflowId }: { reason?: string; workflowId: number }) =>
      clarification.skip(workflowId, reason),
    onSuccess: (_result, { workflowId }) => {
      void queryClient.invalidateQueries({
        queryKey: stepKeys.byWorkflow(workflowId).queryKey,
      });
      void queryClient.invalidateQueries({
        queryKey: stepKeys.listByWorkflow(workflowId).queryKey,
      });
      void queryClient.invalidateQueries({
        queryKey: clarificationKeys.state(workflowId).queryKey,
      });
      void queryClient.invalidateQueries({
        queryKey: workflowKeys.detail(workflowId).queryKey,
      });
    },
  });
}

/**
 * Start a clarification session for a workflow.
 * Invalidates step, clarification state, and workflow detail queries on success.
 */
export function useStartClarification() {
  const queryClient = useQueryClient();
  const { clarification } = useElectronDb();

  return useMutation({
    mutationFn: (input: ClarificationStartInput) => clarification.start(input),
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({
        queryKey: stepKeys.byWorkflow(input.workflowId).queryKey,
      });
      void queryClient.invalidateQueries({
        queryKey: stepKeys.listByWorkflow(input.workflowId).queryKey,
      });
      void queryClient.invalidateQueries({
        queryKey: clarificationKeys.state(input.workflowId).queryKey,
      });
      void queryClient.invalidateQueries({
        queryKey: workflowKeys.detail(input.workflowId).queryKey,
      });
    },
  });
}

/**
 * Submit answers to clarification questions.
 * Invalidates step, clarification state, and workflow detail queries on success.
 */
export function useSubmitClarificationAnswers() {
  const queryClient = useQueryClient();
  const { clarification } = useElectronDb();

  return useMutation({
    mutationFn: (input: ClarificationRefinementInput) => clarification.submitAnswers(input),
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({
        queryKey: stepKeys.byWorkflow(input.workflowId).queryKey,
      });
      void queryClient.invalidateQueries({
        queryKey: stepKeys.listByWorkflow(input.workflowId).queryKey,
      });
      void queryClient.invalidateQueries({
        queryKey: clarificationKeys.state(input.workflowId).queryKey,
      });
      void queryClient.invalidateQueries({
        queryKey: workflowKeys.detail(input.workflowId).queryKey,
      });
    },
  });
}

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type {
  RefinementOutcome,
  RefinementOutcomeWithPause,
  RefinementRegenerateInput,
  RefinementStartInput,
} from '@/types/electron';

import { refinementKeys } from '@/lib/queries/refinement';
import { stepKeys } from '@/lib/queries/steps';
import { workflowKeys } from '@/lib/queries/workflows';

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Cancel an active refinement session.
 */
export function useCancelRefinement() {
  const queryClient = useQueryClient();

  return useMutation<RefinementOutcome, Error, { sessionId: string; stepId: number; workflowId: number }>({
    mutationFn: async ({ sessionId }) => {
      if (!window.electronAPI) {
        throw new Error('Cannot cancel refinement: Electron API not available');
      }
      return window.electronAPI.refinement.cancel(sessionId);
    },
    onSuccess: (_result, { sessionId, stepId, workflowId }) => {
      // Invalidate step queries
      void queryClient.invalidateQueries({ queryKey: stepKeys.detail(stepId).queryKey });
      void queryClient.invalidateQueries({ queryKey: stepKeys.byWorkflow(workflowId).queryKey });
      void queryClient.invalidateQueries({ queryKey: workflowKeys.detail(workflowId).queryKey });

      // Invalidate refinement queries
      void queryClient.invalidateQueries({ queryKey: refinementKeys.detail(sessionId).queryKey });
      void queryClient.invalidateQueries({ queryKey: refinementKeys.byStep(stepId).queryKey });
      void queryClient.invalidateQueries({ queryKey: refinementKeys.byWorkflow(workflowId).queryKey });
    },
  });
}

/**
 * Regenerate refinement output with additional guidance.
 * Used when the user wants to modify the refined feature request.
 */
export function useRegenerateRefinement() {
  const queryClient = useQueryClient();

  return useMutation<RefinementOutcomeWithPause, Error, RefinementRegenerateInput>({
    mutationFn: async (input) => {
      if (!window.electronAPI) {
        throw new Error('Cannot regenerate refinement: Electron API not available');
      }
      return window.electronAPI.refinement.regenerate(input);
    },
    onSuccess: (_result, input) => {
      // Invalidate step queries
      void queryClient.invalidateQueries({ queryKey: stepKeys.detail(input.stepId).queryKey });
      void queryClient.invalidateQueries({ queryKey: stepKeys.byWorkflow(input.workflowId).queryKey });
      void queryClient.invalidateQueries({ queryKey: workflowKeys.detail(input.workflowId).queryKey });

      // Invalidate refinement queries
      void queryClient.invalidateQueries({ queryKey: refinementKeys.byStep(input.stepId).queryKey });
      void queryClient.invalidateQueries({ queryKey: refinementKeys.byWorkflow(input.workflowId).queryKey });
    },
  });
}

/**
 * Retry a refinement session after failure or cancellation.
 */
export function useRetryRefinement() {
  const queryClient = useQueryClient();

  return useMutation<RefinementOutcomeWithPause, Error, { input: RefinementStartInput; sessionId: string }>({
    mutationFn: async ({ input, sessionId }) => {
      if (!window.electronAPI) {
        throw new Error('Cannot retry refinement: Electron API not available');
      }
      return window.electronAPI.refinement.retry(sessionId, input);
    },
    onSuccess: (_result, { input, sessionId }) => {
      // Invalidate step queries
      void queryClient.invalidateQueries({ queryKey: stepKeys.detail(input.stepId).queryKey });
      void queryClient.invalidateQueries({ queryKey: stepKeys.byWorkflow(input.workflowId).queryKey });
      void queryClient.invalidateQueries({ queryKey: workflowKeys.detail(input.workflowId).queryKey });

      // Invalidate refinement queries
      void queryClient.invalidateQueries({ queryKey: refinementKeys.detail(sessionId).queryKey });
      void queryClient.invalidateQueries({ queryKey: refinementKeys.byStep(input.stepId).queryKey });
      void queryClient.invalidateQueries({ queryKey: refinementKeys.byWorkflow(input.workflowId).queryKey });
    },
  });
}

/**
 * Start a refinement session.
 * Takes clarification context and produces a refined feature request.
 */
export function useStartRefinement() {
  const queryClient = useQueryClient();

  return useMutation<RefinementOutcomeWithPause, Error, RefinementStartInput>({
    mutationFn: async (input) => {
      if (!window.electronAPI) {
        throw new Error('Cannot start refinement: Electron API not available');
      }
      return window.electronAPI.refinement.start(input);
    },
    onSuccess: (_result, input) => {
      // Invalidate step queries to reflect the updated state
      void queryClient.invalidateQueries({ queryKey: stepKeys.detail(input.stepId).queryKey });
      void queryClient.invalidateQueries({ queryKey: stepKeys.byWorkflow(input.workflowId).queryKey });
      void queryClient.invalidateQueries({ queryKey: workflowKeys.detail(input.workflowId).queryKey });

      // Invalidate refinement queries
      void queryClient.invalidateQueries({ queryKey: refinementKeys.byStep(input.stepId).queryKey });
      void queryClient.invalidateQueries({ queryKey: refinementKeys.byWorkflow(input.workflowId).queryKey });
    },
  });
}

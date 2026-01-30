"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { stepKeys } from "@/lib/queries/steps";
import { workflowKeys } from "@/lib/queries/workflows";

import { useElectron } from "../use-electron";

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Complete a step with optional output
 */
export function useCompleteStep() {
  const queryClient = useQueryClient();
  const { api } = useElectron();

  return useMutation({
    mutationFn: ({
      durationMs,
      id,
      output,
    }: {
      durationMs?: number;
      id: number;
      output?: string;
    }) => api!.step.complete(id, output, durationMs),
    onSuccess: (step) => {
      if (step) {
        // Update detail cache directly
        queryClient.setQueryData(stepKeys.detail(step.id).queryKey, step);
        // Invalidate step list queries
        void queryClient.invalidateQueries({ queryKey: stepKeys.list._def });
        // Invalidate workflow-specific step queries
        void queryClient.invalidateQueries({
          queryKey: stepKeys.byWorkflow(step.workflowId).queryKey,
        });
        // Invalidate workflow queries since step completion affects workflow state
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.detail(step.workflowId).queryKey,
        });
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.list._def,
        });
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.running.queryKey,
        });
      }
    },
  });
}

/**
 * Edit a step's output
 */
export function useEditStep() {
  const queryClient = useQueryClient();
  const { api } = useElectron();

  return useMutation({
    mutationFn: ({ editedOutput, id }: { editedOutput: string; id: number }) =>
      api!.step.edit(id, editedOutput),
    onSuccess: (step) => {
      if (step) {
        // Update detail cache directly
        queryClient.setQueryData(stepKeys.detail(step.id).queryKey, step);
        // Invalidate step list queries
        void queryClient.invalidateQueries({ queryKey: stepKeys.list._def });
        // Invalidate workflow-specific step queries
        void queryClient.invalidateQueries({
          queryKey: stepKeys.byWorkflow(step.workflowId).queryKey,
        });
        // Invalidate workflow queries since edited steps may affect workflow
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.detail(step.workflowId).queryKey,
        });
      }
    },
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Fail a step with an error message
 */
export function useFailStep() {
  const queryClient = useQueryClient();
  const { api } = useElectron();

  return useMutation({
    mutationFn: ({ errorMessage, id }: { errorMessage: string; id: number }) =>
      api!.step.fail(id, errorMessage),
    onSuccess: (step) => {
      if (step) {
        // Update detail cache directly
        queryClient.setQueryData(stepKeys.detail(step.id).queryKey, step);
        // Invalidate step list queries
        void queryClient.invalidateQueries({ queryKey: stepKeys.list._def });
        // Invalidate workflow-specific step queries
        void queryClient.invalidateQueries({
          queryKey: stepKeys.byWorkflow(step.workflowId).queryKey,
        });
        // Invalidate workflow queries since step failure affects workflow state
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.detail(step.workflowId).queryKey,
        });
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.list._def,
        });
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.running.queryKey,
        });
      }
    },
  });
}

/**
 * Regenerate a step
 */
export function useRegenerateStep() {
  const queryClient = useQueryClient();
  const { api } = useElectron();

  return useMutation({
    mutationFn: (id: number) => api!.step.regenerate(id),
    onSuccess: (step) => {
      if (step) {
        // Update detail cache directly
        queryClient.setQueryData(stepKeys.detail(step.id).queryKey, step);
        // Invalidate step list queries
        void queryClient.invalidateQueries({ queryKey: stepKeys.list._def });
        // Invalidate workflow-specific step queries
        void queryClient.invalidateQueries({
          queryKey: stepKeys.byWorkflow(step.workflowId).queryKey,
        });
        // Invalidate workflow queries since regeneration may affect workflow state
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.detail(step.workflowId).queryKey,
        });
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.list._def,
        });
      }
    },
  });
}

/**
 * Skip a step
 */
export function useSkipStep() {
  const queryClient = useQueryClient();
  const { api } = useElectron();

  return useMutation({
    mutationFn: (id: number) => api!.step.skip(id),
    onSuccess: (step) => {
      if (step) {
        // Update detail cache directly
        queryClient.setQueryData(stepKeys.detail(step.id).queryKey, step);
        // Invalidate step list queries
        void queryClient.invalidateQueries({ queryKey: stepKeys.list._def });
        // Invalidate workflow-specific step queries
        void queryClient.invalidateQueries({
          queryKey: stepKeys.byWorkflow(step.workflowId).queryKey,
        });
        // Invalidate workflow queries since skipping may affect workflow state
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.detail(step.workflowId).queryKey,
        });
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.list._def,
        });
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.running.queryKey,
        });
      }
    },
  });
}

/**
 * Fetch a single step by ID
 */
export function useStep(id: number) {
  const { api, isElectron } = useElectron();

  return useQuery({
    ...stepKeys.detail(id),
    enabled: isElectron && id > 0,
    queryFn: () => api!.step.get(id),
  });
}

/**
 * Fetch all steps for a workflow
 */
export function useStepsByWorkflow(workflowId: number) {
  const { api, isElectron } = useElectron();

  return useQuery({
    ...stepKeys.byWorkflow(workflowId),
    enabled: isElectron && workflowId > 0,
    queryFn: () => api!.step.list(workflowId),
  });
}

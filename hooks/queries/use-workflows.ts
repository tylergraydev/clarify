"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { NewWorkflow } from "@/types/electron";

import { workflowKeys } from "@/lib/queries/workflows";

import { useElectron } from "../use-electron";

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Cancel a workflow
 */
export function useCancelWorkflow() {
  const queryClient = useQueryClient();
  const { api } = useElectron();

  return useMutation({
    mutationFn: (id: number) => api!.workflow.cancel(id),
    onSuccess: (workflow) => {
      if (workflow) {
        // Update detail cache directly
        queryClient.setQueryData(
          workflowKeys.detail(workflow.id).queryKey,
          workflow
        );
        // Invalidate list queries
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.list._def,
        });
        // Invalidate running workflows query
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.running.queryKey,
        });
        // Invalidate project-specific queries
        if (workflow.projectId) {
          void queryClient.invalidateQueries({
            queryKey: workflowKeys.byProject(workflow.projectId).queryKey,
          });
        }
      }
    },
  });
}

/**
 * Create a new workflow
 */
export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  const { api } = useElectron();

  return useMutation({
    mutationFn: (data: NewWorkflow) => api!.workflow.create(data),
    onSuccess: (workflow) => {
      // Invalidate list queries
      void queryClient.invalidateQueries({ queryKey: workflowKeys.list._def });
      // Invalidate project-specific queries if workflow has projectId
      if (workflow.projectId) {
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.byProject(workflow.projectId).queryKey,
        });
      }
    },
  });
}

/**
 * Pause a workflow
 */
export function usePauseWorkflow() {
  const queryClient = useQueryClient();
  const { api } = useElectron();

  return useMutation({
    mutationFn: (id: number) => api!.workflow.pause(id),
    onSuccess: (workflow) => {
      if (workflow) {
        // Update detail cache directly
        queryClient.setQueryData(
          workflowKeys.detail(workflow.id).queryKey,
          workflow
        );
        // Invalidate list queries
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.list._def,
        });
        // Invalidate running workflows query
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.running.queryKey,
        });
        // Invalidate project-specific queries
        if (workflow.projectId) {
          void queryClient.invalidateQueries({
            queryKey: workflowKeys.byProject(workflow.projectId).queryKey,
          });
        }
      }
    },
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Resume a paused workflow
 */
export function useResumeWorkflow() {
  const queryClient = useQueryClient();
  const { api } = useElectron();

  return useMutation({
    mutationFn: (id: number) => api!.workflow.resume(id),
    onSuccess: (workflow) => {
      if (workflow) {
        // Update detail cache directly
        queryClient.setQueryData(
          workflowKeys.detail(workflow.id).queryKey,
          workflow
        );
        // Invalidate list queries
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.list._def,
        });
        // Invalidate running workflows query
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.running.queryKey,
        });
        // Invalidate project-specific queries
        if (workflow.projectId) {
          void queryClient.invalidateQueries({
            queryKey: workflowKeys.byProject(workflow.projectId).queryKey,
          });
        }
      }
    },
  });
}

/**
 * Start a workflow
 */
export function useStartWorkflow() {
  const queryClient = useQueryClient();
  const { api } = useElectron();

  return useMutation({
    mutationFn: (id: number) => api!.workflow.start(id),
    onSuccess: (workflow) => {
      if (workflow) {
        // Update detail cache directly
        queryClient.setQueryData(
          workflowKeys.detail(workflow.id).queryKey,
          workflow
        );
        // Invalidate list queries
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.list._def,
        });
        // Invalidate running workflows query
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.running.queryKey,
        });
        // Invalidate project-specific queries
        if (workflow.projectId) {
          void queryClient.invalidateQueries({
            queryKey: workflowKeys.byProject(workflow.projectId).queryKey,
          });
        }
      }
    },
  });
}

/**
 * Fetch a single workflow by ID
 */
export function useWorkflow(id: number) {
  const { api, isElectron } = useElectron();

  return useQuery({
    ...workflowKeys.detail(id),
    enabled: isElectron && id > 0,
    queryFn: () => api!.workflow.get(id),
  });
}

/**
 * Fetch all workflows
 */
export function useWorkflows() {
  const { api, isElectron } = useElectron();

  return useQuery({
    ...workflowKeys.list(),
    enabled: isElectron,
    queryFn: () => api!.workflow.list(),
  });
}

/**
 * Fetch workflows filtered by project ID
 * Note: Filters client-side since ElectronAPI.workflow.list() doesn't support filters
 */
export function useWorkflowsByProject(projectId: number) {
  const { api, isElectron } = useElectron();

  return useQuery({
    ...workflowKeys.byProject(projectId),
    enabled: isElectron && projectId > 0,
    queryFn: async () => {
      const workflows = await api!.workflow.list();
      return workflows.filter((w) => w.projectId === projectId);
    },
  });
}

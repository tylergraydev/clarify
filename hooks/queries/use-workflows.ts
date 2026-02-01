'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { WorkflowHistoryFilters } from '@/types/electron';

import { workflowKeys } from '@/lib/queries/workflows';

import { useElectronDb } from '../use-electron';

/**
 * Active workflow statuses for filtering
 */
const ACTIVE_STATUSES = ['running', 'paused', 'editing'] as const;

/**
 * Fetch active workflows (running, paused, editing) with automatic polling
 * @param options.enabled - Optional flag to pause polling when not needed (defaults to true)
 */
export function useActiveWorkflows(options?: { enabled?: boolean }) {
  const { isElectron, workflows } = useElectronDb();
  const enabledOption = options?.enabled ?? true;

  return useQuery({
    ...workflowKeys.running,
    enabled: isElectron && enabledOption,
    queryFn: async () => {
      const allWorkflows = await workflows.list();
      return allWorkflows.filter((w) => ACTIVE_STATUSES.includes(w.status as (typeof ACTIVE_STATUSES)[number]));
    },
    refetchInterval: 5000,
  });
}

/**
 * Cancel a workflow
 */
export function useCancelWorkflow() {
  const queryClient = useQueryClient();
  const { workflows } = useElectronDb();

  return useMutation({
    mutationFn: (id: number) => workflows.cancel(id),
    onSuccess: (workflow) => {
      if (workflow) {
        queryClient.setQueryData(workflowKeys.detail(workflow.id).queryKey, workflow);
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.list._def,
        });
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.running.queryKey,
        });
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
 * Create a new workflow with optional auto-start
 */
export function useCreateWorkflow(options?: { autoStart?: boolean }) {
  const queryClient = useQueryClient();
  const { workflows } = useElectronDb();

  return useMutation({
    mutationFn: async (data: Parameters<typeof workflows.create>[0]) => {
      const workflow = await workflows.create(data);
      if (options?.autoStart) {
        const startedWorkflow = await workflows.start(workflow.id);
        return startedWorkflow ?? workflow;
      }
      return workflow;
    },
    onSuccess: (workflow) => {
      if (workflow) {
        queryClient.setQueryData(workflowKeys.detail(workflow.id).queryKey, workflow);
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.list._def,
        });
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.running.queryKey,
        });
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
 * Delete a workflow
 */
export function useDeleteWorkflow() {
  const queryClient = useQueryClient();
  const { workflows } = useElectronDb();

  return useMutation({
    mutationFn: (id: number) => workflows.delete(id),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({
        queryKey: workflowKeys.detail(id).queryKey,
      });
      void queryClient.invalidateQueries({ queryKey: workflowKeys._def });
    },
  });
}

/**
 * Pause a workflow
 */
export function usePauseWorkflow() {
  const queryClient = useQueryClient();
  const { workflows } = useElectronDb();

  return useMutation({
    mutationFn: (id: number) => workflows.pause(id),
    onSuccess: (workflow) => {
      if (workflow) {
        queryClient.setQueryData(workflowKeys.detail(workflow.id).queryKey, workflow);
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.list._def,
        });
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.running.queryKey,
        });
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
 * Resume a paused workflow
 */
export function useResumeWorkflow() {
  const queryClient = useQueryClient();
  const { workflows } = useElectronDb();

  return useMutation({
    mutationFn: (id: number) => workflows.resume(id),
    onSuccess: (workflow) => {
      if (workflow) {
        queryClient.setQueryData(workflowKeys.detail(workflow.id).queryKey, workflow);
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.list._def,
        });
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.running.queryKey,
        });
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
  const { workflows } = useElectronDb();

  return useMutation({
    mutationFn: (id: number) => workflows.start(id),
    onSuccess: (workflow) => {
      if (workflow) {
        queryClient.setQueryData(workflowKeys.detail(workflow.id).queryKey, workflow);
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.list._def,
        });
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.running.queryKey,
        });
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
  const { isElectron, workflows } = useElectronDb();

  return useQuery({
    ...workflowKeys.detail(id),
    enabled: isElectron && id > 0,
    queryFn: () => workflows.get(id),
  });
}

/**
 * Fetch workflow history with pagination, filtering, and sorting
 * Returns terminal-status workflows (completed, failed, cancelled)
 */
export function useWorkflowHistory(filters?: WorkflowHistoryFilters) {
  const { isElectron, workflows } = useElectronDb();

  return useQuery({
    ...workflowKeys.history(filters),
    enabled: isElectron,
    queryFn: () => workflows.listHistory(filters),
  });
}

/**
 * Fetch all workflows
 */
export function useWorkflows() {
  const { isElectron, workflows } = useElectronDb();

  return useQuery({
    ...workflowKeys.list(),
    enabled: isElectron,
    queryFn: () => workflows.list(),
  });
}

/**
 * Fetch workflows filtered by project ID
 * Note: Filters client-side since ElectronAPI.workflow.list() doesn't support filters
 */
export function useWorkflowsByProject(projectId: number) {
  const { isElectron, workflows } = useElectronDb();

  return useQuery({
    ...workflowKeys.byProject(projectId),
    enabled: isElectron && projectId > 0,
    queryFn: async () => {
      const allWorkflows = await workflows.list();
      return allWorkflows.filter((w) => w.projectId === projectId);
    },
  });
}

/**
 * Fetch aggregate statistics for terminal-status workflows
 * Includes completion rates, average duration, and status counts
 */
export function useWorkflowStatistics(filters?: { dateFrom?: string; dateTo?: string; projectId?: number }) {
  const { isElectron, workflows } = useElectronDb();

  return useQuery({
    ...workflowKeys.historyStatistics(filters),
    enabled: isElectron,
    queryFn: () => workflows.getStatistics(filters),
  });
}

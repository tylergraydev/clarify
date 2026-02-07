'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { UpdateWorkflowInput } from '@/lib/validations/workflow';
import type { Workflow, WorkflowHistoryFilters, WorkflowStep } from '@/types/electron';

import { stepKeys } from '@/lib/queries/steps';
import { workflowKeys } from '@/lib/queries/workflows';

import { useElectronDb } from '../use-electron';

/**
 * Active workflow statuses for filtering
 */
const ACTIVE_STATUSES = ['running', 'paused', 'editing', 'awaiting_input'] as const;
const CREATED_STATUS = 'created' as const;

/**
 * Step statuses that count as completed for progress calculation
 */
const COMPLETED_STEP_STATUSES = ['completed', 'skipped'] as const;

/**
 * Fetch active workflows (running, paused, editing) with automatic polling.
 * Enriches each workflow with computed progress from its steps.
 * @param options.enabled - Optional flag to pause polling when not needed (defaults to true)
 */
export function useActiveWorkflows(options?: { enabled?: boolean }) {
  const { isElectron, steps, workflows } = useElectronDb();
  const enabledOption = options?.enabled ?? true;

  return useQuery({
    ...workflowKeys.running,
    enabled: isElectron && enabledOption,
    queryFn: async () => {
      const allWorkflows = await workflows.list();
      const activeWorkflows = allWorkflows.filter((w) =>
        ACTIVE_STATUSES.includes(w.status as (typeof ACTIVE_STATUSES)[number])
      );

      // Fetch steps for each active workflow and compute progress
      return await Promise.all(
        activeWorkflows.map(async (workflow) => {
          const workflowSteps = await steps.list(workflow.id);
          const progress = computeProgress(workflowSteps);
          return {
            ...workflow,
            currentStepNumber: progress.currentStepNumber,
            totalSteps: progress.totalSteps > 0 ? progress.totalSteps : null,
          } as Workflow;
        })
      );
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
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.created.queryKey,
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
 * Fetch created workflows (not started yet) with automatic polling
 * @param options.enabled - Optional flag to pause polling when not needed (defaults to true)
 */
export function useCreatedWorkflows(options?: { enabled?: boolean }) {
  const { isElectron, workflows } = useElectronDb();
  const enabledOption = options?.enabled ?? true;

  return useQuery({
    ...workflowKeys.created,
    enabled: isElectron && enabledOption,
    queryFn: async () => {
      const allWorkflows = await workflows.list();
      return allWorkflows.filter((workflow) => workflow.status === CREATED_STATUS);
    },
    refetchInterval: 5000,
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
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.created.queryKey,
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
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.created.queryKey,
        });
        // Invalidate step queries to fetch newly created planning steps
        void queryClient.invalidateQueries({
          queryKey: stepKeys.byWorkflow(workflow.id).queryKey,
        });
        void queryClient.invalidateQueries({
          queryKey: stepKeys.listByWorkflow(workflow.id).queryKey,
        });
        void queryClient.invalidateQueries({
          queryKey: stepKeys.list._def,
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
 * Update a workflow (only allowed when status is 'created')
 */
export function useUpdateWorkflow() {
  const queryClient = useQueryClient();
  const { workflows } = useElectronDb();

  return useMutation({
    mutationFn: ({ data, id }: { data: UpdateWorkflowInput; id: number }) => workflows.update(id, data),
    onSuccess: (workflow) => {
      if (workflow) {
        queryClient.setQueryData(workflowKeys.detail(workflow.id).queryKey, workflow);
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.list._def,
        });
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.running.queryKey,
        });
        void queryClient.invalidateQueries({
          queryKey: workflowKeys.created.queryKey,
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
 *
 * Uses `keepPreviousData` to maintain smooth pagination transitions,
 * showing previous data while new data is being fetched.
 */
export function useWorkflowHistory(filters?: WorkflowHistoryFilters) {
  const { isElectron, workflows } = useElectronDb();

  return useQuery({
    ...workflowKeys.history(filters),
    enabled: isElectron,
    placeholderData: keepPreviousData,
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

/**
 * Compute progress from workflow steps.
 * Returns currentStepNumber (completed + skipped count) and totalSteps (always step count).
 */
function computeProgress(steps: Array<WorkflowStep>): { currentStepNumber: number; totalSteps: number } {
  const totalSteps = steps.length;
  const currentStepNumber = steps.filter((step) =>
    COMPLETED_STEP_STATUSES.includes(step.status as (typeof COMPLETED_STEP_STATUSES)[number])
  ).length;
  return { currentStepNumber, totalSteps };
}

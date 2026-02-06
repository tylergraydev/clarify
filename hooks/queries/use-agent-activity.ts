'use client';

import { useQuery } from '@tanstack/react-query';

import { agentActivityKeys } from '@/lib/queries/agent-activity';

import { useElectronDb } from '../use-electron';

/**
 * Fetch agent activity records for a specific workflow step.
 * Returns persisted activity from SQLite via IPC.
 *
 * @param stepId - The workflow step ID to fetch activity for
 * @param options.enabled - Optional flag to control query execution (defaults to true)
 */
export function useAgentActivityByStepId(stepId: number, options?: { enabled?: boolean }) {
  const { agentActivity, isElectron } = useElectronDb();

  return useQuery({
    ...agentActivityKeys.byStepId(stepId),
    enabled: isElectron && stepId > 0 && (options?.enabled ?? true),
    queryFn: () => agentActivity.getByStepId(stepId),
  });
}

/**
 * Fetch agent activity records for a specific workflow.
 * Returns all persisted activity across all steps of the workflow.
 *
 * @param workflowId - The workflow ID to fetch activity for
 * @param options.enabled - Optional flag to control query execution (defaults to true)
 */
export function useAgentActivityByWorkflowId(workflowId: number, options?: { enabled?: boolean }) {
  const { agentActivity, isElectron } = useElectronDb();

  return useQuery({
    ...agentActivityKeys.byWorkflowId(workflowId),
    enabled: isElectron && workflowId > 0 && (options?.enabled ?? true),
    queryFn: () => agentActivity.getByWorkflowId(workflowId),
  });
}

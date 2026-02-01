'use client';

import { useQuery } from '@tanstack/react-query';

import { worktreeKeys } from '@/lib/queries/worktrees';

import { useElectronDb } from '../use-electron';

/**
 * Fetch a single worktree by ID
 */
export function useWorktree(id: null | number | undefined) {
  const { isElectron, worktrees } = useElectronDb();

  return useQuery({
    ...worktreeKeys.detail(id!),
    enabled: isElectron && id !== null && id !== undefined,
    queryFn: () => worktrees.get(id!),
  });
}

/**
 * Fetch a worktree by workflow ID
 * Used to get branch information for workflows
 */
export function useWorktreeByWorkflowId(workflowId: null | number | undefined) {
  const { isElectron, worktrees } = useElectronDb();

  return useQuery({
    ...worktreeKeys.byWorkflowId(workflowId!),
    enabled: isElectron && workflowId !== null && workflowId !== undefined,
    queryFn: () => worktrees.getByWorkflowId(workflowId!),
  });
}

/**
 * Fetch all worktrees with optional filters
 */
export function useWorktrees(options?: { repositoryId?: number; status?: string }) {
  const { isElectron, worktrees } = useElectronDb();

  return useQuery({
    ...worktreeKeys.list(options),
    enabled: isElectron,
    queryFn: () => worktrees.list(options),
  });
}

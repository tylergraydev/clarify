'use client';

import { useMemo } from 'react';

import { useElectron } from '../use-electron-base';

export function useElectronWorktrees() {
  const { api } = useElectron();

  const worktrees = useMemo(
    () => ({
      cleanup: async (workflowId: number) => {
        if (!api) return false;
        return api.worktree.cleanup(workflowId);
      },
      create: async (input: { featureName: string; repositoryId: number; workflowId: number }) => {
        if (!api) return undefined;
        return api.worktree.create(input);
      },
      get: async (id: number) => {
        if (!api) return undefined;
        return api.worktree.get(id);
      },
      getByWorkflowId: async (workflowId: number) => {
        if (!api) return undefined;
        return api.worktree.getByWorkflowId(workflowId);
      },
      list: async (options?: { repositoryId?: number; status?: string }) => {
        if (!api) return [];
        return api.worktree.list(options);
      },
    }),
    [api]
  );

  return { worktrees };
}

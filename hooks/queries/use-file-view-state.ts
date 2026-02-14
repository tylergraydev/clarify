'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fileViewStateKeys } from '@/lib/queries/diff';

import { useElectronDb } from '../use-electron';

/**
 * Fetch all viewed files for a workflow.
 */
export function useFileViewStates(workflowId: number | undefined) {
  const { fileViewState, isElectron } = useElectronDb();

  return useQuery({
    ...fileViewStateKeys.list(workflowId!),
    enabled: isElectron && workflowId !== undefined,
    queryFn: () => fileViewState.list(workflowId!),
  });
}

/**
 * Get view statistics for a workflow.
 */
export function useFileViewStats(workflowId: number | undefined, totalFiles: number) {
  const { fileViewState, isElectron } = useElectronDb();

  return useQuery({
    ...fileViewStateKeys.stats(workflowId!),
    enabled: isElectron && workflowId !== undefined,
    queryFn: () => fileViewState.getStats(workflowId!, totalFiles),
  });
}

/**
 * Mark a file as unviewed.
 */
export function useMarkFileUnviewed(workflowId: number) {
  const queryClient = useQueryClient();
  const { fileViewState } = useElectronDb();

  return useMutation({
    mutationFn: (filePath: string) => fileViewState.markUnviewed(workflowId, filePath),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: fileViewStateKeys.list(workflowId).queryKey });
      void queryClient.invalidateQueries({ queryKey: fileViewStateKeys.stats(workflowId).queryKey });
    },
  });
}

/**
 * Mark a file as viewed.
 */
export function useMarkFileViewed(workflowId: number) {
  const queryClient = useQueryClient();
  const { fileViewState } = useElectronDb();

  return useMutation({
    mutationFn: (filePath: string) => fileViewState.markViewed(workflowId, filePath),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: fileViewStateKeys.list(workflowId).queryKey });
      void queryClient.invalidateQueries({ queryKey: fileViewStateKeys.stats(workflowId).queryKey });
    },
  });
}

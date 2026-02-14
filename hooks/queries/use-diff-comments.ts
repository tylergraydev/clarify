'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { NewDiffCommentRow } from '@/db/schema';

import { diffCommentKeys } from '@/lib/queries/diff';

import { useElectronDb } from '../use-electron';

/**
 * Create a new diff comment.
 */
export function useCreateDiffComment() {
  const queryClient = useQueryClient();
  const { diffComments } = useElectronDb();

  return useMutation({
    mutationFn: (data: NewDiffCommentRow) => diffComments.create(data),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: diffCommentKeys.byWorkflow(variables.workflowId).queryKey });
    },
  });
}

/**
 * Delete a diff comment.
 */
export function useDeleteDiffComment(workflowId: number) {
  const queryClient = useQueryClient();
  const { diffComments } = useElectronDb();

  return useMutation({
    mutationFn: (id: number) => diffComments.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: diffCommentKeys.byWorkflow(workflowId).queryKey });
    },
  });
}

/**
 * Fetch all comments for a workflow.
 */
export function useDiffComments(workflowId: number | undefined) {
  const { diffComments, isElectron } = useElectronDb();

  return useQuery({
    ...diffCommentKeys.byWorkflow(workflowId!),
    enabled: isElectron && workflowId !== undefined,
    queryFn: () => diffComments.list(workflowId!),
  });
}

/**
 * Fetch comments for a specific file in a workflow.
 */
export function useDiffCommentsByFile(workflowId: number | undefined, filePath: string | undefined) {
  const { diffComments, isElectron } = useElectronDb();

  return useQuery({
    ...diffCommentKeys.byFile(workflowId!, filePath!),
    enabled: isElectron && workflowId !== undefined && !!filePath,
    queryFn: () => diffComments.listByFile(workflowId!, filePath!),
  });
}

/**
 * Toggle resolved state of a diff comment.
 */
export function useToggleDiffCommentResolved(workflowId: number) {
  const queryClient = useQueryClient();
  const { diffComments } = useElectronDb();

  return useMutation({
    mutationFn: (id: number) => diffComments.toggleResolved(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: diffCommentKeys.byWorkflow(workflowId).queryKey });
    },
  });
}

/**
 * Update a diff comment.
 */
export function useUpdateDiffComment(workflowId: number) {
  const queryClient = useQueryClient();
  const { diffComments } = useElectronDb();

  return useMutation({
    mutationFn: ({ content, id }: { content: string; id: number }) => diffComments.update(id, { content }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: diffCommentKeys.byWorkflow(workflowId).queryKey });
    },
  });
}

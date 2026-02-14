'use client';

import { useMemo } from 'react';

import type { DiffCommentRow, NewDiffCommentRow } from '@/db/schema';

import { useElectron } from '../use-electron-base';

export function useElectronDiffComments() {
  const { api } = useElectron();

  const diffComments = useMemo(
    () => ({
      create: async (data: NewDiffCommentRow) => {
        if (!api) throw new Error('Electron API not available');
        return api.diffComment.create(data);
      },
      delete: async (id: number) => {
        if (!api) return false;
        return api.diffComment.delete(id);
      },
      list: async (workflowId: number) => {
        if (!api) return [] as Array<DiffCommentRow>;
        return api.diffComment.list(workflowId);
      },
      listByFile: async (workflowId: number, filePath: string) => {
        if (!api) return [] as Array<DiffCommentRow>;
        return api.diffComment.listByFile(workflowId, filePath);
      },
      toggleResolved: async (id: number) => {
        if (!api) return undefined;
        return api.diffComment.toggleResolved(id);
      },
      update: async (id: number, data: { content: string }) => {
        if (!api) return undefined;
        return api.diffComment.update(id, data);
      },
    }),
    [api]
  );

  return { diffComments };
}

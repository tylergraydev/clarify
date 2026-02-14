'use client';

import { useMemo } from 'react';

import type { FileViewStateRow } from '@/db/schema';

import { useElectron } from '../use-electron-base';

export function useElectronFileViewState() {
  const { api } = useElectron();

  const fileViewState = useMemo(
    () => ({
      getStats: async (workflowId: number, totalFiles: number) => {
        if (!api) return { totalFiles, viewedFiles: 0 };
        return api.fileViewState.getStats(workflowId, totalFiles);
      },
      list: async (workflowId: number) => {
        if (!api) return [] as Array<FileViewStateRow>;
        return api.fileViewState.list(workflowId);
      },
      markUnviewed: async (workflowId: number, filePath: string) => {
        if (!api) return false;
        return api.fileViewState.markUnviewed(workflowId, filePath);
      },
      markViewed: async (workflowId: number, filePath: string) => {
        if (!api) throw new Error('Electron API not available');
        return api.fileViewState.markViewed(workflowId, filePath);
      },
    }),
    [api]
  );

  return { fileViewState };
}

'use client';

import { useCallback } from 'react';

import { useElectron } from './use-electron-base';

export function useElectronFileExplorer() {
  const { api, isElectron } = useElectron();

  const listDirectory = useCallback(
    async (
      repoPath: string,
      dirPath?: string
    ): Promise<{
      entries: Array<{ name: string; relativePath: string; type: 'directory' | 'file' }>;
      error?: string;
      success: boolean;
    }> => {
      if (!api) return { entries: [], error: 'Not running in Electron', success: false };
      return api.fileExplorer.listDirectory(repoPath, dirPath);
    },
    [api]
  );

  const searchFiles = useCallback(
    async (
      repoPath: string,
      query: string,
      limit?: number
    ): Promise<{
      error?: string;
      results: Array<{ relativePath: string; score: number }>;
      success: boolean;
    }> => {
      if (!api) return { error: 'Not running in Electron', results: [], success: false };
      return api.fileExplorer.searchFiles(repoPath, query, limit);
    },
    [api]
  );

  return {
    isElectron,
    listDirectory,
    searchFiles,
  };
}

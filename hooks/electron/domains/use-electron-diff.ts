'use client';

import { useMemo } from 'react';

import type { DiffOptions, FileDiffOptions, GitLogOptions } from '@/types/diff';

import { useElectron } from '../use-electron-base';

export function useElectronDiff() {
  const { api } = useElectron();

  const diff = useMemo(
    () => ({
      getBranches: async (repoPath: string) => {
        if (!api) return [];
        return api.diff.getBranches(repoPath);
      },
      getDiff: async (repoPath: string, options?: DiffOptions) => {
        if (!api) return { files: [], stats: { deletions: 0, fileCount: 0, insertions: 0 } };
        return api.diff.getDiff(repoPath, options);
      },
      getFileContent: async (repoPath: string, filePath: string, ref?: string) => {
        if (!api) return '';
        return api.diff.getFileContent(repoPath, filePath, ref);
      },
      getFileDiff: async (repoPath: string, options: FileDiffOptions) => {
        if (!api) return { files: [], stats: { deletions: 0, fileCount: 0, insertions: 0 } };
        return api.diff.getFileDiff(repoPath, options);
      },
      getLog: async (repoPath: string, options?: GitLogOptions) => {
        if (!api) return [];
        return api.diff.getLog(repoPath, options);
      },
      getStatus: async (repoPath: string) => {
        if (!api) return { files: [], summary: { deleted: 0, modified: 0, staged: 0, untracked: 0 } };
        return api.diff.getStatus(repoPath);
      },
      getWorktreeDiff: async (worktreePath: string, baseBranch?: string) => {
        if (!api) {
          const empty = { files: [], stats: { deletions: 0, fileCount: 0, insertions: 0 } };
          return { committed: empty, uncommitted: empty };
        }
        return api.diff.getWorktreeDiff(worktreePath, baseBranch);
      },
    }),
    [api]
  );

  return { diff };
}

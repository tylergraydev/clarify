'use client';

import { useQuery } from '@tanstack/react-query';

import type { DiffOptions, GitLogOptions } from '@/types/diff';

import { diffKeys } from '@/lib/queries/diff';

import { useElectronDb } from '../use-electron';

/**
 * Fetch a git diff for a repository.
 */
export function useDiff(repoPath: string | undefined, options?: DiffOptions) {
  const { diff, isElectron } = useElectronDb();

  return useQuery({
    ...diffKeys.result(repoPath!, { base: options?.base, target: options?.target }),
    enabled: isElectron && !!repoPath,
    queryFn: () => diff.getDiff(repoPath!, options),
  });
}

/**
 * Fetch file content at a specific ref.
 */
export function useFileContent(repoPath: string | undefined, filePath: string | undefined, ref?: string) {
  const { diff, isElectron } = useElectronDb();

  return useQuery({
    ...diffKeys.fileContent(repoPath!, filePath!, ref),
    enabled: isElectron && !!repoPath && !!filePath,
    queryFn: () => diff.getFileContent(repoPath!, filePath!, ref),
  });
}

/**
 * Fetch git branches for a repository.
 */
export function useGitBranches(repoPath: string | undefined) {
  const { diff, isElectron } = useElectronDb();

  return useQuery({
    ...diffKeys.branches(repoPath!),
    enabled: isElectron && !!repoPath,
    queryFn: () => diff.getBranches(repoPath!),
  });
}

/**
 * Fetch git log for a repository.
 */
export function useGitLog(repoPath: string | undefined, options?: GitLogOptions) {
  const { diff, isElectron } = useElectronDb();

  return useQuery({
    ...diffKeys.log(repoPath!, { limit: options?.limit, ref: options?.ref }),
    enabled: isElectron && !!repoPath,
    queryFn: () => diff.getLog(repoPath!, options),
  });
}

/**
 * Fetch git status for a repository.
 */
export function useGitStatus(repoPath: string | undefined) {
  const { diff, isElectron } = useElectronDb();

  return useQuery({
    ...diffKeys.status(repoPath!),
    enabled: isElectron && !!repoPath,
    queryFn: () => diff.getStatus(repoPath!),
  });
}

/**
 * Fetch a worktree diff (committed + uncommitted changes).
 */
export function useWorktreeDiff(worktreePath: string | undefined, baseBranch?: string) {
  const { diff, isElectron } = useElectronDb();

  return useQuery({
    ...diffKeys.worktreeDiff(worktreePath!, baseBranch),
    enabled: isElectron && !!worktreePath,
    queryFn: () => diff.getWorktreeDiff(worktreePath!, baseBranch),
  });
}

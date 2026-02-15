'use client';

import { useQuery } from '@tanstack/react-query';

import { useElectronFileExplorer } from '@/hooks/electron/use-electron-file-explorer';
import { fileExplorerKeys } from '@/lib/queries/file-explorer';

/**
 * Fetch directory listing for a single level of a repository tree.
 * Results are cached for 30 seconds to avoid re-fetching on collapse/expand.
 */
export function useDirectoryListing(repoPath: string | undefined, dirPath?: string) {
  const { isElectron, listDirectory } = useElectronFileExplorer();

  return useQuery({
    ...fileExplorerKeys.directory(repoPath ?? '', dirPath),
    enabled: isElectron && !!repoPath,
    queryFn: async () => {
      const result = await listDirectory(repoPath!, dirPath);
      if (!result.success) {
        throw new Error(result.error ?? 'Failed to list directory');
      }
      return result.entries;
    },
    staleTime: 30_000,
  });
}

/**
 * Fuzzy search files in a repository.
 * Only enabled when the query has at least 1 character.
 */
export function useFileSearch(repoPath: string | undefined, query: string) {
  const { isElectron, searchFiles } = useElectronFileExplorer();

  return useQuery({
    ...fileExplorerKeys.search(repoPath ?? '', query),
    enabled: isElectron && !!repoPath && query.length >= 1,
    queryFn: async () => {
      const result = await searchFiles(repoPath!, query);
      if (!result.success) {
        throw new Error(result.error ?? 'Failed to search files');
      }
      return result.results;
    },
    staleTime: 10_000,
  });
}

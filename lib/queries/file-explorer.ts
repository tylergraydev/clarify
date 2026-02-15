import { createQueryKeys } from '@lukemorales/query-key-factory';

export const fileExplorerKeys = createQueryKeys('fileExplorer', {
  directory: (repoPath: string, dirPath?: string) => [repoPath, dirPath ?? ''],
  search: (repoPath: string, query: string) => [repoPath, query],
});

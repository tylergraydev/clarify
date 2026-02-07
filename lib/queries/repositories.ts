import { createQueryKeys } from '@lukemorales/query-key-factory';

export const repositoryKeys = createQueryKeys('repositories', {
  byProject: (projectId: number) => [projectId],
  default: (projectId: number) => [projectId],
  detail: (id: number) => [id],
  list: (filters?: { projectId?: number }) => [{ filters }],
  preDeleteInfo: (repositoryId: number) => [repositoryId],
});

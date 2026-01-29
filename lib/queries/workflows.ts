import { createQueryKeys } from '@lukemorales/query-key-factory';

export const workflowKeys = createQueryKeys('workflows', {
  byProject: (projectId: number) => [projectId],
  byStatus: (status: string) => [status],
  byType: (type: string) => [type],
  detail: (id: number) => [id],
  list: (filters?: { projectId?: number; status?: string; type?: string }) => [{ filters }],
  running: null,
});

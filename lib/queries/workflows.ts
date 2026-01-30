import { createQueryKeys } from "@lukemorales/query-key-factory";

import type { WorkflowHistoryFilters } from "@/types/electron";

export const workflowKeys = createQueryKeys("workflows", {
  byProject: (projectId: number) => [projectId],
  byStatus: (status: string) => [status],
  byType: (type: string) => [type],
  detail: (id: number) => [id],
  history: (filters?: WorkflowHistoryFilters) => [{ filters }],
  historyStatistics: (filters?: {
    dateFrom?: string;
    dateTo?: string;
    projectId?: number;
  }) => [{ filters }],
  list: (filters?: { projectId?: number; status?: string; type?: string }) => [
    { filters },
  ],
  running: null,
});

import { createQueryKeys } from '@lukemorales/query-key-factory';

export const auditLogKeys = createQueryKeys('auditLogs', {
  byEventCategory: (eventCategory: string) => [eventCategory],
  byWorkflow: (workflowId: number) => [workflowId],
  byWorkflowStep: (workflowStepId: number) => [workflowStepId],
  detail: (id: number) => [id],
  list: (filters?: { eventCategory?: string; limit?: number; severity?: string; workflowId?: number }) => [
    { filters },
  ],
  recent: (limit: number) => [limit],
});

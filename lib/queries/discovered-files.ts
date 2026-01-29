import { createQueryKeys } from "@lukemorales/query-key-factory";

export const discoveredFileKeys = createQueryKeys("discoveredFiles", {
  byWorkflowStep: (workflowStepId: number) => [workflowStepId],
  detail: (id: number) => [id],
  included: (workflowStepId: number) => [workflowStepId],
  list: (filters?: { priority?: string; workflowStepId?: number }) => [
    { filters },
  ],
});

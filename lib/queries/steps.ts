import { createQueryKeys } from "@lukemorales/query-key-factory";

export const stepKeys = createQueryKeys("steps", {
  byWorkflow: (workflowId: number) => [workflowId],
  detail: (id: number) => [id],
  list: (filters?: { status?: string; workflowId?: number }) => [{ filters }],
});

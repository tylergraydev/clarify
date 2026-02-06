import { createQueryKeys } from '@lukemorales/query-key-factory';

export const agentActivityKeys = createQueryKeys('agentActivity', {
  byStepId: (stepId: number) => [stepId],
  byWorkflowId: (workflowId: number) => [workflowId],
});

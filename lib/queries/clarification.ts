import { createQueryKeys } from '@lukemorales/query-key-factory';

export const clarificationKeys = createQueryKeys('clarification', {
  byStep: (stepId: number) => [stepId],
  byWorkflow: (workflowId: number) => [workflowId],
  state: (workflowId: number) => [workflowId],
});

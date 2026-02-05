import { createQueryKeys } from '@lukemorales/query-key-factory';

export const refinementKeys = createQueryKeys('refinement', {
  byStep: (stepId: number) => [stepId],
  byWorkflow: (workflowId: number) => [workflowId],
  detail: (sessionId: string) => [sessionId],
});

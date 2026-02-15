import { createQueryKeys } from '@lukemorales/query-key-factory';

export const planningKeys = createQueryKeys('planning', {
  state: (workflowId: number) => [workflowId],
});

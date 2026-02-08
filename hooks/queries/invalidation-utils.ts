import type { QueryClient } from '@tanstack/react-query';

import { stepKeys } from '@/lib/queries/steps';
import { workflowKeys } from '@/lib/queries/workflows';

/**
 * Invalidate common step-related queries after a mutation succeeds.
 *
 * Invalidates: step by workflow, step list by workflow, step-specific state query,
 * and workflow detail. Used by all step mutation hooks (clarification, refinement,
 * discovery, planning) to keep cached data in sync.
 *
 * @param queryClient - The React Query client
 * @param workflowId - The workflow ID to invalidate queries for
 * @param stepStateQueryKey - Optional step-specific state query key to invalidate
 */
export function invalidateStepQueries(
  queryClient: QueryClient,
  workflowId: number,
  stepStateQueryKey?: { queryKey: ReadonlyArray<unknown> },
): void {
  void queryClient.invalidateQueries({
    queryKey: stepKeys.byWorkflow(workflowId).queryKey,
  });
  void queryClient.invalidateQueries({
    queryKey: stepKeys.listByWorkflow(workflowId).queryKey,
  });
  if (stepStateQueryKey) {
    void queryClient.invalidateQueries({
      queryKey: stepStateQueryKey.queryKey,
    });
  }
  void queryClient.invalidateQueries({
    queryKey: workflowKeys.detail(workflowId).queryKey,
  });
}

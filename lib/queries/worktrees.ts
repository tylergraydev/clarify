import { createQueryKeys } from "@lukemorales/query-key-factory";

/**
 * Query keys for worktree-related queries.
 *
 * Key structure:
 * - `worktrees.list()` - All worktrees
 * - `worktrees.list({ repositoryId, status })` - Filtered worktrees
 * - `worktrees.detail(id)` - Single worktree by ID
 * - `worktrees.byWorkflowId(workflowId)` - Worktree for a specific workflow
 */
export const worktreeKeys = createQueryKeys("worktrees", {
  /**
   * Query key for worktree associated with a workflow.
   */
  byWorkflowId: (workflowId: number) => [workflowId],
  /**
   * Query key for a single worktree by ID.
   */
  detail: (id: number) => [id],
  /**
   * Query key for worktree lists with optional filtering.
   */
  list: (filters?: { repositoryId?: number; status?: string }) => [{ filters }],
});

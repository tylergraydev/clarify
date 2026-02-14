import { createQueryKeys } from '@lukemorales/query-key-factory';

/**
 * Query keys for diff-related queries.
 *
 * Key structure:
 * - `diff.result(repoPath, options)` - Full diff result
 * - `diff.fileDiff(repoPath, options)` - Single file diff
 * - `diff.status(repoPath)` - Git status
 * - `diff.log(repoPath, options)` - Git log entries
 * - `diff.branches(repoPath)` - Git branches
 * - `diff.worktreeDiff(worktreePath, baseBranch)` - Worktree diff (committed + uncommitted)
 * - `diff.fileContent(repoPath, filePath, ref)` - File content at ref
 */
export const diffKeys = createQueryKeys('diff', {
  branches: (repoPath: string) => [repoPath],
  fileContent: (repoPath: string, filePath: string, ref?: string) => [repoPath, filePath, ref],
  fileDiff: (repoPath: string, options?: { base?: string; filePath?: string; target?: string }) => [
    repoPath,
    options,
  ],
  log: (repoPath: string, options?: { limit?: number; ref?: string }) => [repoPath, options],
  result: (repoPath: string, options?: { base?: string; target?: string }) => [repoPath, options],
  status: (repoPath: string) => [repoPath],
  worktreeDiff: (worktreePath: string, baseBranch?: string) => [worktreePath, baseBranch],
});

/**
 * Query keys for diff comment queries.
 */
export const diffCommentKeys = createQueryKeys('diffComments', {
  byFile: (workflowId: number, filePath: string) => [workflowId, filePath],
  byWorkflow: (workflowId: number) => [workflowId],
});

/**
 * Query keys for file view state queries.
 */
export const fileViewStateKeys = createQueryKeys('fileViewState', {
  list: (workflowId: number) => [workflowId],
  stats: (workflowId: number) => [workflowId],
});

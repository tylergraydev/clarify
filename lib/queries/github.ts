import { createQueryKeys } from '@lukemorales/query-key-factory';

import type { PrListFilters } from '@/types/github';

/**
 * Query keys for GitHub-related queries.
 *
 * Key structure:
 * - `github.auth` - GitHub CLI auth status
 * - `github.repoInfo(repoPath)` - Repository info from GitHub
 * - `github.prTemplate(repoPath)` - PR template detection
 * - `github.prs(repoPath, filters)` - Pull request list
 * - `github.pr(repoPath, prNumber)` - Single pull request detail
 * - `github.prDiff(repoPath, prNumber)` - Parsed diff for a PR
 * - `github.prComments(repoPath, prNumber)` - PR review comments
 * - `github.checks(repoPath, ref)` - Check runs for a ref
 * - `github.deployments(repoPath, prNumber)` - Deployments for a PR
 */
export const githubKeys = createQueryKeys('github', {
  auth: null,
  checks: (repoPath: string, ref: string) => [repoPath, ref],
  deployments: (repoPath: string, prNumber: number) => [repoPath, prNumber],
  pr: (repoPath: string, prNumber: number) => [repoPath, prNumber],
  prComments: (repoPath: string, prNumber: number) => [repoPath, prNumber],
  prDiff: (repoPath: string, prNumber: number) => [repoPath, prNumber],
  prs: (repoPath: string, filters?: PrListFilters) => [repoPath, filters],
  prTemplate: (repoPath: string) => [repoPath],
  repoInfo: (repoPath: string) => [repoPath],
});

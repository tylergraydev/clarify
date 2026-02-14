/**
 * Type definitions for GitHub PR integration.
 *
 * These types are used across the IPC boundary (main <-> renderer)
 * and in React components for managing pull requests.
 */

// =============================================================================
// Auth & Repo Info
// =============================================================================

/**
 * Input for creating a PR comment.
 */
export interface CreatePrCommentInput {
  body: string;
  line: number;
  path: string;
  side?: 'LEFT' | 'RIGHT';
}

/**
 * Input for creating a pull request.
 */
export interface CreatePrInput {
  base?: string;
  body: string;
  draft?: boolean;
  head?: string;
  title: string;
}

// =============================================================================
// Pull Request Types
// =============================================================================

/**
 * GitHub CLI authentication status.
 */
export interface GitHubAuthStatus {
  account: string;
  host: string;
  isAuthenticated: boolean;
  protocol: string;
}

/**
 * A GitHub check run (CI/CD status).
 */
export interface GitHubCheckRun {
  completedAt: null | string;
  conclusion: null | string;
  detailsUrl: null | string;
  name: string;
  startedAt: null | string;
  status: string;
  workflowName: string;
}

/**
 * A GitHub deployment.
 */
export interface GitHubDeployment {
  createdAt: string;
  description: null | string;
  environment: string;
  id: number;
  state: string;
  url: null | string;
}

/**
 * A GitHub PR review comment.
 */
export interface GitHubPrComment {
  author: string;
  body: string;
  createdAt: string;
  id: number;
  inReplyToId: null | number;
  line: null | number;
  path: string;
  side: string;
  updatedAt: string;
}

/**
 * A GitHub pull request.
 */
export interface GitHubPullRequest {
  additions: number;
  author: string;
  baseRefName: string;
  body: string;
  changedFiles: number;
  closedAt: null | string;
  createdAt: string;
  deletions: number;
  headRefName: string;
  headRefOid: string;
  isDraft: boolean;
  mergedAt: null | string;
  mergedBy: null | string;
  number: number;
  reviewDecision: null | string;
  state: 'CLOSED' | 'MERGED' | 'OPEN';
  title: string;
  updatedAt: string;
  url: string;
}

// =============================================================================
// PR Comments
// =============================================================================

/**
 * GitHub repository info from `gh repo view`.
 */
export interface GitHubRepoInfo {
  defaultBranch: string;
  description: string;
  fullName: string;
  isArchived: boolean;
  isFork: boolean;
  isPrivate: boolean;
  name: string;
  owner: string;
  url: string;
}

/**
 * Result of a merge operation.
 */
export interface MergeResult {
  message: string;
  success: boolean;
}

// =============================================================================
// Checks & Deployments
// =============================================================================

/**
 * Merge strategy for pull requests.
 */
export type MergeStrategy = 'merge' | 'rebase' | 'squash';

/**
 * Filters for listing pull requests.
 */
export interface PrListFilters {
  author?: string;
  label?: string;
  search?: string;
  state?: 'all' | 'closed' | 'merged' | 'open';
}

// =============================================================================
// Filters
// =============================================================================

/**
 * Input for updating a pull request.
 */
export interface UpdatePrInput {
  body?: string;
  title?: string;
}

export {};

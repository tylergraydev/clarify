'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CreatePrCommentInput, CreatePrInput, MergeStrategy, PrListFilters, UpdatePrInput } from '@/types/github';

import { githubKeys } from '@/lib/queries/github';

import { useElectronDb } from '../use-electron';

// =============================================================================
// Connection Status
// =============================================================================

/**
 * Close a pull request.
 */
export function useClosePullRequest() {
  const { github } = useElectronDb();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ prNumber, repoPath }: { prNumber: number; repoPath: string }) =>
      github.closePr(repoPath, prNumber),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(githubKeys.pr(variables.repoPath, variables.prNumber).queryKey, data);
      void queryClient.invalidateQueries({ queryKey: githubKeys.prs(variables.repoPath).queryKey });
    },
  });
}

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Convert a draft PR to ready for review.
 */
export function useConvertToReady() {
  const { github } = useElectronDb();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ prNumber, repoPath }: { prNumber: number; repoPath: string }) =>
      github.convertToReady(repoPath, prNumber),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(githubKeys.pr(variables.repoPath, variables.prNumber).queryKey, data);
      void queryClient.invalidateQueries({ queryKey: githubKeys.prs(variables.repoPath).queryKey });
    },
  });
}

/**
 * Create a PR review comment.
 */
export function useCreatePrComment() {
  const { github } = useElectronDb();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, prNumber, repoPath }: { input: CreatePrCommentInput; prNumber: number; repoPath: string }) =>
      github.createPrComment(repoPath, prNumber, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: githubKeys.prComments(variables.repoPath, variables.prNumber).queryKey });
    },
  });
}

/**
 * Create a pull request.
 */
export function useCreatePullRequest() {
  const { github } = useElectronDb();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, repoPath }: { input: CreatePrInput; repoPath: string }) =>
      github.createPr(repoPath, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: githubKeys.prs(variables.repoPath).queryKey });
    },
  });
}

/**
 * Check GitHub CLI authentication status.
 */
export function useGitHubAuth() {
  const { github, isElectron } = useElectronDb();

  return useQuery({
    ...githubKeys.auth,
    enabled: isElectron,
    queryFn: () => github.checkAuth(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Combined GitHub connection status (auth + network).
 * Returns whether GitHub is reachable and authenticated.
 */
export function useGitHubConnectionStatus() {
  const { github, isElectron } = useElectronDb();

  const authQuery = useQuery({
    ...githubKeys.auth,
    enabled: isElectron,
    queryFn: () => github.checkAuth(),
    retry: 1,
    staleTime: 60_000,
  });

  const isAuthenticated = authQuery.data?.isAuthenticated ?? false;
  const isLoading = authQuery.isLoading;
  const isOffline = authQuery.isError;

  return {
    account: authQuery.data?.account ?? '',
    isAuthenticated,
    isLoading,
    isOffline,
  };
}

/**
 * Fetch GitHub repository info.
 */
export function useGitHubRepoInfo(repoPath: string | undefined) {
  const { github, isElectron } = useElectronDb();

  return useQuery({
    ...githubKeys.repoInfo(repoPath!),
    enabled: isElectron && !!repoPath,
    queryFn: () => github.getRepoInfo(repoPath!),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Merge a pull request.
 */
export function useMergePullRequest() {
  const { github } = useElectronDb();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ prNumber, repoPath, strategy }: { prNumber: number; repoPath: string; strategy: MergeStrategy }) =>
      github.mergePr(repoPath, prNumber, strategy),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: githubKeys.pr(variables.repoPath, variables.prNumber).queryKey });
      void queryClient.invalidateQueries({ queryKey: githubKeys.prs(variables.repoPath).queryKey });
    },
  });
}

/**
 * Fetch check runs for a ref.
 */
export function usePrChecks(repoPath: string | undefined, ref: string | undefined) {
  const { github, isElectron } = useElectronDb();

  return useQuery({
    ...githubKeys.checks(repoPath!, ref!),
    enabled: isElectron && !!repoPath && !!ref,
    queryFn: () => github.listChecks(repoPath!, ref!),
    refetchInterval: 15_000,
  });
}

/**
 * Fetch PR review comments.
 */
export function usePrComments(repoPath: string | undefined, prNumber: number | undefined) {
  const { github, isElectron } = useElectronDb();

  return useQuery({
    ...githubKeys.prComments(repoPath!, prNumber!),
    enabled: isElectron && !!repoPath && !!prNumber,
    queryFn: () => github.listPrComments(repoPath!, prNumber!),
    refetchInterval: 30_000,
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Fetch deployments for a PR.
 */
export function usePrDeployments(repoPath: string | undefined, prNumber: number | undefined) {
  const { github, isElectron } = useElectronDb();

  return useQuery({
    ...githubKeys.deployments(repoPath!, prNumber!),
    enabled: isElectron && !!repoPath && !!prNumber,
    queryFn: () => github.getDeployments(repoPath!, prNumber!),
    staleTime: 60_000,
  });
}

/**
 * Fetch parsed diff for a PR.
 */
export function usePrDiff(repoPath: string | undefined, prNumber: number | undefined) {
  const { github, isElectron } = useElectronDb();

  return useQuery({
    ...githubKeys.prDiff(repoPath!, prNumber!),
    enabled: isElectron && !!repoPath && !!prNumber,
    queryFn: () => github.getPrDiffParsed(repoPath!, prNumber!),
    staleTime: 30_000,
  });
}

/**
 * Detect PR template in a repository.
 */
export function usePrTemplate(repoPath: string | undefined) {
  const { github, isElectron } = useElectronDb();

  return useQuery({
    ...githubKeys.prTemplate(repoPath!),
    enabled: isElectron && !!repoPath,
    queryFn: () => github.detectPrTemplate(repoPath!),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Fetch a single pull request.
 */
export function usePullRequest(repoPath: string | undefined, prNumber: number | undefined) {
  const { github, isElectron } = useElectronDb();

  return useQuery({
    ...githubKeys.pr(repoPath!, prNumber!),
    enabled: isElectron && !!repoPath && !!prNumber,
    queryFn: () => github.getPr(repoPath!, prNumber!),
    refetchInterval: 15_000,
  });
}

/**
 * Fetch pull requests for a repository.
 */
export function usePullRequests(repoPath: string | undefined, filters?: PrListFilters) {
  const { github, isElectron } = useElectronDb();

  return useQuery({
    ...githubKeys.prs(repoPath!, filters),
    enabled: isElectron && !!repoPath,
    queryFn: () => github.listPrs(repoPath!, filters),
    refetchInterval: 30_000,
  });
}

/**
 * Push a local comment to GitHub.
 */
export function usePushCommentToGitHub() {
  const { github } = useElectronDb();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ localCommentId, prNumber, repoPath }: { localCommentId: number; prNumber: number; repoPath: string }) =>
      github.pushComment(repoPath, prNumber, localCommentId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: githubKeys.prComments(variables.repoPath, variables.prNumber).queryKey });
    },
  });
}

/**
 * Reply to a PR comment.
 */
export function useReplyToPrComment() {
  const { github } = useElectronDb();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ body, commentId, prNumber, repoPath }: { body: string; commentId: number; prNumber: number; repoPath: string }) =>
      github.replyToPrComment(repoPath, prNumber, commentId, body),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: githubKeys.prComments(variables.repoPath, variables.prNumber).queryKey });
    },
  });
}

/**
 * Re-run a specific check.
 */
export function useRerunCheck() {
  const { github } = useElectronDb();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ repoPath, runId }: { ref: string; repoPath: string; runId: number }) =>
      github.rerunCheck(repoPath, runId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: githubKeys.checks._def });
    },
  });
}

/**
 * Re-run failed checks.
 */
export function useRerunFailedChecks() {
  const { github } = useElectronDb();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ repoPath, runId }: { ref: string; repoPath: string; runId: number }) =>
      github.rerunFailedChecks(repoPath, runId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: githubKeys.checks._def });
    },
  });
}

/**
 * Sync comments from GitHub to local.
 */
export function useSyncCommentsFromGitHub() {
  const { github } = useElectronDb();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ prNumber, repoPath, workflowId }: { prNumber: number; repoPath: string; workflowId: number }) =>
      github.syncComments(repoPath, prNumber, workflowId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: githubKeys.prComments(variables.repoPath, variables.prNumber).queryKey });
    },
  });
}

/**
 * Update a pull request.
 */
export function useUpdatePullRequest() {
  const { github } = useElectronDb();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, prNumber, repoPath }: { input: UpdatePrInput; prNumber: number; repoPath: string }) =>
      github.updatePr(repoPath, prNumber, input),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(githubKeys.pr(variables.repoPath, variables.prNumber).queryKey, data);
      void queryClient.invalidateQueries({ queryKey: githubKeys.prs(variables.repoPath).queryKey });
    },
  });
}

/**
 * GitHub IPC Handlers
 *
 * Handles GitHub operations including:
 * - Auth status check
 * - Pull request CRUD and management
 * - PR diff retrieval (raw and parsed)
 * - PR comments (list, create, reply)
 * - Check runs and deployments
 */
import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { DiffCommentsRepository } from '../../db/repositories';
import type { DiffCommentRow } from '../../db/schema';
import type { GitDiffResult } from '../../types/diff';
import type {
  CreatePrCommentInput,
  CreatePrInput,
  GitHubAuthStatus,
  GitHubCheckRun,
  GitHubDeployment,
  GitHubPrComment,
  GitHubPullRequest,
  GitHubRepoInfo,
  MergeResult,
  MergeStrategy,
  PrListFilters,
  UpdatePrInput,
} from '../../types/github';

import { type CommentSyncResult, githubCommentSyncService } from '../services/github-comment-sync.service';
import { githubService } from '../services/github.service';
import { IpcChannels } from './channels';

/**
 * Register all GitHub-related IPC handlers.
 */
export function registerGitHubHandlers(diffCommentsRepository?: DiffCommentsRepository): void {
  // Inject repository into sync service if provided
  if (diffCommentsRepository) {
    githubCommentSyncService.setDiffCommentsRepository(diffCommentsRepository);
  }
  // Check GitHub CLI auth status
  ipcMain.handle(
    IpcChannels.github.checkAuth,
    async (_event: IpcMainInvokeEvent): Promise<GitHubAuthStatus> => {
      try {
        return await githubService.checkAuth();
      } catch (error) {
        console.error('[IPC Error] github:checkAuth:', error);
        throw error;
      }
    }
  );

  // Get repo info
  ipcMain.handle(
    IpcChannels.github.getRepoInfo,
    async (_event: IpcMainInvokeEvent, repoPath: string): Promise<GitHubRepoInfo> => {
      try {
        return await githubService.getRepoInfo(repoPath);
      } catch (error) {
        console.error('[IPC Error] github:getRepoInfo:', error);
        throw error;
      }
    }
  );

  // Detect PR template
  ipcMain.handle(
    IpcChannels.github.detectPrTemplate,
    async (_event: IpcMainInvokeEvent, repoPath: string): Promise<null | string> => {
      try {
        return await githubService.detectPrTemplate(repoPath);
      } catch (error) {
        console.error('[IPC Error] github:detectPrTemplate:', error);
        throw error;
      }
    }
  );

  // List pull requests
  ipcMain.handle(
    IpcChannels.github.listPrs,
    async (_event: IpcMainInvokeEvent, repoPath: string, filters?: PrListFilters): Promise<Array<GitHubPullRequest>> => {
      try {
        return await githubService.listPullRequests(repoPath, filters);
      } catch (error) {
        console.error('[IPC Error] github:listPrs:', error);
        throw error;
      }
    }
  );

  // Get a single pull request
  ipcMain.handle(
    IpcChannels.github.getPr,
    async (_event: IpcMainInvokeEvent, repoPath: string, prNumber: number): Promise<GitHubPullRequest> => {
      try {
        return await githubService.getPullRequest(repoPath, prNumber);
      } catch (error) {
        console.error('[IPC Error] github:getPr:', error);
        throw error;
      }
    }
  );

  // Create a pull request
  ipcMain.handle(
    IpcChannels.github.createPr,
    async (_event: IpcMainInvokeEvent, repoPath: string, input: CreatePrInput): Promise<GitHubPullRequest> => {
      try {
        return await githubService.createPullRequest(repoPath, input);
      } catch (error) {
        console.error('[IPC Error] github:createPr:', error);
        throw error;
      }
    }
  );

  // Update a pull request
  ipcMain.handle(
    IpcChannels.github.updatePr,
    async (_event: IpcMainInvokeEvent, repoPath: string, prNumber: number, input: UpdatePrInput): Promise<GitHubPullRequest> => {
      try {
        return await githubService.updatePullRequest(repoPath, prNumber, input);
      } catch (error) {
        console.error('[IPC Error] github:updatePr:', error);
        throw error;
      }
    }
  );

  // Merge a pull request
  ipcMain.handle(
    IpcChannels.github.mergePr,
    async (_event: IpcMainInvokeEvent, repoPath: string, prNumber: number, strategy: MergeStrategy): Promise<MergeResult> => {
      try {
        return await githubService.mergePullRequest(repoPath, prNumber, strategy);
      } catch (error) {
        console.error('[IPC Error] github:mergePr:', error);
        throw error;
      }
    }
  );

  // Close a pull request
  ipcMain.handle(
    IpcChannels.github.closePr,
    async (_event: IpcMainInvokeEvent, repoPath: string, prNumber: number): Promise<GitHubPullRequest> => {
      try {
        return await githubService.closePullRequest(repoPath, prNumber);
      } catch (error) {
        console.error('[IPC Error] github:closePr:', error);
        throw error;
      }
    }
  );

  // Convert draft to ready
  ipcMain.handle(
    IpcChannels.github.convertToReady,
    async (_event: IpcMainInvokeEvent, repoPath: string, prNumber: number): Promise<GitHubPullRequest> => {
      try {
        return await githubService.convertToReady(repoPath, prNumber);
      } catch (error) {
        console.error('[IPC Error] github:convertToReady:', error);
        throw error;
      }
    }
  );

  // Get PR diff (raw)
  ipcMain.handle(
    IpcChannels.github.getPrDiff,
    async (_event: IpcMainInvokeEvent, repoPath: string, prNumber: number): Promise<string> => {
      try {
        return await githubService.getPrDiff(repoPath, prNumber);
      } catch (error) {
        console.error('[IPC Error] github:getPrDiff:', error);
        throw error;
      }
    }
  );

  // Get PR diff (parsed)
  ipcMain.handle(
    IpcChannels.github.getPrDiffParsed,
    async (_event: IpcMainInvokeEvent, repoPath: string, prNumber: number): Promise<GitDiffResult> => {
      try {
        return await githubService.getPrDiffParsed(repoPath, prNumber);
      } catch (error) {
        console.error('[IPC Error] github:getPrDiffParsed:', error);
        throw error;
      }
    }
  );

  // List PR comments
  ipcMain.handle(
    IpcChannels.github.listPrComments,
    async (_event: IpcMainInvokeEvent, repoPath: string, prNumber: number): Promise<Array<GitHubPrComment>> => {
      try {
        return await githubService.listPrComments(repoPath, prNumber);
      } catch (error) {
        console.error('[IPC Error] github:listPrComments:', error);
        throw error;
      }
    }
  );

  // Create a PR comment
  ipcMain.handle(
    IpcChannels.github.createPrComment,
    async (
      _event: IpcMainInvokeEvent,
      repoPath: string,
      prNumber: number,
      input: CreatePrCommentInput
    ): Promise<GitHubPrComment> => {
      try {
        return await githubService.createPrComment(repoPath, prNumber, input);
      } catch (error) {
        console.error('[IPC Error] github:createPrComment:', error);
        throw error;
      }
    }
  );

  // Reply to a PR comment
  ipcMain.handle(
    IpcChannels.github.replyToPrComment,
    async (
      _event: IpcMainInvokeEvent,
      repoPath: string,
      prNumber: number,
      commentId: number,
      body: string
    ): Promise<GitHubPrComment> => {
      try {
        return await githubService.replyToPrComment(repoPath, prNumber, commentId, body);
      } catch (error) {
        console.error('[IPC Error] github:replyToPrComment:', error);
        throw error;
      }
    }
  );

  // List check runs
  ipcMain.handle(
    IpcChannels.github.listChecks,
    async (_event: IpcMainInvokeEvent, repoPath: string, ref: string): Promise<Array<GitHubCheckRun>> => {
      try {
        return await githubService.listChecks(repoPath, ref);
      } catch (error) {
        console.error('[IPC Error] github:listChecks:', error);
        throw error;
      }
    }
  );

  // Re-run failed checks
  ipcMain.handle(
    IpcChannels.github.rerunFailedChecks,
    async (_event: IpcMainInvokeEvent, repoPath: string, runId: number): Promise<void> => {
      try {
        await githubService.rerunFailedChecks(repoPath, runId);
      } catch (error) {
        console.error('[IPC Error] github:rerunFailedChecks:', error);
        throw error;
      }
    }
  );

  // Re-run a specific check
  ipcMain.handle(
    IpcChannels.github.rerunCheck,
    async (_event: IpcMainInvokeEvent, repoPath: string, runId: number): Promise<void> => {
      try {
        await githubService.rerunCheck(repoPath, runId);
      } catch (error) {
        console.error('[IPC Error] github:rerunCheck:', error);
        throw error;
      }
    }
  );

  // List deployments
  ipcMain.handle(
    IpcChannels.github.getDeployments,
    async (_event: IpcMainInvokeEvent, repoPath: string, prNumber: number): Promise<Array<GitHubDeployment>> => {
      try {
        return await githubService.listDeployments(repoPath, prNumber);
      } catch (error) {
        console.error('[IPC Error] github:getDeployments:', error);
        throw error;
      }
    }
  );

  // Sync comments from GitHub to local
  ipcMain.handle(
    IpcChannels.github.syncComments,
    async (
      _event: IpcMainInvokeEvent,
      repoPath: string,
      prNumber: number,
      workflowId: number
    ): Promise<CommentSyncResult> => {
      try {
        return await githubCommentSyncService.syncFromGitHub(repoPath, prNumber, workflowId);
      } catch (error) {
        console.error('[IPC Error] github:syncComments:', error);
        throw error;
      }
    }
  );

  // Push a local comment to GitHub
  ipcMain.handle(
    IpcChannels.github.pushComment,
    async (
      _event: IpcMainInvokeEvent,
      repoPath: string,
      prNumber: number,
      localCommentId: number
    ): Promise<DiffCommentRow> => {
      try {
        return await githubCommentSyncService.pushToGitHub(repoPath, prNumber, localCommentId);
      } catch (error) {
        console.error('[IPC Error] github:pushComment:', error);
        throw error;
      }
    }
  );
}

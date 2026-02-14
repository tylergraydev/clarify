/**
 * GitHub Service
 *
 * Provides GitHub operations (PR management, checks, deployments, comments)
 * via the `gh` CLI. All operations are async and shell out to `gh`.
 */
import { execFile } from 'child_process';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { promisify } from 'util';

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

import { parseDiff } from '../utils/diff-parser';

const execFileAsync = promisify(execFile);

const MAX_BUFFER = 10 * 1024 * 1024; // 10 MB

class GitHubService {
  /**
   * Check if `gh` CLI is authenticated.
   */
  async checkAuth(): Promise<GitHubAuthStatus> {
    try {
      const output = await this.exec(['auth', 'status', '--show-token=false']);
      // Parse the auth status output
      const hostMatch = output.match(/Logged in to ([^\s]+)/);
      const accountMatch = output.match(/account ([^\s]+)/);
      const protocolMatch = output.match(/Git operations protocol: ([^\s]+)/);

      return {
        account: accountMatch?.[1] ?? '',
        host: hostMatch?.[1] ?? 'github.com',
        isAuthenticated: true,
        protocol: protocolMatch?.[1] ?? 'https',
      };
    } catch {
      return {
        account: '',
        host: 'github.com',
        isAuthenticated: false,
        protocol: '',
      };
    }
  }

  /**
   * Close a pull request.
   */
  async closePullRequest(repoPath: string, prNumber: number): Promise<GitHubPullRequest> {
    await this.exec(['pr', 'close', String(prNumber)], repoPath);
    return this.getPullRequest(repoPath, prNumber);
  }

  /**
   * Convert a draft PR to ready for review.
   */
  async convertToReady(repoPath: string, prNumber: number): Promise<GitHubPullRequest> {
    await this.exec(['pr', 'ready', String(prNumber)], repoPath);
    return this.getPullRequest(repoPath, prNumber);
  }

  /**
   * Create a PR review comment.
   */
  async createPrComment(
    repoPath: string,
    prNumber: number,
    input: CreatePrCommentInput
  ): Promise<GitHubPrComment> {
    const repoInfo = await this.getRepoInfo(repoPath);
    // Get the PR to find the latest commit
    const pr = await this.getPullRequest(repoPath, prNumber);

    const output = await this.exec([
      'api',
      `repos/${repoInfo.fullName}/pulls/${prNumber}/comments`,
      '-X', 'POST',
      '-f', `body=${input.body}`,
      '-f', `path=${input.path}`,
      '-F', `line=${input.line}`,
      '-f', `commit_id=${pr.headRefOid}`,
      '-f', `side=${input.side ?? 'RIGHT'}`,
    ], repoPath);
    const comment = JSON.parse(output);
    return this.mapPrComment(comment);
  }

  /**
   * Create a pull request.
   */
  async createPullRequest(repoPath: string, input: CreatePrInput): Promise<GitHubPullRequest> {
    const args = ['pr', 'create', '--title', input.title, '--body', input.body];

    if (input.base) {
      args.push('--base', input.base);
    }
    if (input.head) {
      args.push('--head', input.head);
    }
    if (input.draft) {
      args.push('--draft');
    }

    await this.exec(args, repoPath);

    // Fetch the newly created PR
    const listOutput = await this.exec(
      ['pr', 'list', '--head', input.head ?? 'HEAD', '--json', 'number', '--limit', '1'],
      repoPath
    );
    const [created] = JSON.parse(listOutput) as Array<{ number: number }>;
    if (!created) {
      throw new Error('PR was created but could not be retrieved');
    }
    return this.getPullRequest(repoPath, created.number);
  }

  /**
   * Detect PR template in the repo.
   */
  async detectPrTemplate(repoPath: string): Promise<null | string> {
    const templatePaths = [
      '.github/PULL_REQUEST_TEMPLATE.md',
      '.github/pull_request_template.md',
      'PULL_REQUEST_TEMPLATE.md',
      'docs/PULL_REQUEST_TEMPLATE.md',
    ];

    for (const templatePath of templatePaths) {
      try {
        const content = await readFile(join(repoPath, templatePath), 'utf-8');
        return content;
      } catch {
        // Template not found at this path, try next
      }
    }
    return null;
  }

  /**
   * Get the raw diff for a PR.
   */
  async getPrDiff(repoPath: string, prNumber: number): Promise<string> {
    return this.exec(['pr', 'diff', String(prNumber)], repoPath);
  }

  /**
   * Get a parsed diff for a PR.
   */
  async getPrDiffParsed(repoPath: string, prNumber: number): Promise<GitDiffResult> {
    const rawDiff = await this.getPrDiff(repoPath, prNumber);
    return parseDiff(rawDiff);
  }

  /**
   * Get a single pull request by number.
   */
  async getPullRequest(repoPath: string, prNumber: number): Promise<GitHubPullRequest> {
    const output = await this.exec(
      [
        'pr', 'view', String(prNumber),
        '--json', 'number,title,author,state,isDraft,headRefName,baseRefName,createdAt,updatedAt,url,additions,deletions,changedFiles,headRefOid,reviewDecision,closedAt,mergedAt,mergedBy,body',
      ],
      repoPath
    );
    const pr = JSON.parse(output);
    return this.mapPullRequest(pr);
  }

  /**
   * Get repository info.
   */
  async getRepoInfo(repoPath: string): Promise<GitHubRepoInfo> {
    const output = await this.exec(
      ['repo', 'view', '--json', 'name,owner,description,url,defaultBranchRef,isArchived,isFork,isPrivate,nameWithOwner'],
      repoPath
    );
    const data = JSON.parse(output);
    return {
      defaultBranch: data.defaultBranchRef?.name ?? 'main',
      description: data.description ?? '',
      fullName: data.nameWithOwner ?? '',
      isArchived: data.isArchived ?? false,
      isFork: data.isFork ?? false,
      isPrivate: data.isPrivate ?? false,
      name: data.name ?? '',
      owner: data.owner?.login ?? '',
      url: data.url ?? '',
    };
  }

  /**
   * List check runs for a ref.
   */
  async listChecks(repoPath: string, ref: string): Promise<Array<GitHubCheckRun>> {
    const output = await this.exec(
      ['run', 'list', '--json', 'name,status,conclusion,startedAt,completedAt,url,workflowName', '--commit', ref],
      repoPath
    );
    const runs = JSON.parse(output) as Array<Record<string, unknown>>;
    return runs.map((run) => ({
      completedAt: (run.completedAt as null | string) ?? null,
      conclusion: (run.conclusion as null | string) ?? null,
      detailsUrl: (run.url as null | string) ?? null,
      name: (run.name as string) ?? '',
      startedAt: (run.startedAt as null | string) ?? null,
      status: (run.status as string) ?? '',
      workflowName: (run.workflowName as string) ?? '',
    }));
  }

  /**
   * List deployments for a PR.
   */
  async listDeployments(repoPath: string, prNumber: number): Promise<Array<GitHubDeployment>> {
    const repoInfo = await this.getRepoInfo(repoPath);
    const pr = await this.getPullRequest(repoPath, prNumber);
    const output = await this.exec([
      'api',
      `repos/${repoInfo.fullName}/deployments`,
      '-f', `ref=${pr.headRefName}`,
    ], repoPath);
    const deployments = JSON.parse(output) as Array<Record<string, unknown>>;
    return deployments.map((d) => ({
      createdAt: (d.created_at as string) ?? '',
      description: (d.description as null | string) ?? null,
      environment: (d.environment as string) ?? '',
      id: (d.id as number) ?? 0,
      state: (d.state as string) ?? '',
      url: (d.environment_url as null | string) ?? (d.url as null | string) ?? null,
    }));
  }

  /**
   * List PR review comments.
   */
  async listPrComments(repoPath: string, prNumber: number): Promise<Array<GitHubPrComment>> {
    const repoInfo = await this.getRepoInfo(repoPath);
    const output = await this.exec([
      'api',
      `repos/${repoInfo.fullName}/pulls/${prNumber}/comments`,
      '--paginate',
    ], repoPath);
    const comments = JSON.parse(output) as Array<Record<string, unknown>>;
    return comments.map((c) => this.mapPrComment(c));
  }

  /**
   * List pull requests with optional filters.
   */
  async listPullRequests(repoPath: string, filters?: PrListFilters): Promise<Array<GitHubPullRequest>> {
    const args = [
      'pr', 'list',
      '--json', 'number,title,author,state,isDraft,headRefName,baseRefName,createdAt,updatedAt,url,additions,deletions,changedFiles,headRefOid,reviewDecision,closedAt,mergedAt,mergedBy,body',
      '--limit', '100',
    ];

    if (filters?.state && filters.state !== 'all') {
      args.push('--state', filters.state);
    }

    if (filters?.author) {
      args.push('--author', filters.author);
    }

    if (filters?.label) {
      args.push('--label', filters.label);
    }

    if (filters?.search) {
      args.push('--search', filters.search);
    }

    const output = await this.exec(args, repoPath);
    const prs = JSON.parse(output) as Array<Record<string, unknown>>;
    return prs.map((pr) => this.mapPullRequest(pr));
  }

  /**
   * Merge a pull request.
   */
  async mergePullRequest(repoPath: string, prNumber: number, strategy: MergeStrategy): Promise<MergeResult> {
    const strategyFlags: Record<MergeStrategy, string> = {
      merge: '--merge',
      rebase: '--rebase',
      squash: '--squash',
    };

    try {
      await this.exec(
        ['pr', 'merge', String(prNumber), strategyFlags[strategy], '--delete-branch'],
        repoPath
      );
      return { message: `PR #${prNumber} merged successfully`, success: true };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return { message: msg, success: false };
    }
  }

  /**
   * Reply to a PR comment.
   */
  async replyToPrComment(
    repoPath: string,
    prNumber: number,
    commentId: number,
    body: string
  ): Promise<GitHubPrComment> {
    const repoInfo = await this.getRepoInfo(repoPath);
    const output = await this.exec([
      'api',
      `repos/${repoInfo.fullName}/pulls/${prNumber}/comments/${commentId}/replies`,
      '-X', 'POST',
      '-f', `body=${body}`,
    ], repoPath);
    const comment = JSON.parse(output);
    return this.mapPrComment(comment);
  }

  /**
   * Re-run a specific check.
   */
  async rerunCheck(repoPath: string, runId: number): Promise<void> {
    await this.exec(['run', 'rerun', String(runId)], repoPath);
  }

  /**
   * Re-run failed checks.
   */
  async rerunFailedChecks(repoPath: string, runId: number): Promise<void> {
    await this.exec(['run', 'rerun', String(runId), '--failed'], repoPath);
  }

  /**
   * Update a pull request.
   */
  async updatePullRequest(repoPath: string, prNumber: number, input: UpdatePrInput): Promise<GitHubPullRequest> {
    const args = ['pr', 'edit', String(prNumber)];

    if (input.title) {
      args.push('--title', input.title);
    }
    if (input.body !== undefined) {
      args.push('--body', input.body);
    }

    await this.exec(args, repoPath);
    return this.getPullRequest(repoPath, prNumber);
  }

  /**
   * Execute a gh CLI command and return stdout.
   */
  private async exec(args: Array<string>, cwd?: string): Promise<string> {
    const { stdout } = await execFileAsync('gh', args, {
      cwd,
      env: { ...process.env, GH_PROMPT_DISABLED: '1' },
      maxBuffer: MAX_BUFFER,
    });
    return stdout;
  }

  /**
   * Map raw API response to GitHubPrComment.
   */
  private mapPrComment(c: Record<string, unknown>): GitHubPrComment {
    const user = c.user as Record<string, unknown> | undefined;
    return {
      author: (user?.login as string) ?? '',
      body: (c.body as string) ?? '',
      createdAt: (c.created_at as string) ?? '',
      id: (c.id as number) ?? 0,
      inReplyToId: (c.in_reply_to_id as null | number) ?? null,
      line: (c.line as null | number) ?? null,
      path: (c.path as string) ?? '',
      side: (c.side as string) ?? 'RIGHT',
      updatedAt: (c.updated_at as string) ?? '',
    };
  }

  /**
   * Map raw gh JSON to GitHubPullRequest.
   */
  private mapPullRequest(pr: Record<string, unknown>): GitHubPullRequest {
    const author = pr.author as Record<string, unknown> | undefined;
    const mergedBy = pr.mergedBy as Record<string, unknown> | undefined;
    return {
      additions: (pr.additions as number) ?? 0,
      author: (author?.login as string) ?? '',
      baseRefName: (pr.baseRefName as string) ?? '',
      body: (pr.body as string) ?? '',
      changedFiles: (pr.changedFiles as number) ?? 0,
      closedAt: (pr.closedAt as null | string) ?? null,
      createdAt: (pr.createdAt as string) ?? '',
      deletions: (pr.deletions as number) ?? 0,
      headRefName: (pr.headRefName as string) ?? '',
      headRefOid: (pr.headRefOid as string) ?? '',
      isDraft: (pr.isDraft as boolean) ?? false,
      mergedAt: (pr.mergedAt as null | string) ?? null,
      mergedBy: (mergedBy?.login as null | string) ?? null,
      number: (pr.number as number) ?? 0,
      reviewDecision: (pr.reviewDecision as null | string) ?? null,
      state: (pr.state as 'CLOSED' | 'MERGED' | 'OPEN') ?? 'OPEN',
      title: (pr.title as string) ?? '',
      updatedAt: (pr.updatedAt as string) ?? '',
      url: (pr.url as string) ?? '',
    };
  }
}

export const githubService = new GitHubService();

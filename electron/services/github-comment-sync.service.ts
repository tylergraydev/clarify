/**
 * GitHub Comment Sync Service
 *
 * Bidirectional sync between local diff comments and GitHub PR review comments.
 * - syncFromGitHub: fetches GitHub comments and upserts locally
 * - pushToGitHub: posts a local comment to GitHub as a PR review comment
 */
import type { DiffCommentsRepository } from '../../db/repositories';
import type { DiffCommentRow } from '../../db/schema';

import { githubService } from './github.service';

export interface CommentSyncResult {
  created: number;
  errors: Array<string>;
  updated: number;
}

class GitHubCommentSyncService {
  private diffCommentsRepository: DiffCommentsRepository | null = null;

  /**
   * Push a local diff comment to GitHub as a PR review comment.
   */
  async pushToGitHub(
    repoPath: string,
    prNumber: number,
    localCommentId: number
  ): Promise<DiffCommentRow> {
    const repo = this.getRepository();

    const localComment = repo.findById(localCommentId);
    if (!localComment) {
      throw new Error(`Local comment ${localCommentId} not found`);
    }

    if (localComment.githubCommentId) {
      throw new Error(`Comment ${localCommentId} is already synced to GitHub`);
    }

    const ghComment = await githubService.createPrComment(repoPath, prNumber, {
      body: localComment.content,
      line: localComment.lineNumber,
      path: localComment.filePath,
      side: localComment.lineType === 'old' ? 'LEFT' : 'RIGHT',
    });

    // Update local comment with GitHub metadata
    const updated = repo.upsertFromGitHub({
      ...localComment,
      githubAuthor: ghComment.author,
      githubCommentId: ghComment.id,
      githubPrNumber: prNumber,
    });

    return updated;
  }

  /**
   * Inject the diff comments repository.
   */
  setDiffCommentsRepository(repo: DiffCommentsRepository): void {
    this.diffCommentsRepository = repo;
  }

  /**
   * Fetch GitHub PR comments and upsert them locally.
   */
  async syncFromGitHub(
    repoPath: string,
    prNumber: number,
    workflowId: number
  ): Promise<CommentSyncResult> {
    const repo = this.getRepository();
    const result: CommentSyncResult = { created: 0, errors: [], updated: 0 };

    try {
      const ghComments = await githubService.listPrComments(repoPath, prNumber);

      for (const ghComment of ghComments) {
        try {
          const existing = repo.findByGitHubCommentId(ghComment.id);

          repo.upsertFromGitHub({
            content: ghComment.body,
            filePath: ghComment.path,
            githubAuthor: ghComment.author,
            githubCommentId: ghComment.id,
            githubPrNumber: prNumber,
            lineNumber: ghComment.line ?? 1,
            lineType: ghComment.side === 'LEFT' ? 'old' : 'new',
            workflowId,
          });

          if (existing) {
            result.updated++;
          } else {
            result.created++;
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          result.errors.push(`Comment ${ghComment.id}: ${msg}`);
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      result.errors.push(`Sync failed: ${msg}`);
    }

    return result;
  }

  /**
   * Get the diff comments repository, throwing if not initialized.
   */
  private getRepository(): DiffCommentsRepository {
    if (!this.diffCommentsRepository) {
      throw new Error('GitHubCommentSyncService: DiffCommentsRepository not initialized');
    }
    return this.diffCommentsRepository;
  }
}

export const githubCommentSyncService = new GitHubCommentSyncService();

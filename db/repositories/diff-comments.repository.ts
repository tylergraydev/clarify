import { and, desc, eq, isNull, sql } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';

import { type DiffCommentRow, diffComments, type NewDiffCommentRow } from '../schema';

export interface DiffCommentsRepository {
  create(data: NewDiffCommentRow): DiffCommentRow;
  delete(id: number): boolean;
  findByGitHubCommentId(githubCommentId: number): DiffCommentRow | undefined;
  findById(id: number): DiffCommentRow | undefined;
  findByWorkflow(workflowId: number): Array<DiffCommentRow>;
  findByWorkflowAndFile(workflowId: number, filePath: string): Array<DiffCommentRow>;
  findThreadReplies(parentId: number): Array<DiffCommentRow>;
  findUnsyncedForPr(workflowId: number, prNumber: number): Array<DiffCommentRow>;
  toggleResolved(id: number): DiffCommentRow | undefined;
  update(id: number, data: Partial<Pick<NewDiffCommentRow, 'content'>>): DiffCommentRow | undefined;
  upsertFromGitHub(data: NewDiffCommentRow & { githubCommentId: number }): DiffCommentRow;
}

export function createDiffCommentsRepository(db: DrizzleDatabase): DiffCommentsRepository {
  return {
    create(data: NewDiffCommentRow): DiffCommentRow {
      const result = db.insert(diffComments).values(data).returning().get();
      if (!result) {
        throw new Error('Failed to create diff comment');
      }
      return result;
    },

    delete(id: number): boolean {
      const result = db.delete(diffComments).where(eq(diffComments.id, id)).run();
      return result.changes > 0;
    },

    findByGitHubCommentId(githubCommentId: number): DiffCommentRow | undefined {
      return db
        .select()
        .from(diffComments)
        .where(eq(diffComments.githubCommentId, githubCommentId))
        .get();
    },

    findById(id: number): DiffCommentRow | undefined {
      return db.select().from(diffComments).where(eq(diffComments.id, id)).get();
    },

    findByWorkflow(workflowId: number): Array<DiffCommentRow> {
      return db
        .select()
        .from(diffComments)
        .where(and(eq(diffComments.workflowId, workflowId), isNull(diffComments.parentId)))
        .orderBy(desc(diffComments.createdAt))
        .all();
    },

    findByWorkflowAndFile(workflowId: number, filePath: string): Array<DiffCommentRow> {
      return db
        .select()
        .from(diffComments)
        .where(and(eq(diffComments.workflowId, workflowId), eq(diffComments.filePath, filePath)))
        .orderBy(diffComments.lineNumber, diffComments.createdAt)
        .all();
    },

    findThreadReplies(parentId: number): Array<DiffCommentRow> {
      return db
        .select()
        .from(diffComments)
        .where(eq(diffComments.parentId, parentId))
        .orderBy(diffComments.createdAt)
        .all();
    },

    findUnsyncedForPr(workflowId: number, prNumber: number): Array<DiffCommentRow> {
      return db
        .select()
        .from(diffComments)
        .where(
          and(
            eq(diffComments.workflowId, workflowId),
            eq(diffComments.githubPrNumber, prNumber),
            isNull(diffComments.githubCommentId)
          )
        )
        .orderBy(diffComments.createdAt)
        .all();
    },

    toggleResolved(id: number): DiffCommentRow | undefined {
      const existing = db.select().from(diffComments).where(eq(diffComments.id, id)).get();
      if (!existing) return undefined;
      return db
        .update(diffComments)
        .set({
          isResolved: !existing.isResolved,
          updatedAt: sql`(CURRENT_TIMESTAMP)`,
        })
        .where(eq(diffComments.id, id))
        .returning()
        .get();
    },

    update(id: number, data: Partial<Pick<NewDiffCommentRow, 'content'>>): DiffCommentRow | undefined {
      return db
        .update(diffComments)
        .set({ ...data, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(diffComments.id, id))
        .returning()
        .get();
    },

    upsertFromGitHub(data: NewDiffCommentRow & { githubCommentId: number }): DiffCommentRow {
      const existing = db
        .select()
        .from(diffComments)
        .where(eq(diffComments.githubCommentId, data.githubCommentId))
        .get();

      if (existing) {
        const result = db
          .update(diffComments)
          .set({
            content: data.content,
            githubSyncedAt: sql`(CURRENT_TIMESTAMP)`,
            updatedAt: sql`(CURRENT_TIMESTAMP)`,
          })
          .where(eq(diffComments.id, existing.id))
          .returning()
          .get();
        if (!result) {
          throw new Error('Failed to update diff comment from GitHub');
        }
        return result;
      }

      const result = db
        .insert(diffComments)
        .values({
          ...data,
          githubSyncedAt: sql`(CURRENT_TIMESTAMP)`,
        })
        .returning()
        .get();
      if (!result) {
        throw new Error('Failed to create diff comment from GitHub');
      }
      return result;
    },
  };
}

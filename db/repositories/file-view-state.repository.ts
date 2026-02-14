import { and, eq, sql } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';

import { fileViewState, type FileViewStateRow } from '../schema';

export interface FileViewStateRepository {
  findByWorkflow(workflowId: number): Array<FileViewStateRow>;
  getStats(workflowId: number, totalFiles: number): { totalFiles: number; viewedFiles: number };
  markUnviewed(workflowId: number, filePath: string): boolean;
  markViewed(workflowId: number, filePath: string): FileViewStateRow;
}

export function createFileViewStateRepository(db: DrizzleDatabase): FileViewStateRepository {
  return {
    findByWorkflow(workflowId: number): Array<FileViewStateRow> {
      return db
        .select()
        .from(fileViewState)
        .where(eq(fileViewState.workflowId, workflowId))
        .all();
    },

    getStats(workflowId: number, totalFiles: number): { totalFiles: number; viewedFiles: number } {
      const result = db
        .select({ count: sql<number>`count(*)` })
        .from(fileViewState)
        .where(eq(fileViewState.workflowId, workflowId))
        .get();
      return {
        totalFiles,
        viewedFiles: result?.count ?? 0,
      };
    },

    markUnviewed(workflowId: number, filePath: string): boolean {
      const result = db
        .delete(fileViewState)
        .where(and(eq(fileViewState.workflowId, workflowId), eq(fileViewState.filePath, filePath)))
        .run();
      return result.changes > 0;
    },

    markViewed(workflowId: number, filePath: string): FileViewStateRow {
      const existing = db
        .select()
        .from(fileViewState)
        .where(and(eq(fileViewState.workflowId, workflowId), eq(fileViewState.filePath, filePath)))
        .get();

      if (existing) {
        return existing;
      }

      const result = db
        .insert(fileViewState)
        .values({ filePath, workflowId })
        .returning()
        .get();

      if (!result) {
        throw new Error('Failed to mark file as viewed');
      }
      return result;
    },
  };
}

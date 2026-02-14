import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { workflows } from './workflows.schema';

export const diffComments = sqliteTable(
  'diff_comments',
  {
    content: text('content').notNull(),
    createdAt: text('created_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    endLine: integer('end_line'),
    filePath: text('file_path').notNull(),
    githubAuthor: text('github_author'),
    githubCommentId: integer('github_comment_id'),
    githubPrNumber: integer('github_pr_number'),
    githubSyncedAt: text('github_synced_at'),
    id: integer('id').primaryKey({ autoIncrement: true }),
    isResolved: integer('is_resolved', { mode: 'boolean' }).default(false).notNull(),
    lineNumber: integer('line_number').notNull(),
    lineType: text('line_type', { enum: ['old', 'new'] }).notNull().default('new'),
    parentId: integer('parent_id'),
    updatedAt: text('updated_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    workflowId: integer('workflow_id')
      .notNull()
      .references(() => workflows.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('diff_comments_workflow_id_idx').on(table.workflowId),
    index('diff_comments_file_path_idx').on(table.workflowId, table.filePath),
    index('diff_comments_parent_id_idx').on(table.parentId),
    index('diff_comments_github_comment_id_idx').on(table.githubCommentId),
  ]
);

export type DiffCommentRow = typeof diffComments.$inferSelect;
export type NewDiffCommentRow = typeof diffComments.$inferInsert;

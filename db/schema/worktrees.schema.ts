import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { repositories } from './repositories.schema';

export const worktreeStatuses = ['active', 'cleaning', 'removed'] as const;

export const worktrees = sqliteTable(
  'worktrees',
  {
    branchName: text('branch_name').notNull(),
    createdAt: text('created_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    id: integer('id').primaryKey({ autoIncrement: true }),
    path: text('path').notNull().unique(),
    repositoryId: integer('repository_id')
      .notNull()
      .references(() => repositories.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('active'),
    updatedAt: text('updated_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    workflowId: integer('workflow_id').unique(), // No foreign key due to circular dependency with workflows
  },
  (table) => [
    index('worktrees_repository_id_idx').on(table.repositoryId),
    index('worktrees_status_idx').on(table.status),
  ]
);

export type NewWorktree = typeof worktrees.$inferInsert;
export type Worktree = typeof worktrees.$inferSelect;

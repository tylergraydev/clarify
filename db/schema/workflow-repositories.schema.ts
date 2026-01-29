import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { repositories } from './repositories.schema';
import { workflows } from './workflows.schema';

export const workflowRepositories = sqliteTable(
  'workflow_repositories',
  {
    createdAt: text('created_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    id: integer('id').primaryKey({ autoIncrement: true }),
    repositoryId: integer('repository_id')
      .notNull()
      .references(() => repositories.id, { onDelete: 'cascade' }),
    setPrimaryAt: text('set_primary_at'), // null = secondary, datetime = primary repository
    workflowId: integer('workflow_id')
      .notNull()
      .references(() => workflows.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('workflow_repositories_repository_id_idx').on(table.repositoryId),
    index('workflow_repositories_workflow_id_idx').on(table.workflowId),
    uniqueIndex('workflow_repositories_unique_idx').on(table.workflowId, table.repositoryId),
  ]
);

export type NewWorkflowRepository = typeof workflowRepositories.$inferInsert;
export type WorkflowRepository = typeof workflowRepositories.$inferSelect;

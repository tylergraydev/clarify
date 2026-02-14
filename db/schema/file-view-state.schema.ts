import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

import { workflows } from './workflows.schema';

export const fileViewState = sqliteTable(
  'file_view_state',
  {
    filePath: text('file_path').notNull(),
    id: integer('id').primaryKey({ autoIncrement: true }),
    viewedAt: text('viewed_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    workflowId: integer('workflow_id')
      .notNull()
      .references(() => workflows.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('file_view_state_workflow_id_idx').on(table.workflowId),
    unique('file_view_state_unique').on(table.workflowId, table.filePath),
  ]
);

export type FileViewStateRow = typeof fileViewState.$inferSelect;
export type NewFileViewStateRow = typeof fileViewState.$inferInsert;

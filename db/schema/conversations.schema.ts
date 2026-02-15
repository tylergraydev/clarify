import { sql } from 'drizzle-orm';
import { type AnySQLiteColumn, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { projects } from './projects.schema';

export const conversations = sqliteTable(
  'conversations',
  {
    compactedAt: text('compacted_at'),
    createdAt: text('created_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    forkPointMessageId: integer('fork_point_message_id'),
    forkSummary: text('fork_summary'),
    id: integer('id').primaryKey({ autoIncrement: true }),
    isCompacted: integer('is_compacted', { mode: 'boolean' }).default(false).notNull(),
    model: text('model'),
    parentConversationId: integer('parent_conversation_id').references((): AnySQLiteColumn => conversations.id, {
      onDelete: 'set null',
    }),
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    provider: text('provider').default('claude'),
    title: text('title').notNull().default('New Conversation'),
    titleGeneratedByAi: integer('title_generated_by_ai', { mode: 'boolean' }).default(false).notNull(),
    updatedAt: text('updated_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index('conversations_project_id_idx').on(table.projectId),
    index('conversations_parent_id_idx').on(table.parentConversationId),
  ]
);

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;

import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { conversations } from './conversations.schema';

export const conversationMessages = sqliteTable(
  'conversation_messages',
  {
    content: text('content').notNull(),
    conversationId: integer('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    createdAt: text('created_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    deletedAt: text('deleted_at'),
    id: integer('id').primaryKey({ autoIncrement: true }),
    isCompactionSummary: integer('is_compaction_summary', { mode: 'boolean' }).default(false).notNull(),
    isDeleted: integer('is_deleted', { mode: 'boolean' }).default(false).notNull(),
    metadata: text('metadata'),
    originalMessageCount: integer('original_message_count'),
    role: text('role', { enum: ['user', 'assistant'] }).notNull(),
    tokenEstimate: integer('token_estimate'),
  },
  (table) => [index('conversation_messages_conversation_id_idx').on(table.conversationId)]
);

export type ConversationMessage = typeof conversationMessages.$inferSelect;
export type NewConversationMessage = typeof conversationMessages.$inferInsert;

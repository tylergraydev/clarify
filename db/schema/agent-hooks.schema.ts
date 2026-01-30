import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { agents } from './agents.schema';

export const agentHookEventTypes = ['PreToolUse', 'PostToolUse', 'Stop'] as const;

export const agentHooks = sqliteTable(
  'agent_hooks',
  {
    agentId: integer('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    createdAt: text('created_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    eventType: text('event_type').notNull(),
    id: integer('id').primaryKey({ autoIncrement: true }),
    matcher: text('matcher'),
    orderIndex: integer('order_index').notNull().default(0),
    updatedAt: text('updated_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index('agent_hooks_agent_id_idx').on(table.agentId),
    index('agent_hooks_event_type_idx').on(table.eventType),
  ]
);

export type AgentHook = typeof agentHooks.$inferSelect;
export type NewAgentHook = typeof agentHooks.$inferInsert;

import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';

import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { projects } from './projects.schema';

export const agentTypes = ['planning', 'specialist', 'review'] as const;
export const agentColors = ['green', 'blue', 'yellow', 'cyan', 'red'] as const;
export const agentModels = ['sonnet', 'opus', 'haiku', 'inherit', 'gpt-4o', 'gpt-4o-mini', 'o3', 'o4-mini'] as const;
export const agentPermissionModes = ['default', 'acceptEdits', 'dontAsk', 'bypassPermissions', 'plan'] as const;
export const agentProviders = ['claude', 'openai', 'bedrock', 'vertex', 'custom'] as const;

export const agents = sqliteTable(
  'agents',
  {
    builtInAt: text('built_in_at'),
    color: text('color'),
    createdAt: text('created_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    deactivatedAt: text('deactivated_at'),
    description: text('description'),
    displayName: text('display_name').notNull(),
    extendedThinkingEnabled: integer('extended_thinking_enabled', { mode: 'boolean' }).notNull().default(false),
    id: integer('id').primaryKey({ autoIncrement: true }),
    maxThinkingTokens: integer('max_thinking_tokens'),
    model: text('model'),
    name: text('name').notNull().unique(),
    parentAgentId: integer('parent_agent_id').references((): AnySQLiteColumn => agents.id, {
      onDelete: 'set null',
    }),
    permissionMode: text('permission_mode'),
    projectId: integer('project_id').references(() => projects.id, {
      onDelete: 'cascade',
    }),
    provider: text('provider').default('claude'),
    systemPrompt: text('system_prompt').notNull(),
    type: text('type').notNull(),
    updatedAt: text('updated_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    version: integer('version').notNull().default(1),
  },
  (table) => [
    index('agents_parent_agent_id_idx').on(table.parentAgentId),
    index('agents_project_id_idx').on(table.projectId),
    index('agents_type_idx').on(table.type),
  ]
);

export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;

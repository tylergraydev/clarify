import { sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { workflowSteps } from './workflow-steps.schema';

export const agentActivityEventTypes = [
  'tool_start',
  'tool_stop',
  'tool_update',
  'text_delta',
  'thinking_start',
  'thinking_delta',
  'phase_change',
  'usage',
] as const;

export const agentActivity = sqliteTable(
  'agent_activity',
  {
    cacheCreationInputTokens: integer('cache_creation_input_tokens'),
    cacheReadInputTokens: integer('cache_read_input_tokens'),
    createdAt: text('created_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    durationMs: integer('duration_ms'),
    estimatedCost: real('estimated_cost'),
    eventType: text('event_type').notNull(),
    id: integer('id').primaryKey({ autoIncrement: true }),
    inputTokens: integer('input_tokens'),
    outputTokens: integer('output_tokens'),
    phase: text('phase'),
    startedAt: integer('started_at'),
    stoppedAt: integer('stopped_at'),
    textDelta: text('text_delta'),
    thinkingBlockIndex: integer('thinking_block_index'),
    toolInput: text('tool_input', { mode: 'json' }),
    toolName: text('tool_name'),
    toolUseId: text('tool_use_id'),
    updatedAt: text('updated_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    workflowStepId: integer('workflow_step_id')
      .notNull()
      .references(() => workflowSteps.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('agent_activity_event_type_idx').on(table.eventType),
    index('agent_activity_workflow_step_id_event_type_idx').on(table.workflowStepId, table.eventType),
    index('agent_activity_workflow_step_id_idx').on(table.workflowStepId),
  ]
);

export type AgentActivity = typeof agentActivity.$inferSelect;
export type NewAgentActivity = typeof agentActivity.$inferInsert;

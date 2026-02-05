import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { agents } from './agents.schema';
import { workflows } from './workflows.schema';

export const stepStatuses = ['pending', 'running', 'paused', 'editing', 'completed', 'failed', 'skipped'] as const;
export const stepTypes = [
  'clarification',
  'refinement',
  'discovery',
  'planning',
  'routing',
  'implementation',
  'quality_gate',
  'gemini_review',
] as const;

export const workflowSteps = sqliteTable(
  'workflow_steps',
  {
    agentId: integer('agent_id').references(() => agents.id, {
      onDelete: 'set null',
    }),
    completedAt: text('completed_at'),
    createdAt: text('created_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    description: text('description'),
    durationMs: integer('duration_ms'),
    errorMessage: text('error_message'),
    id: integer('id').primaryKey({ autoIncrement: true }),
    inputText: text('input_text'),
    outputEditedAt: text('output_edited_at'),
    outputStructured: text('output_structured', { mode: 'json' }),
    outputText: text('output_text'),
    retryCount: integer('retry_count').notNull().default(0),
    startedAt: text('started_at'),
    status: text('status').notNull().default('pending'),
    stepNumber: integer('step_number').notNull(),
    stepType: text('step_type').notNull(),
    title: text('title').notNull(),
    updatedAt: text('updated_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    workflowId: integer('workflow_id')
      .notNull()
      .references(() => workflows.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('workflow_steps_agent_id_idx').on(table.agentId),
    index('workflow_steps_status_idx').on(table.status),
    index('workflow_steps_workflow_id_idx').on(table.workflowId),
    index('workflow_steps_workflow_id_step_number_idx').on(table.workflowId, table.stepNumber),
  ]
);

export type NewWorkflowStep = typeof workflowSteps.$inferInsert;
export type WorkflowStep = typeof workflowSteps.$inferSelect;

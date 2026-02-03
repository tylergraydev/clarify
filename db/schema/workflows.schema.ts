import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';

import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { agents } from './agents.schema';
import { projects } from './projects.schema';

export const pauseBehaviors = ['continuous', 'auto_pause', 'gates_only'] as const;
export const workflowStatuses = [
  'created',
  'running',
  'paused',
  'editing',
  'completed',
  'failed',
  'cancelled',
] as const;
export const workflowTypes = ['planning', 'implementation'] as const;

export const workflows = sqliteTable(
  'workflows',
  {
    clarificationAgentId: integer('clarification_agent_id').references(() => agents.id, {
      onDelete: 'set null',
    }),
    completedAt: text('completed_at'),
    createdAt: text('created_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    currentStepNumber: integer('current_step_number').default(0),
    durationMs: integer('duration_ms'),
    errorMessage: text('error_message'),
    featureName: text('feature_name').notNull(),
    featureRequest: text('feature_request').notNull(),
    id: integer('id').primaryKey({ autoIncrement: true }),
    parentWorkflowId: integer('parent_workflow_id').references((): AnySQLiteColumn => workflows.id, {
      onDelete: 'set null',
    }),
    pauseBehavior: text('pause_behavior').notNull().default('auto_pause'),
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    skipClarification: integer('skip_clarification', { mode: 'boolean' }).notNull().default(false),
    startedAt: text('started_at'),
    status: text('status').notNull().default('created'),
    totalSteps: integer('total_steps'),
    type: text('type').notNull(),
    updatedAt: text('updated_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    worktreeId: integer('worktree_id'), // Will reference worktrees.id but can't use FK due to circular dependency
  },
  (table) => [
    index('workflows_parent_workflow_id_idx').on(table.parentWorkflowId),
    index('workflows_project_id_idx').on(table.projectId),
    index('workflows_status_idx').on(table.status),
    index('workflows_status_type_created_idx').on(table.status, table.type, table.createdAt),
    index('workflows_type_idx').on(table.type),
    index('workflows_worktree_id_idx').on(table.worktreeId),
  ]
);

export type NewWorkflow = typeof workflows.$inferInsert;
export type Workflow = typeof workflows.$inferSelect;

import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { workflowSteps } from './workflow-steps.schema';
import { workflows } from './workflows.schema';

export const eventCategories = ['workflow', 'step', 'file', 'worktree', 'quality', 'user_action'] as const;
export const eventSources = ['system', 'user', 'cli'] as const;
export const severities = ['debug', 'info', 'warning', 'error'] as const;

export const auditLogs = sqliteTable(
  'audit_logs',
  {
    afterState: text('after_state', { mode: 'json' }),
    beforeState: text('before_state', { mode: 'json' }),
    eventCategory: text('event_category').notNull(),
    eventData: text('event_data', { mode: 'json' }),
    eventType: text('event_type').notNull(),
    id: integer('id').primaryKey({ autoIncrement: true }),
    message: text('message').notNull(),
    severity: text('severity').notNull().default('info'),
    source: text('source').notNull().default('system'),
    timestamp: text('timestamp')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    workflowId: integer('workflow_id').references(() => workflows.id, { onDelete: 'cascade' }),
    workflowStepId: integer('workflow_step_id').references(() => workflowSteps.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('audit_logs_event_category_idx').on(table.eventCategory),
    index('audit_logs_event_type_idx').on(table.eventType),
    index('audit_logs_timestamp_idx').on(table.timestamp),
    index('audit_logs_workflow_id_idx').on(table.workflowId),
    index('audit_logs_workflow_step_id_idx').on(table.workflowStepId),
    index('audit_logs_workflow_timestamp_idx').on(table.workflowId, table.timestamp),
  ]
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

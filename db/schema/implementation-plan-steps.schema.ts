import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { agents } from './agents.schema';
import { implementationPlans } from './implementation-plans.schema';

export const implementationPlanSteps = sqliteTable(
  'implementation_plan_steps',
  {
    agentId: integer('agent_id').references(() => agents.id, { onDelete: 'set null' }),
    agentOverrideId: integer('agent_override_id').references(() => agents.id, {
      onDelete: 'set null',
    }),
    createdAt: text('created_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    description: text('description'),
    estimatedDurationMs: integer('estimated_duration_ms'),
    geminiReviewAt: text('gemini_review_at'),
    id: integer('id').primaryKey({ autoIncrement: true }),
    orderIndex: integer('order_index').notNull().default(0),
    planId: integer('plan_id')
      .notNull()
      .references(() => implementationPlans.id, { onDelete: 'cascade' }),
    qualityGateAt: text('quality_gate_at'),
    stepNumber: integer('step_number').notNull(),
    title: text('title').notNull(),
    updatedAt: text('updated_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index('implementation_plan_steps_agent_id_idx').on(table.agentId),
    index('implementation_plan_steps_plan_id_idx').on(table.planId),
    uniqueIndex('implementation_plan_steps_unique_idx').on(table.planId, table.stepNumber),
  ]
);

export type ImplementationPlanStep = typeof implementationPlanSteps.$inferSelect;
export type NewImplementationPlanStep = typeof implementationPlanSteps.$inferInsert;

import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { implementationPlanSteps } from './implementation-plan-steps.schema';

export const implementationPlanStepFiles = sqliteTable(
  'implementation_plan_step_files',
  {
    action: text('action').notNull().default('modify'),
    createdAt: text('created_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    description: text('description'),
    filePath: text('file_path').notNull(),
    id: integer('id').primaryKey({ autoIncrement: true }),
    orderIndex: integer('order_index').notNull().default(0),
    planStepId: integer('plan_step_id')
      .notNull()
      .references(() => implementationPlanSteps.id, { onDelete: 'cascade' }),
    updatedAt: text('updated_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [index('impl_plan_step_files_plan_step_id_idx').on(table.planStepId)]
);

export type ImplementationPlanStepFile = typeof implementationPlanStepFiles.$inferSelect;
export type NewImplementationPlanStepFile = typeof implementationPlanStepFiles.$inferInsert;

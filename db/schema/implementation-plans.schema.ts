import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { workflows } from "./workflows.schema";

export const implementationPlans = sqliteTable(
  "implementation_plans",
  {
    approvedAt: text("approved_at"),
    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    estimatedDurationMs: integer("estimated_duration_ms"),
    id: integer("id").primaryKey({ autoIncrement: true }),
    rawPlanText: text("raw_plan_text").notNull(),
    summary: text("summary"),
    title: text("title").notNull(),
    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    workflowId: integer("workflow_id")
      .notNull()
      .unique()
      .references(() => workflows.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("implementation_plans_workflow_id_idx").on(table.workflowId),
  ]
);

export type ImplementationPlan = typeof implementationPlans.$inferSelect;
export type NewImplementationPlan = typeof implementationPlans.$inferInsert;

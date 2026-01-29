import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { workflowSteps } from "./workflow-steps.schema";

export const fileActions = ["create", "modify", "delete"] as const;
export const filePriorities = ["high", "medium", "low"] as const;

export const discoveredFiles = sqliteTable(
  "discovered_files",
  {
    action: text("action").notNull().default("modify"),
    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    description: text("description"),
    fileExistsAt: text("file_exists_at"),
    filePath: text("file_path").notNull(),
    id: integer("id").primaryKey({ autoIncrement: true }),
    includedAt: text("included_at"),
    orderIndex: integer("order_index").notNull().default(0),
    originalPriority: text("original_priority"),
    priority: text("priority").notNull().default("medium"),
    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    userAddedAt: text("user_added_at"),
    userModifiedAt: text("user_modified_at"),
    workflowStepId: integer("workflow_step_id")
      .notNull()
      .references(() => workflowSteps.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("discovered_files_priority_idx").on(table.priority),
    index("discovered_files_workflow_step_id_idx").on(table.workflowStepId),
  ]
);

export type DiscoveredFile = typeof discoveredFiles.$inferSelect;
export type NewDiscoveredFile = typeof discoveredFiles.$inferInsert;

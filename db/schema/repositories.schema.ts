import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { projects } from "./projects.schema";

export const repositories = sqliteTable(
  "repositories",
  {
    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    defaultBranch: text("default_branch").notNull().default("main"),
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(), // Display name
    path: text("path").notNull(), // Absolute filesystem path
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    remoteUrl: text("remote_url"), // Git remote URL
    setAsDefaultAt: text("set_as_default_at"), // null = not default, datetime = when set as default
    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index("repositories_path_idx").on(table.path),
    index("repositories_project_id_idx").on(table.projectId),
  ]
);

export type NewRepository = typeof repositories.$inferInsert;
export type Repository = typeof repositories.$inferSelect;

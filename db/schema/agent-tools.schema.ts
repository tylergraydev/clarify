import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { agents } from "./agents.schema";

export const agentTools = sqliteTable(
  "agent_tools",
  {
    agentId: integer("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    disallowedAt: text("disallowed_at"),
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderIndex: integer("order_index").notNull().default(0),
    toolName: text("tool_name").notNull(),
    toolPattern: text("tool_pattern").notNull().default("*"),
    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index("agent_tools_agent_id_idx").on(table.agentId),
    uniqueIndex("agent_tools_unique_idx").on(
      table.agentId,
      table.toolName,
      table.toolPattern
    ),
  ]
);

export type AgentTool = typeof agentTools.$inferSelect;
export type NewAgentTool = typeof agentTools.$inferInsert;

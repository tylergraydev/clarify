import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { agents } from "./agents.schema";

export const agentSkills = sqliteTable(
  "agent_skills",
  {
    agentId: integer("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderIndex: integer("order_index").notNull().default(0),
    requiredAt: text("required_at"), // null = optional, datetime = required
    skillName: text("skill_name").notNull(),
    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index("agent_skills_agent_id_idx").on(table.agentId),
    uniqueIndex("agent_skills_unique_idx").on(table.agentId, table.skillName),
  ]
);

export type AgentSkill = typeof agentSkills.$inferSelect;
export type NewAgentSkill = typeof agentSkills.$inferInsert;

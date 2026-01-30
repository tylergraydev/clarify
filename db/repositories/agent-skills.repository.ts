import { and, asc, eq, isNotNull } from "drizzle-orm";

import type { DrizzleDatabase } from "../index";

import { type AgentSkill, agentSkills, type NewAgentSkill } from "../schema";

export interface AgentSkillsRepository {
  create(data: NewAgentSkill): Promise<AgentSkill>;
  delete(id: number): Promise<void>;
  deleteByAgentId(agentId: number): Promise<void>;
  findByAgentId(agentId: number): Promise<Array<AgentSkill>>;
  findById(id: number): Promise<AgentSkill | undefined>;
  findRequired(agentId: number): Promise<Array<AgentSkill>>;
  setRequired(id: number, required: boolean): Promise<AgentSkill | undefined>;
  update(
    id: number,
    data: Partial<Omit<NewAgentSkill, "createdAt" | "id">>
  ): Promise<AgentSkill | undefined>;
}

export function createAgentSkillsRepository(
  db: DrizzleDatabase
): AgentSkillsRepository {
  return {
    async create(data: NewAgentSkill): Promise<AgentSkill> {
      const result = await db.insert(agentSkills).values(data).returning();
      if (!result[0]) {
        throw new Error("Failed to create agent skill");
      }
      return result[0];
    },

    async delete(id: number): Promise<void> {
      await db.delete(agentSkills).where(eq(agentSkills.id, id));
    },

    async deleteByAgentId(agentId: number): Promise<void> {
      await db.delete(agentSkills).where(eq(agentSkills.agentId, agentId));
    },

    async findByAgentId(agentId: number): Promise<Array<AgentSkill>> {
      return db
        .select()
        .from(agentSkills)
        .where(eq(agentSkills.agentId, agentId))
        .orderBy(asc(agentSkills.orderIndex));
    },

    async findById(id: number): Promise<AgentSkill | undefined> {
      const result = await db
        .select()
        .from(agentSkills)
        .where(eq(agentSkills.id, id));
      return result[0];
    },

    async findRequired(agentId: number): Promise<Array<AgentSkill>> {
      return db
        .select()
        .from(agentSkills)
        .where(
          and(
            eq(agentSkills.agentId, agentId),
            isNotNull(agentSkills.requiredAt)
          )
        )
        .orderBy(asc(agentSkills.orderIndex));
    },

    async setRequired(
      id: number,
      required: boolean
    ): Promise<AgentSkill | undefined> {
      const now = new Date().toISOString();
      const result = await db
        .update(agentSkills)
        .set({
          requiredAt: required ? now : null,
          updatedAt: now,
        })
        .where(eq(agentSkills.id, id))
        .returning();
      return result[0];
    },

    async update(
      id: number,
      data: Partial<Omit<NewAgentSkill, "createdAt" | "id">>
    ): Promise<AgentSkill | undefined> {
      const now = new Date().toISOString();
      const result = await db
        .update(agentSkills)
        .set({ ...data, updatedAt: now })
        .where(eq(agentSkills.id, id))
        .returning();
      return result[0];
    },
  };
}

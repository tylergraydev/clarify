import { and, asc, eq, isNotNull } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';

import { createAgentSkillSchema, updateAgentSkillSchema } from '../../lib/validations/agent';
import { type AgentSkill, agentSkills, type NewAgentSkill } from '../schema';

export interface AgentSkillsRepository {
  create(data: NewAgentSkill): Promise<AgentSkill>;
  delete(id: number): Promise<boolean>;
  deleteByAgentId(agentId: number): Promise<boolean>;
  findByAgentId(agentId: number): Promise<Array<AgentSkill>>;
  findById(id: number): Promise<AgentSkill | undefined>;
  findRequired(agentId: number): Promise<Array<AgentSkill>>;
  setRequired(id: number, required: boolean): Promise<AgentSkill | undefined>;
  update(id: number, data: Partial<Omit<NewAgentSkill, 'createdAt' | 'id'>>): Promise<AgentSkill | undefined>;
}

export function createAgentSkillsRepository(db: DrizzleDatabase): AgentSkillsRepository {
  return {
    async create(data: NewAgentSkill): Promise<AgentSkill> {
      // Validate all fields
      createAgentSkillSchema.parse(data);

      const result = db.insert(agentSkills).values(data).returning().get();
      if (!result) {
        throw new Error('Failed to create agent skill');
      }
      return result;
    },

    async delete(id: number): Promise<boolean> {
      const result = db.delete(agentSkills).where(eq(agentSkills.id, id)).run();
      return result.changes > 0;
    },

    async deleteByAgentId(agentId: number): Promise<boolean> {
      const result = db.delete(agentSkills).where(eq(agentSkills.agentId, agentId)).run();
      return result.changes > 0;
    },

    async findByAgentId(agentId: number): Promise<Array<AgentSkill>> {
      return db.select().from(agentSkills).where(eq(agentSkills.agentId, agentId)).orderBy(asc(agentSkills.orderIndex));
    },

    async findById(id: number): Promise<AgentSkill | undefined> {
      return db.select().from(agentSkills).where(eq(agentSkills.id, id)).get();
    },

    async findRequired(agentId: number): Promise<Array<AgentSkill>> {
      return db
        .select()
        .from(agentSkills)
        .where(and(eq(agentSkills.agentId, agentId), isNotNull(agentSkills.requiredAt)))
        .orderBy(asc(agentSkills.orderIndex));
    },

    async setRequired(id: number, required: boolean): Promise<AgentSkill | undefined> {
      const now = new Date().toISOString();
      return db
        .update(agentSkills)
        .set({
          requiredAt: required ? now : null,
          updatedAt: now,
        })
        .where(eq(agentSkills.id, id))
        .returning()
        .get();
    },

    async update(id: number, data: Partial<Omit<NewAgentSkill, 'createdAt' | 'id'>>): Promise<AgentSkill | undefined> {
      // Validate all provided fields
      updateAgentSkillSchema.parse(data);

      const now = new Date().toISOString();
      return db
        .update(agentSkills)
        .set({ ...data, updatedAt: now })
        .where(eq(agentSkills.id, id))
        .returning()
        .get();
    },
  };
}

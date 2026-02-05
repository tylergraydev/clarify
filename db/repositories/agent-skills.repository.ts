import { and, asc, eq, isNotNull, sql } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';

import { createAgentSkillSchema, updateAgentSkillSchema } from '../../lib/validations/agent';
import { type AgentSkill, agentSkills, type NewAgentSkill } from '../schema';
import { createBaseRepository } from './base.repository';

export interface AgentSkillsRepository {
  create(data: NewAgentSkill): AgentSkill;
  delete(id: number): boolean;
  deleteByAgentId(agentId: number): boolean;
  findByAgentId(agentId: number): Array<AgentSkill>;
  findById(id: number): AgentSkill | undefined;
  findRequired(agentId: number): Array<AgentSkill>;
  setRequired(id: number, required: boolean): AgentSkill | undefined;
  update(id: number, data: Partial<Omit<NewAgentSkill, 'createdAt' | 'id'>>): AgentSkill | undefined;
}

export function createAgentSkillsRepository(db: DrizzleDatabase): AgentSkillsRepository {
  const base = createBaseRepository<typeof agentSkills, AgentSkill, NewAgentSkill>(db, agentSkills);

  return {
    create(data: NewAgentSkill): AgentSkill {
      const validated = createAgentSkillSchema.parse(data);
      const result = db.insert(agentSkills).values(validated).returning().get();
      if (!result) {
        throw new Error('Failed to create agent skill');
      }
      return result;
    },

    delete: base.delete,

    deleteByAgentId(agentId: number): boolean {
      const result = db.delete(agentSkills).where(eq(agentSkills.agentId, agentId)).run();
      return result.changes > 0;
    },

    findByAgentId(agentId: number): Array<AgentSkill> {
      return db.select().from(agentSkills).where(eq(agentSkills.agentId, agentId)).orderBy(asc(agentSkills.orderIndex)).all();
    },

    findById: base.findById,

    findRequired(agentId: number): Array<AgentSkill> {
      return db
        .select()
        .from(agentSkills)
        .where(and(eq(agentSkills.agentId, agentId), isNotNull(agentSkills.requiredAt)))
        .orderBy(asc(agentSkills.orderIndex))
        .all();
    },

    setRequired(id: number, required: boolean): AgentSkill | undefined {
      return db
        .update(agentSkills)
        .set({
          requiredAt: required ? sql`(CURRENT_TIMESTAMP)` : null,
          updatedAt: sql`(CURRENT_TIMESTAMP)`,
        })
        .where(eq(agentSkills.id, id))
        .returning()
        .get();
    },

    update(id: number, data: Partial<Omit<NewAgentSkill, 'createdAt' | 'id'>>): AgentSkill | undefined {
      const validated = updateAgentSkillSchema.parse(data);
      return db
        .update(agentSkills)
        .set({ ...validated, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(agentSkills.id, id))
        .returning()
        .get();
    },
  };
}

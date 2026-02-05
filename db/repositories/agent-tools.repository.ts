import { and, asc, eq, isNull, sql } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';

import { createAgentToolSchema, updateAgentToolSchema } from '../../lib/validations/agent';
import { type AgentTool, agentTools, type NewAgentTool } from '../schema';
import { createBaseRepository } from './base.repository';

export interface AgentToolsRepository {
  allow(id: number): AgentTool | undefined;
  create(data: NewAgentTool): AgentTool;
  delete(id: number): boolean;
  deleteByAgentId(agentId: number): boolean;
  disallow(id: number): AgentTool | undefined;
  findAllowed(agentId: number): Array<AgentTool>;
  findByAgentId(agentId: number): Array<AgentTool>;
  findById(id: number): AgentTool | undefined;
  update(id: number, data: Partial<Omit<NewAgentTool, 'createdAt' | 'id'>>): AgentTool | undefined;
}

export function createAgentToolsRepository(db: DrizzleDatabase): AgentToolsRepository {
  const base = createBaseRepository<typeof agentTools, AgentTool, NewAgentTool>(db, agentTools);

  return {
    allow(id: number): AgentTool | undefined {
      return db
        .update(agentTools)
        .set({ disallowedAt: null, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(agentTools.id, id))
        .returning()
        .get();
    },

    create(data: NewAgentTool): AgentTool {
      const validated = createAgentToolSchema.parse(data);
      const result = db.insert(agentTools).values(validated).returning().get();
      if (!result) {
        throw new Error('Failed to create agent tool');
      }
      return result;
    },

    delete: base.delete,

    deleteByAgentId(agentId: number): boolean {
      const result = db.delete(agentTools).where(eq(agentTools.agentId, agentId)).run();
      return result.changes > 0;
    },

    disallow(id: number): AgentTool | undefined {
      return db
        .update(agentTools)
        .set({ disallowedAt: sql`(CURRENT_TIMESTAMP)`, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(agentTools.id, id))
        .returning()
        .get();
    },

    findAllowed(agentId: number): Array<AgentTool> {
      return db
        .select()
        .from(agentTools)
        .where(and(eq(agentTools.agentId, agentId), isNull(agentTools.disallowedAt)))
        .orderBy(asc(agentTools.orderIndex))
        .all();
    },

    findByAgentId(agentId: number): Array<AgentTool> {
      return db
        .select()
        .from(agentTools)
        .where(eq(agentTools.agentId, agentId))
        .orderBy(asc(agentTools.orderIndex))
        .all();
    },

    findById: base.findById,

    update(id: number, data: Partial<Omit<NewAgentTool, 'createdAt' | 'id'>>): AgentTool | undefined {
      const validated = updateAgentToolSchema.parse(data);
      return db
        .update(agentTools)
        .set({ ...validated, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(agentTools.id, id))
        .returning()
        .get();
    },
  };
}

import { and, asc, eq, isNull } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';

import { createAgentToolSchema, updateAgentToolSchema } from '../../lib/validations/agent';
import { type AgentTool, agentTools, type NewAgentTool } from '../schema';

export interface AgentToolsRepository {
  allow(id: number): Promise<AgentTool | undefined>;
  create(data: NewAgentTool): Promise<AgentTool>;
  delete(id: number): Promise<boolean>;
  deleteByAgentId(agentId: number): Promise<boolean>;
  disallow(id: number): Promise<AgentTool | undefined>;
  findAllowed(agentId: number): Promise<Array<AgentTool>>;
  findByAgentId(agentId: number): Promise<Array<AgentTool>>;
  findById(id: number): Promise<AgentTool | undefined>;
  update(id: number, data: Partial<Omit<NewAgentTool, 'createdAt' | 'id'>>): Promise<AgentTool | undefined>;
}

export function createAgentToolsRepository(db: DrizzleDatabase): AgentToolsRepository {
  return {
    async allow(id: number): Promise<AgentTool | undefined> {
      const now = new Date().toISOString();
      return db
        .update(agentTools)
        .set({ disallowedAt: null, updatedAt: now })
        .where(eq(agentTools.id, id))
        .returning()
        .get();
    },

    async create(data: NewAgentTool): Promise<AgentTool> {
      // Validate all fields
      const validated = createAgentToolSchema.parse(data);

      const result = db.insert(agentTools).values(validated).returning().get();
      if (!result) {
        throw new Error('Failed to create agent tool');
      }
      return result;
    },

    async delete(id: number): Promise<boolean> {
      const result = db.delete(agentTools).where(eq(agentTools.id, id)).run();
      return result.changes > 0;
    },

    async deleteByAgentId(agentId: number): Promise<boolean> {
      const result = db.delete(agentTools).where(eq(agentTools.agentId, agentId)).run();
      return result.changes > 0;
    },

    async disallow(id: number): Promise<AgentTool | undefined> {
      const now = new Date().toISOString();
      return db
        .update(agentTools)
        .set({ disallowedAt: now, updatedAt: now })
        .where(eq(agentTools.id, id))
        .returning()
        .get();
    },

    async findAllowed(agentId: number): Promise<Array<AgentTool>> {
      return db
        .select()
        .from(agentTools)
        .where(and(eq(agentTools.agentId, agentId), isNull(agentTools.disallowedAt)))
        .orderBy(asc(agentTools.orderIndex));
    },

    async findByAgentId(agentId: number): Promise<Array<AgentTool>> {
      return db.select().from(agentTools).where(eq(agentTools.agentId, agentId)).orderBy(asc(agentTools.orderIndex));
    },

    async findById(id: number): Promise<AgentTool | undefined> {
      return db.select().from(agentTools).where(eq(agentTools.id, id)).get();
    },

    async update(id: number, data: Partial<Omit<NewAgentTool, 'createdAt' | 'id'>>): Promise<AgentTool | undefined> {
      // Validate all provided fields
      const validated = updateAgentToolSchema.parse(data);

      const now = new Date().toISOString();
      return db
        .update(agentTools)
        .set({ ...validated, updatedAt: now })
        .where(eq(agentTools.id, id))
        .returning()
        .get();
    },
  };
}

import { and, asc, eq, isNull } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';

import { agentToolInputSchema } from '../../lib/validations/agent';
import { type AgentTool, agentTools, type NewAgentTool } from '../schema';

export interface AgentToolsRepository {
  allow(id: number): Promise<AgentTool | undefined>;
  create(data: NewAgentTool): Promise<AgentTool>;
  delete(id: number): Promise<void>;
  deleteByAgentId(agentId: number): Promise<void>;
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
      // Validate tool name and pattern
      agentToolInputSchema.parse({
        name: data.toolName,
        pattern: data.toolPattern,
      });

      const result = db.insert(agentTools).values(data).returning().get();
      if (!result) {
        throw new Error('Failed to create agent tool');
      }
      return result;
    },

    async delete(id: number): Promise<void> {
      await db.delete(agentTools).where(eq(agentTools.id, id));
    },

    async deleteByAgentId(agentId: number): Promise<void> {
      await db.delete(agentTools).where(eq(agentTools.agentId, agentId));
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
      // Validate tool name and pattern if present
      if (data.toolName !== undefined || data.toolPattern !== undefined) {
        agentToolInputSchema.partial().parse({
          name: data.toolName,
          pattern: data.toolPattern,
        });
      }

      const now = new Date().toISOString();
      return db
        .update(agentTools)
        .set({ ...data, updatedAt: now })
        .where(eq(agentTools.id, id))
        .returning()
        .get();
    },
  };
}

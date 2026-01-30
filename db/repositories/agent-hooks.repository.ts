import { asc, eq } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';

import { type AgentHook, agentHooks, type NewAgentHook } from '../schema';

export interface AgentHooksRepository {
  create(data: NewAgentHook): Promise<AgentHook>;
  delete(id: number): Promise<void>;
  deleteByAgentId(agentId: number): Promise<void>;
  findByAgentId(agentId: number): Promise<Array<AgentHook>>;
  findByEventType(agentId: number, eventType: string): Promise<Array<AgentHook>>;
  findById(id: number): Promise<AgentHook | undefined>;
  update(id: number, data: Partial<Omit<NewAgentHook, 'createdAt' | 'id'>>): Promise<AgentHook | undefined>;
  updateOrder(id: number, orderIndex: number): Promise<AgentHook | undefined>;
}

export function createAgentHooksRepository(db: DrizzleDatabase): AgentHooksRepository {
  return {
    async create(data: NewAgentHook): Promise<AgentHook> {
      const result = await db.insert(agentHooks).values(data).returning();
      if (!result[0]) {
        throw new Error('Failed to create agent hook');
      }
      return result[0];
    },

    async delete(id: number): Promise<void> {
      await db.delete(agentHooks).where(eq(agentHooks.id, id));
    },

    async deleteByAgentId(agentId: number): Promise<void> {
      await db.delete(agentHooks).where(eq(agentHooks.agentId, agentId));
    },

    async findByAgentId(agentId: number): Promise<Array<AgentHook>> {
      return db.select().from(agentHooks).where(eq(agentHooks.agentId, agentId)).orderBy(asc(agentHooks.orderIndex));
    },

    async findByEventType(agentId: number, eventType: string): Promise<Array<AgentHook>> {
      return db
        .select()
        .from(agentHooks)
        .where(eq(agentHooks.agentId, agentId))
        .orderBy(asc(agentHooks.orderIndex))
        .then((hooks) => hooks.filter((h) => h.eventType === eventType));
    },

    async findById(id: number): Promise<AgentHook | undefined> {
      const result = await db.select().from(agentHooks).where(eq(agentHooks.id, id));
      return result[0];
    },

    async update(id: number, data: Partial<Omit<NewAgentHook, 'createdAt' | 'id'>>): Promise<AgentHook | undefined> {
      const now = new Date().toISOString();
      const result = await db
        .update(agentHooks)
        .set({ ...data, updatedAt: now })
        .where(eq(agentHooks.id, id))
        .returning();
      return result[0];
    },

    async updateOrder(id: number, orderIndex: number): Promise<AgentHook | undefined> {
      const now = new Date().toISOString();
      const result = await db
        .update(agentHooks)
        .set({ orderIndex, updatedAt: now })
        .where(eq(agentHooks.id, id))
        .returning();
      return result[0];
    },
  };
}

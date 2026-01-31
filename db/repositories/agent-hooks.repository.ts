import { and, asc, eq } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';

import {
  createAgentHookSchema,
  updateAgentHookOrderSchema,
  updateAgentHookSchema,
} from '../../lib/validations/agent';
import { type AgentHook, agentHooks, type NewAgentHook } from '../schema';

export interface AgentHooksRepository {
  create(data: NewAgentHook): Promise<AgentHook>;
  delete(id: number): Promise<boolean>;
  deleteByAgentId(agentId: number): Promise<boolean>;
  findByAgentId(agentId: number): Promise<Array<AgentHook>>;
  findByEventType(agentId: number, eventType: string): Promise<Array<AgentHook>>;
  findById(id: number): Promise<AgentHook | undefined>;
  update(id: number, data: Partial<Omit<NewAgentHook, 'createdAt' | 'id'>>): Promise<AgentHook | undefined>;
  updateOrder(id: number, orderIndex: number): Promise<AgentHook | undefined>;
}

export function createAgentHooksRepository(db: DrizzleDatabase): AgentHooksRepository {
  return {
    async create(data: NewAgentHook): Promise<AgentHook> {
      // Validate input data through Zod schema
      const validatedData = createAgentHookSchema.parse(data);
      const result = await db.insert(agentHooks).values(validatedData).returning();
      if (!result[0]) {
        throw new Error('Failed to create agent hook');
      }
      return result[0];
    },

    async delete(id: number): Promise<boolean> {
      const result = db.delete(agentHooks).where(eq(agentHooks.id, id)).run();
      return result.changes > 0;
    },

    async deleteByAgentId(agentId: number): Promise<boolean> {
      const result = db.delete(agentHooks).where(eq(agentHooks.agentId, agentId)).run();
      return result.changes > 0;
    },

    async findByAgentId(agentId: number): Promise<Array<AgentHook>> {
      return db.select().from(agentHooks).where(eq(agentHooks.agentId, agentId)).orderBy(asc(agentHooks.orderIndex));
    },

    async findByEventType(agentId: number, eventType: string): Promise<Array<AgentHook>> {
      return db
        .select()
        .from(agentHooks)
        .where(and(eq(agentHooks.agentId, agentId), eq(agentHooks.eventType, eventType)))
        .orderBy(asc(agentHooks.orderIndex));
    },

    async findById(id: number): Promise<AgentHook | undefined> {
      const result = await db.select().from(agentHooks).where(eq(agentHooks.id, id));
      return result[0];
    },

    async update(id: number, data: Partial<Omit<NewAgentHook, 'createdAt' | 'id'>>): Promise<AgentHook | undefined> {
      // Validate input data through Zod schema
      const validatedData = updateAgentHookSchema.parse(data);
      const now = new Date().toISOString();
      const result = await db
        .update(agentHooks)
        .set({ ...validatedData, updatedAt: now })
        .where(eq(agentHooks.id, id))
        .returning();
      return result[0];
    },

    async updateOrder(id: number, orderIndex: number): Promise<AgentHook | undefined> {
      // Validate input data through Zod schema
      const validatedData = updateAgentHookOrderSchema.parse({ orderIndex });
      const now = new Date().toISOString();
      const result = await db
        .update(agentHooks)
        .set({ orderIndex: validatedData.orderIndex, updatedAt: now })
        .where(eq(agentHooks.id, id))
        .returning();
      return result[0];
    },
  };
}

import { and, asc, eq, sql } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';

import { createAgentHookSchema, updateAgentHookOrderSchema, updateAgentHookSchema } from '../../lib/validations/agent';
import { type AgentHook, agentHooks, type NewAgentHook } from '../schema';
import { createBaseRepository } from './base.repository';

export interface AgentHooksRepository {
  create(data: NewAgentHook): AgentHook;
  delete(id: number): boolean;
  deleteByAgentId(agentId: number): boolean;
  findByAgentId(agentId: number): Array<AgentHook>;
  findByEventType(agentId: number, eventType: string): Array<AgentHook>;
  findById(id: number): AgentHook | undefined;
  update(id: number, data: Partial<Omit<NewAgentHook, 'createdAt' | 'id'>>): AgentHook | undefined;
  updateOrder(id: number, orderIndex: number): AgentHook | undefined;
}

export function createAgentHooksRepository(db: DrizzleDatabase): AgentHooksRepository {
  const base = createBaseRepository<typeof agentHooks, AgentHook, NewAgentHook>(db, agentHooks);

  return {
    create(data: NewAgentHook): AgentHook {
      const validatedData = createAgentHookSchema.parse(data);
      const result = db.insert(agentHooks).values(validatedData).returning().get();
      if (!result) {
        throw new Error('Failed to create agent hook');
      }
      return result;
    },

    delete: base.delete,

    deleteByAgentId(agentId: number): boolean {
      const result = db.delete(agentHooks).where(eq(agentHooks.agentId, agentId)).run();
      return result.changes > 0;
    },

    findByAgentId(agentId: number): Array<AgentHook> {
      return db.select().from(agentHooks).where(eq(agentHooks.agentId, agentId)).orderBy(asc(agentHooks.orderIndex)).all();
    },

    findByEventType(agentId: number, eventType: string): Array<AgentHook> {
      return db
        .select()
        .from(agentHooks)
        .where(and(eq(agentHooks.agentId, agentId), eq(agentHooks.eventType, eventType)))
        .orderBy(asc(agentHooks.orderIndex))
        .all();
    },

    findById: base.findById,

    update(id: number, data: Partial<Omit<NewAgentHook, 'createdAt' | 'id'>>): AgentHook | undefined {
      const validatedData = updateAgentHookSchema.parse(data);
      return db
        .update(agentHooks)
        .set({ ...validatedData, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(agentHooks.id, id))
        .returning()
        .get();
    },

    updateOrder(id: number, orderIndex: number): AgentHook | undefined {
      const validatedData = updateAgentHookOrderSchema.parse({ orderIndex });
      return db
        .update(agentHooks)
        .set({ orderIndex: validatedData.orderIndex, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(agentHooks.id, id))
        .returning()
        .get();
    },
  };
}

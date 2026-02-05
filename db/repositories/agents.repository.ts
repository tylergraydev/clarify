import { and, eq, isNotNull, isNull, or, sql } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';

import { createAgentSchema, updateAgentRepositorySchema } from '../../lib/validations/agent';
import { type Agent, agents, type NewAgent } from '../schema';
import { createBaseRepository } from './base.repository';

export interface AgentListFilters {
  excludeProjectAgents?: boolean;
  includeDeactivated?: boolean;
  projectId?: number;
  scope?: 'global' | 'project';
  type?: string;
}

export interface AgentsRepository {
  activate(id: number): Agent | undefined;
  create(data: NewAgent): Agent;
  deactivate(id: number): Agent | undefined;
  delete(id: number): boolean;
  findActive(projectId?: number): Array<Agent>;
  findAll(options?: AgentListFilters): Array<Agent>;
  findBuiltIn(): Array<Agent>;
  findById(id: number): Agent | undefined;
  findByName(name: string): Agent | undefined;
  findByProjectId(projectId: number): Array<Agent>;
  findByProjectWithParents(projectId: number): Array<Agent>;
  findByType(type: string): Array<Agent>;
  findGlobal(options?: { includeDeactivated?: boolean; type?: string }): Array<Agent>;
  update(id: number, data: Partial<Omit<NewAgent, 'createdAt' | 'id'>>): Agent | undefined;
}

export function createAgentsRepository(db: DrizzleDatabase): AgentsRepository {
  const base = createBaseRepository<typeof agents, Agent, NewAgent>(db, agents);

  return {
    activate(id: number): Agent | undefined {
      return db
        .update(agents)
        .set({ deactivatedAt: null, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(agents.id, id))
        .returning()
        .get();
    },

    create(data: NewAgent): Agent {
      const validatedData = createAgentSchema.parse(data);
      const result = db.insert(agents).values(validatedData).returning().get();
      if (!result) {
        throw new Error('Failed to create agent');
      }
      return result;
    },

    deactivate(id: number): Agent | undefined {
      return db
        .update(agents)
        .set({ deactivatedAt: sql`(CURRENT_TIMESTAMP)`, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(agents.id, id))
        .returning()
        .get();
    },

    delete: base.delete,

    findActive(projectId?: number): Array<Agent> {
      if (projectId !== undefined) {
        return db
          .select()
          .from(agents)
          .where(and(isNull(agents.deactivatedAt), eq(agents.projectId, projectId)))
          .all();
      }
      return db.select().from(agents).where(isNull(agents.deactivatedAt)).all();
    },

    findAll(options?: AgentListFilters): Array<Agent> {
      const conditions = [];

      if (!options?.includeDeactivated) {
        conditions.push(isNull(agents.deactivatedAt));
      }

      if (options?.scope === 'global') {
        conditions.push(isNull(agents.projectId));
      } else if (options?.scope === 'project' && options?.projectId) {
        conditions.push(eq(agents.projectId, options.projectId));
      } else if (options?.projectId !== undefined) {
        conditions.push(eq(agents.projectId, options.projectId));
      }

      if (options?.excludeProjectAgents) {
        conditions.push(isNull(agents.projectId));
      }

      if (options?.type) {
        conditions.push(eq(agents.type, options.type));
      }

      if (conditions.length === 0) {
        return db.select().from(agents).all();
      }

      return db
        .select()
        .from(agents)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .all();
    },

    findBuiltIn(): Array<Agent> {
      return db.select().from(agents).where(isNotNull(agents.builtInAt)).all();
    },

    findById: base.findById,

    findByName(name: string): Agent | undefined {
      return db.select().from(agents).where(eq(agents.name, name)).get();
    },

    findByProjectId(projectId: number): Array<Agent> {
      return db.select().from(agents).where(eq(agents.projectId, projectId)).all();
    },

    findByProjectWithParents(projectId: number): Array<Agent> {
      return db
        .select()
        .from(agents)
        .where(and(isNull(agents.deactivatedAt), or(eq(agents.projectId, projectId), isNull(agents.projectId))))
        .all();
    },

    findByType(type: string): Array<Agent> {
      return db.select().from(agents).where(eq(agents.type, type)).all();
    },

    findGlobal(options?: { includeDeactivated?: boolean; type?: string }): Array<Agent> {
      const conditions = [isNull(agents.projectId)];

      if (!options?.includeDeactivated) {
        conditions.push(isNull(agents.deactivatedAt));
      }

      if (options?.type) {
        conditions.push(eq(agents.type, options.type));
      }

      return db
        .select()
        .from(agents)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .all();
    },

    update(id: number, data: Partial<Omit<NewAgent, 'createdAt' | 'id'>>): Agent | undefined {
      const validatedData = updateAgentRepositorySchema.parse(data);
      return db
        .update(agents)
        .set({
          ...validatedData,
          updatedAt: sql`(CURRENT_TIMESTAMP)`,
          version: sql`${agents.version} + 1`,
        })
        .where(eq(agents.id, id))
        .returning()
        .get();
    },
  };
}

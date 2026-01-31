import { and, eq, isNotNull, isNull, or, sql } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';

import { createAgentSchema, updateAgentRepositorySchema } from '../../lib/validations/agent';
import { type Agent, agents, type NewAgent } from '../schema';

export interface AgentListFilters {
  excludeProjectAgents?: boolean;
  includeDeactivated?: boolean;
  projectId?: number;
  scope?: 'global' | 'project';
  type?: string;
}

export interface AgentsRepository {
  activate(id: number): Promise<Agent | undefined>;
  create(data: NewAgent): Promise<Agent>;
  deactivate(id: number): Promise<Agent | undefined>;
  delete(id: number): Promise<boolean>;
  findActive(projectId?: number): Promise<Array<Agent>>;
  findAll(options?: AgentListFilters): Promise<Array<Agent>>;
  findBuiltIn(): Promise<Array<Agent>>;
  findById(id: number): Promise<Agent | undefined>;
  findByName(name: string): Promise<Agent | undefined>;
  findByProjectId(projectId: number): Promise<Array<Agent>>;
  findByProjectWithParents(projectId: number): Promise<Array<Agent>>;
  findByType(type: string): Promise<Array<Agent>>;
  findGlobal(options?: { includeDeactivated?: boolean; type?: string }): Promise<Array<Agent>>;
  update(id: number, data: Partial<Omit<NewAgent, 'createdAt' | 'id'>>): Promise<Agent | undefined>;
}

export function createAgentsRepository(db: DrizzleDatabase): AgentsRepository {
  return {
    async activate(id: number): Promise<Agent | undefined> {
      const now = new Date().toISOString();
      return db
        .update(agents)
        .set({ deactivatedAt: null, updatedAt: now })
        .where(eq(agents.id, id))
        .returning()
        .get();
    },

    async create(data: NewAgent): Promise<Agent> {
      // Validate input data through Zod schema
      const validatedData = createAgentSchema.parse(data);
      const result = db.insert(agents).values(validatedData).returning().get();
      if (!result) {
        throw new Error('Failed to create agent');
      }
      return result;
    },

    async deactivate(id: number): Promise<Agent | undefined> {
      const now = new Date().toISOString();
      return db
        .update(agents)
        .set({ deactivatedAt: now, updatedAt: now })
        .where(eq(agents.id, id))
        .returning()
        .get();
    },

    async delete(id: number): Promise<boolean> {
      const result = db.delete(agents).where(eq(agents.id, id)).run();
      return result.changes > 0;
    },

    async findActive(projectId?: number): Promise<Array<Agent>> {
      if (projectId !== undefined) {
        return db
          .select()
          .from(agents)
          .where(and(isNull(agents.deactivatedAt), eq(agents.projectId, projectId)));
      }
      return db.select().from(agents).where(isNull(agents.deactivatedAt));
    },

    async findAll(options?: AgentListFilters): Promise<Array<Agent>> {
      const conditions = [];

      if (!options?.includeDeactivated) {
        conditions.push(isNull(agents.deactivatedAt));
      }

      // Handle scope filter
      if (options?.scope === 'global') {
        // Global scope: only agents where projectId IS NULL
        conditions.push(isNull(agents.projectId));
      } else if (options?.scope === 'project' && options?.projectId) {
        // Project scope: only agents for the specific project
        conditions.push(eq(agents.projectId, options.projectId));
      } else if (options?.projectId !== undefined) {
        // Legacy behavior: filter by projectId if provided
        conditions.push(eq(agents.projectId, options.projectId));
      }

      // Handle excludeProjectAgents flag (for global view that excludes project-specific agents)
      if (options?.excludeProjectAgents) {
        conditions.push(isNull(agents.projectId));
      }

      if (options?.type) {
        conditions.push(eq(agents.type, options.type));
      }

      if (conditions.length === 0) {
        return db.select().from(agents);
      }

      return db
        .select()
        .from(agents)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions));
    },

    async findBuiltIn(): Promise<Array<Agent>> {
      return db.select().from(agents).where(isNotNull(agents.builtInAt));
    },

    async findById(id: number): Promise<Agent | undefined> {
      return db.select().from(agents).where(eq(agents.id, id)).get();
    },

    async findByName(name: string): Promise<Agent | undefined> {
      return db.select().from(agents).where(eq(agents.name, name)).get();
    },

    async findByProjectId(projectId: number): Promise<Array<Agent>> {
      return db.select().from(agents).where(eq(agents.projectId, projectId));
    },

    async findByProjectWithParents(projectId: number): Promise<Array<Agent>> {
      // Get project-specific agents and their global parent agents
      // This is useful for resolving agent overrides in project context
      return db
        .select()
        .from(agents)
        .where(
          and(
            isNull(agents.deactivatedAt),
            or(
              // Include project-specific agents for this project
              eq(agents.projectId, projectId),
              // Include global agents (potential parents)
              isNull(agents.projectId)
            )
          )
        );
    },

    async findByType(type: string): Promise<Array<Agent>> {
      return db.select().from(agents).where(eq(agents.type, type));
    },

    async findGlobal(options?: { includeDeactivated?: boolean; type?: string }): Promise<Array<Agent>> {
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
        .where(conditions.length === 1 ? conditions[0] : and(...conditions));
    },

    async update(id: number, data: Partial<Omit<NewAgent, 'createdAt' | 'id'>>): Promise<Agent | undefined> {
      // Validate input data through Zod schema
      const validatedData = updateAgentRepositorySchema.parse(data);
      const now = new Date().toISOString();
      return db
        .update(agents)
        .set({
          ...validatedData,
          updatedAt: now,
          version: sql`${agents.version} + 1`,
        })
        .where(eq(agents.id, id))
        .returning()
        .get();
    },
  };
}

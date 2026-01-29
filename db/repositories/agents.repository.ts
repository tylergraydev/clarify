import { and, eq, isNotNull, isNull } from "drizzle-orm";

import type { DrizzleDatabase } from "../index";

import { type Agent, agents, type NewAgent } from "../schema";

export interface AgentsRepository {
  activate(id: number): Promise<Agent | undefined>;
  create(data: NewAgent): Promise<Agent>;
  deactivate(id: number): Promise<Agent | undefined>;
  delete(id: number): Promise<void>;
  findActive(projectId?: number): Promise<Array<Agent>>;
  findAll(options?: {
    includeDeactivated?: boolean;
    projectId?: number;
    type?: string;
  }): Promise<Array<Agent>>;
  findBuiltIn(): Promise<Array<Agent>>;
  findById(id: number): Promise<Agent | undefined>;
  findByName(name: string): Promise<Agent | undefined>;
  findByProjectId(projectId: number): Promise<Array<Agent>>;
  findByType(type: string): Promise<Array<Agent>>;
  update(
    id: number,
    data: Partial<Omit<NewAgent, "createdAt" | "id">>
  ): Promise<Agent | undefined>;
}

export function createAgentsRepository(db: DrizzleDatabase): AgentsRepository {
  return {
    async activate(id: number): Promise<Agent | undefined> {
      const now = new Date().toISOString();
      const result = await db
        .update(agents)
        .set({ deactivatedAt: null, updatedAt: now })
        .where(eq(agents.id, id))
        .returning();
      return result[0];
    },

    async create(data: NewAgent): Promise<Agent> {
      const result = await db.insert(agents).values(data).returning();
      if (!result[0]) {
        throw new Error("Failed to create agent");
      }
      return result[0];
    },

    async deactivate(id: number): Promise<Agent | undefined> {
      const now = new Date().toISOString();
      const result = await db
        .update(agents)
        .set({ deactivatedAt: now, updatedAt: now })
        .where(eq(agents.id, id))
        .returning();
      return result[0];
    },

    async delete(id: number): Promise<void> {
      await db.delete(agents).where(eq(agents.id, id));
    },

    async findActive(projectId?: number): Promise<Array<Agent>> {
      if (projectId !== undefined) {
        return db
          .select()
          .from(agents)
          .where(
            and(isNull(agents.deactivatedAt), eq(agents.projectId, projectId))
          );
      }
      return db.select().from(agents).where(isNull(agents.deactivatedAt));
    },

    async findAll(options?: {
      includeDeactivated?: boolean;
      projectId?: number;
      type?: string;
    }): Promise<Array<Agent>> {
      const conditions = [];

      if (!options?.includeDeactivated) {
        conditions.push(isNull(agents.deactivatedAt));
      }

      if (options?.projectId !== undefined) {
        conditions.push(eq(agents.projectId, options.projectId));
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
      const result = await db.select().from(agents).where(eq(agents.id, id));
      return result[0];
    },

    async findByName(name: string): Promise<Agent | undefined> {
      const result = await db
        .select()
        .from(agents)
        .where(eq(agents.name, name));
      return result[0];
    },

    async findByProjectId(projectId: number): Promise<Array<Agent>> {
      return db.select().from(agents).where(eq(agents.projectId, projectId));
    },

    async findByType(type: string): Promise<Array<Agent>> {
      return db.select().from(agents).where(eq(agents.type, type));
    },

    async update(
      id: number,
      data: Partial<Omit<NewAgent, "createdAt" | "id">>
    ): Promise<Agent | undefined> {
      const now = new Date().toISOString();
      const result = await db
        .update(agents)
        .set({ ...data, updatedAt: now })
        .where(eq(agents.id, id))
        .returning();
      return result[0];
    },
  };
}

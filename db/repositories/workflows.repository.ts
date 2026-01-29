import { and, eq, sql } from "drizzle-orm";

import type { DrizzleDatabase } from "../index";
import type { NewWorkflow, Workflow } from "../schema";

import { workflows } from "../schema";

export interface WorkflowsRepository {
  complete(id: number, durationMs: number): undefined | Workflow;
  create(data: NewWorkflow): Workflow;
  delete(id: number): boolean;
  fail(id: number, errorMessage: string): undefined | Workflow;
  findAll(options?: {
    projectId?: number;
    status?: string;
    type?: string;
  }): Array<Workflow>;
  findById(id: number): undefined | Workflow;
  findByProjectId(projectId: number): Array<Workflow>;
  findByStatus(status: string): Array<Workflow>;
  findByType(type: string): Array<Workflow>;
  findRunning(): Array<Workflow>;
  start(id: number): undefined | Workflow;
  update(id: number, data: Partial<NewWorkflow>): undefined | Workflow;
  updateStatus(
    id: number,
    status: string,
    errorMessage?: string
  ): undefined | Workflow;
}

export function createWorkflowsRepository(
  db: DrizzleDatabase
): WorkflowsRepository {
  return {
    complete(id: number, durationMs: number): undefined | Workflow {
      return db
        .update(workflows)
        .set({
          completedAt: sql`(CURRENT_TIMESTAMP)`,
          durationMs,
          status: "completed",
          updatedAt: sql`(CURRENT_TIMESTAMP)`,
        })
        .where(eq(workflows.id, id))
        .returning()
        .get();
    },

    create(data: NewWorkflow): Workflow {
      return db.insert(workflows).values(data).returning().get();
    },

    delete(id: number): boolean {
      const result = db.delete(workflows).where(eq(workflows.id, id)).run();
      return result.changes > 0;
    },

    fail(id: number, errorMessage: string): undefined | Workflow {
      return db
        .update(workflows)
        .set({
          errorMessage,
          status: "failed",
          updatedAt: sql`(CURRENT_TIMESTAMP)`,
        })
        .where(eq(workflows.id, id))
        .returning()
        .get();
    },

    findAll(options?: {
      projectId?: number;
      status?: string;
      type?: string;
    }): Array<Workflow> {
      const conditions = [];

      if (options?.projectId !== undefined) {
        conditions.push(eq(workflows.projectId, options.projectId));
      }
      if (options?.status !== undefined) {
        conditions.push(eq(workflows.status, options.status));
      }
      if (options?.type !== undefined) {
        conditions.push(eq(workflows.type, options.type));
      }

      if (conditions.length === 0) {
        return db.select().from(workflows).all();
      }

      return db
        .select()
        .from(workflows)
        .where(and(...conditions))
        .all();
    },

    findById(id: number): undefined | Workflow {
      return db.select().from(workflows).where(eq(workflows.id, id)).get();
    },

    findByProjectId(projectId: number): Array<Workflow> {
      return db
        .select()
        .from(workflows)
        .where(eq(workflows.projectId, projectId))
        .all();
    },

    findByStatus(status: string): Array<Workflow> {
      return db
        .select()
        .from(workflows)
        .where(eq(workflows.status, status))
        .all();
    },

    findByType(type: string): Array<Workflow> {
      return db.select().from(workflows).where(eq(workflows.type, type)).all();
    },

    findRunning(): Array<Workflow> {
      return db
        .select()
        .from(workflows)
        .where(eq(workflows.status, "running"))
        .all();
    },

    start(id: number): undefined | Workflow {
      return db
        .update(workflows)
        .set({
          startedAt: sql`(CURRENT_TIMESTAMP)`,
          status: "running",
          updatedAt: sql`(CURRENT_TIMESTAMP)`,
        })
        .where(eq(workflows.id, id))
        .returning()
        .get();
    },

    update(id: number, data: Partial<NewWorkflow>): undefined | Workflow {
      return db
        .update(workflows)
        .set({ ...data, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(workflows.id, id))
        .returning()
        .get();
    },

    updateStatus(
      id: number,
      status: string,
      errorMessage?: string
    ): undefined | Workflow {
      const updateData: Record<string, unknown> = {
        status,
        updatedAt: sql`(CURRENT_TIMESTAMP)`,
      };

      if (errorMessage !== undefined) {
        updateData.errorMessage = errorMessage;
      }

      return db
        .update(workflows)
        .set(updateData)
        .where(eq(workflows.id, id))
        .returning()
        .get();
    },
  };
}

import { and, eq, sql } from "drizzle-orm";

import type { DrizzleDatabase } from "../index";
import type { NewWorkflowStep, WorkflowStep } from "../schema";

import { workflowSteps } from "../schema";

export interface WorkflowStepsRepository {
  complete(
    id: number,
    outputText: string,
    durationMs: number
  ): undefined | WorkflowStep;
  create(data: NewWorkflowStep): WorkflowStep;
  delete(id: number): boolean;
  fail(id: number, errorMessage: string): undefined | WorkflowStep;
  findAll(options?: {
    status?: string;
    workflowId?: number;
  }): Array<WorkflowStep>;
  findById(id: number): undefined | WorkflowStep;
  findByStepNumber(
    workflowId: number,
    stepNumber: number
  ): undefined | WorkflowStep;
  findByWorkflowId(workflowId: number): Array<WorkflowStep>;
  markEdited(id: number, outputText: string): undefined | WorkflowStep;
  start(id: number): undefined | WorkflowStep;
  update(id: number, data: Partial<NewWorkflowStep>): undefined | WorkflowStep;
  updateStatus(
    id: number,
    status: string,
    errorMessage?: string
  ): undefined | WorkflowStep;
}

export function createWorkflowStepsRepository(
  db: DrizzleDatabase
): WorkflowStepsRepository {
  return {
    complete(
      id: number,
      outputText: string,
      durationMs: number
    ): undefined | WorkflowStep {
      return db
        .update(workflowSteps)
        .set({
          completedAt: sql`(CURRENT_TIMESTAMP)`,
          durationMs,
          outputText,
          status: "completed",
          updatedAt: sql`(CURRENT_TIMESTAMP)`,
        })
        .where(eq(workflowSteps.id, id))
        .returning()
        .get();
    },

    create(data: NewWorkflowStep): WorkflowStep {
      return db.insert(workflowSteps).values(data).returning().get();
    },

    delete(id: number): boolean {
      const result = db
        .delete(workflowSteps)
        .where(eq(workflowSteps.id, id))
        .run();
      return result.changes > 0;
    },

    fail(id: number, errorMessage: string): undefined | WorkflowStep {
      return db
        .update(workflowSteps)
        .set({
          errorMessage,
          status: "failed",
          updatedAt: sql`(CURRENT_TIMESTAMP)`,
        })
        .where(eq(workflowSteps.id, id))
        .returning()
        .get();
    },

    findAll(options?: {
      status?: string;
      workflowId?: number;
    }): Array<WorkflowStep> {
      const conditions = [];

      if (options?.workflowId !== undefined) {
        conditions.push(eq(workflowSteps.workflowId, options.workflowId));
      }
      if (options?.status !== undefined) {
        conditions.push(eq(workflowSteps.status, options.status));
      }

      if (conditions.length === 0) {
        return db.select().from(workflowSteps).all();
      }

      return db
        .select()
        .from(workflowSteps)
        .where(and(...conditions))
        .all();
    },

    findById(id: number): undefined | WorkflowStep {
      return db
        .select()
        .from(workflowSteps)
        .where(eq(workflowSteps.id, id))
        .get();
    },

    findByStepNumber(
      workflowId: number,
      stepNumber: number
    ): undefined | WorkflowStep {
      return db
        .select()
        .from(workflowSteps)
        .where(
          and(
            eq(workflowSteps.workflowId, workflowId),
            eq(workflowSteps.stepNumber, stepNumber)
          )
        )
        .get();
    },

    findByWorkflowId(workflowId: number): Array<WorkflowStep> {
      return db
        .select()
        .from(workflowSteps)
        .where(eq(workflowSteps.workflowId, workflowId))
        .all();
    },

    markEdited(id: number, outputText: string): undefined | WorkflowStep {
      return db
        .update(workflowSteps)
        .set({
          outputEditedAt: sql`(CURRENT_TIMESTAMP)`,
          outputText,
          updatedAt: sql`(CURRENT_TIMESTAMP)`,
        })
        .where(eq(workflowSteps.id, id))
        .returning()
        .get();
    },

    start(id: number): undefined | WorkflowStep {
      return db
        .update(workflowSteps)
        .set({
          startedAt: sql`(CURRENT_TIMESTAMP)`,
          status: "running",
          updatedAt: sql`(CURRENT_TIMESTAMP)`,
        })
        .where(eq(workflowSteps.id, id))
        .returning()
        .get();
    },

    update(
      id: number,
      data: Partial<NewWorkflowStep>
    ): undefined | WorkflowStep {
      return db
        .update(workflowSteps)
        .set({ ...data, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(workflowSteps.id, id))
        .returning()
        .get();
    },

    updateStatus(
      id: number,
      status: string,
      errorMessage?: string
    ): undefined | WorkflowStep {
      const updateData: Record<string, unknown> = {
        status,
        updatedAt: sql`(CURRENT_TIMESTAMP)`,
      };

      if (errorMessage !== undefined) {
        updateData.errorMessage = errorMessage;
      }

      return db
        .update(workflowSteps)
        .set(updateData)
        .where(eq(workflowSteps.id, id))
        .returning()
        .get();
    },
  };
}

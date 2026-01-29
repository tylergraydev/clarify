import { eq, isNotNull, isNull, sql } from "drizzle-orm";

import type { DrizzleDatabase } from "../index";
import type { ImplementationPlan, NewImplementationPlan } from "../schema";

import { implementationPlans } from "../schema";

export interface ImplementationPlansRepository {
  approve(id: number): ImplementationPlan | undefined;
  create(data: NewImplementationPlan): ImplementationPlan;
  delete(id: number): boolean;
  findAll(options?: { approved?: boolean }): Array<ImplementationPlan>;
  findApproved(): Array<ImplementationPlan>;
  findById(id: number): ImplementationPlan | undefined;
  findByWorkflowId(workflowId: number): ImplementationPlan | undefined;
  findPending(): Array<ImplementationPlan>;
  update(
    id: number,
    data: Partial<NewImplementationPlan>
  ): ImplementationPlan | undefined;
}

export function createImplementationPlansRepository(
  db: DrizzleDatabase
): ImplementationPlansRepository {
  return {
    approve(id: number): ImplementationPlan | undefined {
      return db
        .update(implementationPlans)
        .set({
          approvedAt: sql`(CURRENT_TIMESTAMP)`,
          updatedAt: sql`(CURRENT_TIMESTAMP)`,
        })
        .where(eq(implementationPlans.id, id))
        .returning()
        .get();
    },

    create(data: NewImplementationPlan): ImplementationPlan {
      return db.insert(implementationPlans).values(data).returning().get();
    },

    delete(id: number): boolean {
      const result = db
        .delete(implementationPlans)
        .where(eq(implementationPlans.id, id))
        .run();
      return result.changes > 0;
    },

    findAll(options?: { approved?: boolean }): Array<ImplementationPlan> {
      if (options?.approved === undefined) {
        return db.select().from(implementationPlans).all();
      }

      if (options.approved) {
        return db
          .select()
          .from(implementationPlans)
          .where(isNotNull(implementationPlans.approvedAt))
          .all();
      }

      return db
        .select()
        .from(implementationPlans)
        .where(isNull(implementationPlans.approvedAt))
        .all();
    },

    findApproved(): Array<ImplementationPlan> {
      return db
        .select()
        .from(implementationPlans)
        .where(isNotNull(implementationPlans.approvedAt))
        .all();
    },

    findById(id: number): ImplementationPlan | undefined {
      return db
        .select()
        .from(implementationPlans)
        .where(eq(implementationPlans.id, id))
        .get();
    },

    findByWorkflowId(workflowId: number): ImplementationPlan | undefined {
      return db
        .select()
        .from(implementationPlans)
        .where(eq(implementationPlans.workflowId, workflowId))
        .get();
    },

    findPending(): Array<ImplementationPlan> {
      return db
        .select()
        .from(implementationPlans)
        .where(isNull(implementationPlans.approvedAt))
        .all();
    },

    update(
      id: number,
      data: Partial<NewImplementationPlan>
    ): ImplementationPlan | undefined {
      return db
        .update(implementationPlans)
        .set({ ...data, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(implementationPlans.id, id))
        .returning()
        .get();
    },
  };
}

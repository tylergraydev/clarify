import { and, eq, sql } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';
import type { NewWorkflowRepository, WorkflowRepository } from '../schema';

import { workflowRepositories } from '../schema';

export interface WorkflowRepositoriesRepository {
  addMultipleToWorkflow(
    workflowId: number,
    repositoryIds: Array<number>,
    primaryRepositoryId?: number
  ): Array<WorkflowRepository>;
  addToWorkflow(workflowId: number, repositoryId: number, isPrimary?: boolean): WorkflowRepository;
  findByWorkflowId(workflowId: number): Array<WorkflowRepository>;
  removeFromWorkflow(workflowId: number, repositoryId: number): boolean;
  setPrimary(workflowId: number, repositoryId: number): undefined | WorkflowRepository;
}

export function createWorkflowRepositoriesRepository(db: DrizzleDatabase): WorkflowRepositoriesRepository {
  return {
    addMultipleToWorkflow(
      workflowId: number,
      repositoryIds: Array<number>,
      primaryRepositoryId?: number
    ): Array<WorkflowRepository> {
      const results: Array<WorkflowRepository> = [];

      for (const repositoryId of repositoryIds) {
        const isPrimary = repositoryId === primaryRepositoryId;
        const data: NewWorkflowRepository = {
          repositoryId,
          setPrimaryAt: isPrimary ? new Date().toISOString() : null,
          workflowId,
        };

        const result = db.insert(workflowRepositories).values(data).returning().get();
        results.push(result);
      }

      return results;
    },

    addToWorkflow(workflowId: number, repositoryId: number, isPrimary?: boolean): WorkflowRepository {
      const data: NewWorkflowRepository = {
        repositoryId,
        setPrimaryAt: isPrimary ? new Date().toISOString() : null,
        workflowId,
      };

      return db.insert(workflowRepositories).values(data).returning().get();
    },

    findByWorkflowId(workflowId: number): Array<WorkflowRepository> {
      return db.select().from(workflowRepositories).where(eq(workflowRepositories.workflowId, workflowId)).all();
    },

    removeFromWorkflow(workflowId: number, repositoryId: number): boolean {
      const result = db
        .delete(workflowRepositories)
        .where(
          and(eq(workflowRepositories.workflowId, workflowId), eq(workflowRepositories.repositoryId, repositoryId))
        )
        .run();
      return result.changes > 0;
    },

    setPrimary(workflowId: number, repositoryId: number): undefined | WorkflowRepository {
      // First, clear any existing primary for this workflow
      db.update(workflowRepositories)
        .set({ setPrimaryAt: null })
        .where(eq(workflowRepositories.workflowId, workflowId))
        .run();

      // Then set the new primary
      return db
        .update(workflowRepositories)
        .set({ setPrimaryAt: sql`(CURRENT_TIMESTAMP)` })
        .where(
          and(eq(workflowRepositories.workflowId, workflowId), eq(workflowRepositories.repositoryId, repositoryId))
        )
        .returning()
        .get();
    },
  };
}

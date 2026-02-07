import { and, eq } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';
import type { NewWorkflowRepository, WorkflowRepository } from '../schema';

import { workflowRepositories } from '../schema';

export interface WorkflowRepositoriesRepository {
  addMultipleToWorkflow(workflowId: number, repositoryIds: Array<number>): Array<WorkflowRepository>;
  addToWorkflow(workflowId: number, repositoryId: number): WorkflowRepository;
  findByRepositoryId(repositoryId: number): Array<WorkflowRepository>;
  findByWorkflowId(workflowId: number): Array<WorkflowRepository>;
  removeFromWorkflow(workflowId: number, repositoryId: number): boolean;
}

export function createWorkflowRepositoriesRepository(db: DrizzleDatabase): WorkflowRepositoriesRepository {
  return {
    addMultipleToWorkflow(workflowId: number, repositoryIds: Array<number>): Array<WorkflowRepository> {
      const results: Array<WorkflowRepository> = [];

      for (const repositoryId of repositoryIds) {
        const data: NewWorkflowRepository = {
          repositoryId,
          workflowId,
        };

        const result = db.insert(workflowRepositories).values(data).returning().get();
        results.push(result);
      }

      return results;
    },

    addToWorkflow(workflowId: number, repositoryId: number): WorkflowRepository {
      const data: NewWorkflowRepository = {
        repositoryId,
        workflowId,
      };

      return db.insert(workflowRepositories).values(data).returning().get();
    },

    findByRepositoryId(repositoryId: number): Array<WorkflowRepository> {
      return db
        .select()
        .from(workflowRepositories)
        .where(eq(workflowRepositories.repositoryId, repositoryId))
        .all();
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
  };
}

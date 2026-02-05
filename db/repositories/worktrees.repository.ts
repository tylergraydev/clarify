import { and, eq, sql } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';
import type { NewWorktree, Worktree } from '../schema';

import { worktrees } from '../schema';
import { createBaseRepository } from './base.repository';

export interface WorktreesRepository {
  create(data: NewWorktree): Worktree;
  delete(id: number): boolean;
  findActive(repositoryId: number): Array<Worktree>;
  findAll(options?: { repositoryId?: number; status?: string }): Array<Worktree>;
  findById(id: number): undefined | Worktree;
  findByPath(path: string): undefined | Worktree;
  findByRepositoryId(repositoryId: number): Array<Worktree>;
  findByWorkflowId(workflowId: number): undefined | Worktree;
  update(id: number, data: Partial<NewWorktree>): undefined | Worktree;
  updateStatus(id: number, status: string): undefined | Worktree;
}

export function createWorktreesRepository(db: DrizzleDatabase): WorktreesRepository {
  const base = createBaseRepository<typeof worktrees, Worktree, NewWorktree>(db, worktrees);

  return {
    ...base,

    findActive(repositoryId: number): Array<Worktree> {
      return db
        .select()
        .from(worktrees)
        .where(and(eq(worktrees.repositoryId, repositoryId), eq(worktrees.status, 'active')))
        .all();
    },

    findAll(options?: { repositoryId?: number; status?: string }): Array<Worktree> {
      if (!options || (!options.repositoryId && !options.status)) {
        return db.select().from(worktrees).all();
      }

      const conditions = [];
      if (options.repositoryId) {
        conditions.push(eq(worktrees.repositoryId, options.repositoryId));
      }
      if (options.status) {
        conditions.push(eq(worktrees.status, options.status));
      }

      return db
        .select()
        .from(worktrees)
        .where(and(...conditions))
        .all();
    },

    findByPath(path: string): undefined | Worktree {
      return db.select().from(worktrees).where(eq(worktrees.path, path)).get();
    },

    findByRepositoryId(repositoryId: number): Array<Worktree> {
      return db.select().from(worktrees).where(eq(worktrees.repositoryId, repositoryId)).all();
    },

    findByWorkflowId(workflowId: number): undefined | Worktree {
      return db.select().from(worktrees).where(eq(worktrees.workflowId, workflowId)).get();
    },

    updateStatus(id: number, status: string): undefined | Worktree {
      return db
        .update(worktrees)
        .set({ status, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(worktrees.id, id))
        .returning()
        .get();
    },
  };
}

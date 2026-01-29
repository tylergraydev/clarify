import { and, eq, sql } from "drizzle-orm";

import type { DrizzleDatabase } from "../index";
import type { NewWorktree, Worktree } from "../schema";

import { worktrees } from "../schema";

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

export function createWorktreesRepository(
  db: DrizzleDatabase
): WorktreesRepository {
  return {
    create(data: NewWorktree): Worktree {
      return db.insert(worktrees).values(data).returning().get();
    },

    delete(id: number): boolean {
      const result = db.delete(worktrees).where(eq(worktrees.id, id)).run();
      return result.changes > 0;
    },

    findActive(repositoryId: number): Array<Worktree> {
      return db
        .select()
        .from(worktrees)
        .where(
          and(
            eq(worktrees.repositoryId, repositoryId),
            eq(worktrees.status, "active")
          )
        )
        .all();
    },

    findAll(options?: {
      repositoryId?: number;
      status?: string;
    }): Array<Worktree> {
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

    findById(id: number): undefined | Worktree {
      return db.select().from(worktrees).where(eq(worktrees.id, id)).get();
    },

    findByPath(path: string): undefined | Worktree {
      return db.select().from(worktrees).where(eq(worktrees.path, path)).get();
    },

    findByRepositoryId(repositoryId: number): Array<Worktree> {
      return db
        .select()
        .from(worktrees)
        .where(eq(worktrees.repositoryId, repositoryId))
        .all();
    },

    findByWorkflowId(workflowId: number): undefined | Worktree {
      return db
        .select()
        .from(worktrees)
        .where(eq(worktrees.workflowId, workflowId))
        .get();
    },

    update(id: number, data: Partial<NewWorktree>): undefined | Worktree {
      return db
        .update(worktrees)
        .set({ ...data, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(worktrees.id, id))
        .returning()
        .get();
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

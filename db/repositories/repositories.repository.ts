import { and, eq, isNotNull, sql } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';
import type { NewRepository, Repository } from '../schema';

import { repositories } from '../schema';
import { createBaseRepository } from './base.repository';

export interface RepositoriesRepository {
  clearDefault(id: number): Repository | undefined;
  create(data: NewRepository): Repository;
  delete(id: number): boolean;
  findAll(options?: { projectId?: number }): Array<Repository>;
  findById(id: number): Repository | undefined;
  findByPath(path: string): Repository | undefined;
  findByProjectId(projectId: number): Array<Repository>;
  findDefault(projectId: number): Repository | undefined;
  setAsDefault(id: number): Repository | undefined;
  update(id: number, data: Partial<NewRepository>): Repository | undefined;
}

export function createRepositoriesRepository(db: DrizzleDatabase): RepositoriesRepository {
  const base = createBaseRepository<typeof repositories, Repository, NewRepository>(db, repositories);

  return {
    ...base,

    clearDefault(id: number): Repository | undefined {
      return db
        .update(repositories)
        .set({ setAsDefaultAt: null, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(repositories.id, id))
        .returning()
        .get();
    },

    findAll(options?: { projectId?: number }): Array<Repository> {
      if (options?.projectId) {
        return db.select().from(repositories).where(eq(repositories.projectId, options.projectId)).all();
      }
      return db.select().from(repositories).all();
    },

    findByPath(path: string): Repository | undefined {
      return db.select().from(repositories).where(eq(repositories.path, path)).get();
    },

    findByProjectId(projectId: number): Array<Repository> {
      return db.select().from(repositories).where(eq(repositories.projectId, projectId)).all();
    },

    findDefault(projectId: number): Repository | undefined {
      return db
        .select()
        .from(repositories)
        .where(and(eq(repositories.projectId, projectId), isNotNull(repositories.setAsDefaultAt)))
        .get();
    },

    setAsDefault(id: number): Repository | undefined {
      return db
        .update(repositories)
        .set({
          setAsDefaultAt: sql`(CURRENT_TIMESTAMP)`,
          updatedAt: sql`(CURRENT_TIMESTAMP)`,
        })
        .where(eq(repositories.id, id))
        .returning()
        .get();
    },
  };
}

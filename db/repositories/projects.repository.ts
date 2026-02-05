import { and, eq, isNull, sql } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';

import { createProjectSchema, updateProjectSchema } from '../../lib/validations/project';
import { type NewProject, type Project, projects } from '../schema';
import { createBaseRepository } from './base.repository';

export interface ProjectsRepository {
  archive(id: number): Project | undefined;
  create(data: NewProject): Project;
  delete(id: number): boolean;
  findAll(options?: { includeArchived?: boolean }): Array<Project>;
  findById(id: number): Project | undefined;
  findFavorites(): Array<Project>;
  toggleFavorite(id: number): Project | undefined;
  unarchive(id: number): Project | undefined;
  update(id: number, data: Partial<Omit<NewProject, 'createdAt' | 'id'>>): Project | undefined;
}

export function createProjectsRepository(db: DrizzleDatabase): ProjectsRepository {
  const base = createBaseRepository<typeof projects, Project, NewProject>(db, projects);

  return {
    archive(id: number): Project | undefined {
      return db
        .update(projects)
        .set({ archivedAt: sql`(CURRENT_TIMESTAMP)`, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(projects.id, id))
        .returning()
        .get();
    },

    create(data: NewProject): Project {
      const validatedData = createProjectSchema.parse(data);
      const result = db.insert(projects).values(validatedData).returning().get();
      if (!result) {
        throw new Error('Failed to create project');
      }
      return result;
    },

    delete: base.delete,

    findAll(options?: { includeArchived?: boolean }): Array<Project> {
      if (options?.includeArchived) {
        return db.select().from(projects).all();
      }
      return db.select().from(projects).where(isNull(projects.archivedAt)).all();
    },

    findById: base.findById,

    findFavorites(): Array<Project> {
      return db
        .select()
        .from(projects)
        .where(and(eq(projects.isFavorite, true), isNull(projects.archivedAt)))
        .all();
    },

    toggleFavorite(id: number): Project | undefined {
      const existing = db.select().from(projects).where(eq(projects.id, id)).get();
      if (!existing) {
        return undefined;
      }

      const newFavoriteStatus = !existing.isFavorite;

      return db
        .update(projects)
        .set({ isFavorite: newFavoriteStatus, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(projects.id, id))
        .returning()
        .get();
    },

    unarchive(id: number): Project | undefined {
      return db
        .update(projects)
        .set({ archivedAt: null, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(projects.id, id))
        .returning()
        .get();
    },

    update(id: number, data: Partial<Omit<NewProject, 'createdAt' | 'id'>>): Project | undefined {
      const validatedData = updateProjectSchema.parse(data);
      return db
        .update(projects)
        .set({ ...validatedData, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(projects.id, id))
        .returning()
        .get();
    },
  };
}

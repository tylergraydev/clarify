import { eq, isNull } from 'drizzle-orm';

import { createProjectSchema, updateProjectSchema } from '@/lib/validations/project';

import type { DrizzleDatabase } from '../index';

import { type NewProject, type Project, projects } from '../schema';

export interface ProjectsRepository {
  archive(id: number): Promise<Project | undefined>;
  create(data: NewProject): Promise<Project>;
  delete(id: number): Promise<boolean>;
  findAll(options?: { includeArchived?: boolean }): Promise<Array<Project>>;
  findById(id: number): Promise<Project | undefined>;
  unarchive(id: number): Promise<Project | undefined>;
  update(id: number, data: Partial<Omit<NewProject, 'createdAt' | 'id'>>): Promise<Project | undefined>;
}

export function createProjectsRepository(db: DrizzleDatabase): ProjectsRepository {
  return {
    async archive(id: number): Promise<Project | undefined> {
      const now = new Date().toISOString();
      const result = await db
        .update(projects)
        .set({ archivedAt: now, updatedAt: now })
        .where(eq(projects.id, id))
        .returning();
      return result[0];
    },

    async create(data: NewProject): Promise<Project> {
      const validatedData = createProjectSchema.parse(data);
      const result = await db.insert(projects).values(validatedData).returning();
      if (!result[0]) {
        throw new Error('Failed to create project');
      }
      return result[0];
    },

    async delete(id: number): Promise<boolean> {
      const result = db.delete(projects).where(eq(projects.id, id)).run();
      return result.changes > 0;
    },

    async findAll(options?: { includeArchived?: boolean }): Promise<Array<Project>> {
      if (options?.includeArchived) {
        return db.select().from(projects).all();
      }
      return db.select().from(projects).where(isNull(projects.archivedAt)).all();
    },

    async findById(id: number): Promise<Project | undefined> {
      const result = await db.select().from(projects).where(eq(projects.id, id));
      return result[0];
    },

    async unarchive(id: number): Promise<Project | undefined> {
      const now = new Date().toISOString();
      const result = await db
        .update(projects)
        .set({ archivedAt: null, updatedAt: now })
        .where(eq(projects.id, id))
        .returning();
      return result[0];
    },

    async update(id: number, data: Partial<Omit<NewProject, 'createdAt' | 'id'>>): Promise<Project | undefined> {
      const validatedData = updateProjectSchema.parse(data);
      const now = new Date().toISOString();
      const result = await db
        .update(projects)
        .set({ ...validatedData, updatedAt: now })
        .where(eq(projects.id, id))
        .returning();
      return result[0];
    },
  };
}

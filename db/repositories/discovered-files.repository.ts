import { and, eq, isNotNull, sql } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';
import type { DiscoveredFile, NewDiscoveredFile } from '../schema';

import { discoveredFiles } from '../schema';

export interface DiscoveredFilesRepository {
  create(data: NewDiscoveredFile): DiscoveredFile;
  createMany(data: Array<NewDiscoveredFile>): Array<DiscoveredFile>;
  delete(id: number): boolean;
  exclude(id: number): DiscoveredFile | undefined;
  findAll(options?: { priority?: string; workflowStepId?: number }): Array<DiscoveredFile>;
  findById(id: number): DiscoveredFile | undefined;
  findByWorkflowStepId(workflowStepId: number): Array<DiscoveredFile>;
  findIncluded(workflowStepId: number): Array<DiscoveredFile>;
  include(id: number): DiscoveredFile | undefined;
  markUserAdded(id: number): DiscoveredFile | undefined;
  markUserModified(id: number): DiscoveredFile | undefined;
  update(id: number, data: Partial<NewDiscoveredFile>): DiscoveredFile | undefined;
  updatePriority(id: number, priority: string): DiscoveredFile | undefined;
}

export function createDiscoveredFilesRepository(db: DrizzleDatabase): DiscoveredFilesRepository {
  return {
    create(data: NewDiscoveredFile): DiscoveredFile {
      return db.insert(discoveredFiles).values(data).returning().get();
    },

    createMany(data: Array<NewDiscoveredFile>): Array<DiscoveredFile> {
      if (data.length === 0) {
        return [];
      }
      return db.insert(discoveredFiles).values(data).returning().all();
    },

    delete(id: number): boolean {
      const result = db.delete(discoveredFiles).where(eq(discoveredFiles.id, id)).run();
      return result.changes > 0;
    },

    exclude(id: number): DiscoveredFile | undefined {
      return db
        .update(discoveredFiles)
        .set({
          includedAt: null,
          updatedAt: sql`(CURRENT_TIMESTAMP)`,
        })
        .where(eq(discoveredFiles.id, id))
        .returning()
        .get();
    },

    findAll(options?: { priority?: string; workflowStepId?: number }): Array<DiscoveredFile> {
      const conditions = [];

      if (options?.workflowStepId !== undefined) {
        conditions.push(eq(discoveredFiles.workflowStepId, options.workflowStepId));
      }
      if (options?.priority !== undefined) {
        conditions.push(eq(discoveredFiles.priority, options.priority));
      }

      if (conditions.length === 0) {
        return db.select().from(discoveredFiles).all();
      }

      return db
        .select()
        .from(discoveredFiles)
        .where(and(...conditions))
        .all();
    },

    findById(id: number): DiscoveredFile | undefined {
      return db.select().from(discoveredFiles).where(eq(discoveredFiles.id, id)).get();
    },

    findByWorkflowStepId(workflowStepId: number): Array<DiscoveredFile> {
      return db
        .select()
        .from(discoveredFiles)
        .where(eq(discoveredFiles.workflowStepId, workflowStepId))
        .all();
    },

    findIncluded(workflowStepId: number): Array<DiscoveredFile> {
      return db
        .select()
        .from(discoveredFiles)
        .where(
          and(
            eq(discoveredFiles.workflowStepId, workflowStepId),
            isNotNull(discoveredFiles.includedAt)
          )
        )
        .all();
    },

    include(id: number): DiscoveredFile | undefined {
      return db
        .update(discoveredFiles)
        .set({
          includedAt: sql`(CURRENT_TIMESTAMP)`,
          updatedAt: sql`(CURRENT_TIMESTAMP)`,
        })
        .where(eq(discoveredFiles.id, id))
        .returning()
        .get();
    },

    markUserAdded(id: number): DiscoveredFile | undefined {
      return db
        .update(discoveredFiles)
        .set({
          updatedAt: sql`(CURRENT_TIMESTAMP)`,
          userAddedAt: sql`(CURRENT_TIMESTAMP)`,
        })
        .where(eq(discoveredFiles.id, id))
        .returning()
        .get();
    },

    markUserModified(id: number): DiscoveredFile | undefined {
      return db
        .update(discoveredFiles)
        .set({
          updatedAt: sql`(CURRENT_TIMESTAMP)`,
          userModifiedAt: sql`(CURRENT_TIMESTAMP)`,
        })
        .where(eq(discoveredFiles.id, id))
        .returning()
        .get();
    },

    update(id: number, data: Partial<NewDiscoveredFile>): DiscoveredFile | undefined {
      return db
        .update(discoveredFiles)
        .set({ ...data, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(discoveredFiles.id, id))
        .returning()
        .get();
    },

    updatePriority(id: number, priority: string): DiscoveredFile | undefined {
      return db
        .update(discoveredFiles)
        .set({
          priority,
          updatedAt: sql`(CURRENT_TIMESTAMP)`,
        })
        .where(eq(discoveredFiles.id, id))
        .returning()
        .get();
    },
  };
}

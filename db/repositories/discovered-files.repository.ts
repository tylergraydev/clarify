import { and, eq, inArray, isNotNull, sql } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';
import type { DiscoveredFile, NewDiscoveredFile } from '../schema';

import { discoveredFiles } from '../schema';

export interface DiscoveredFilesRepository {
  clearByWorkflowStep(stepId: number): number;
  create(data: NewDiscoveredFile): DiscoveredFile;
  createMany(data: Array<NewDiscoveredFile>): Array<DiscoveredFile>;
  delete(id: number): boolean;
  deleteMany(ids: Array<number>): number;
  exclude(id: number): DiscoveredFile | undefined;
  findAll(options?: { priority?: string; workflowStepId?: number }): Array<DiscoveredFile>;
  findById(id: number): DiscoveredFile | undefined;
  findByPath(stepId: number, filePath: string): DiscoveredFile | undefined;
  findByWorkflowStepId(workflowStepId: number): Array<DiscoveredFile>;
  findIncluded(workflowStepId: number): Array<DiscoveredFile>;
  include(id: number): DiscoveredFile | undefined;
  markUserAdded(id: number): DiscoveredFile | undefined;
  markUserModified(id: number): DiscoveredFile | undefined;
  toggleInclude(id: number): DiscoveredFile | undefined;
  update(id: number, data: Partial<NewDiscoveredFile>): DiscoveredFile | undefined;
  updatePriority(id: number, priority: string): DiscoveredFile | undefined;
  upsertMany(files: Array<NewDiscoveredFile>): Array<DiscoveredFile>;
}

export function createDiscoveredFilesRepository(db: DrizzleDatabase): DiscoveredFilesRepository {
  return {
    clearByWorkflowStep(stepId: number): number {
      const result = db.delete(discoveredFiles).where(eq(discoveredFiles.workflowStepId, stepId)).run();
      return result.changes;
    },

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

    deleteMany(ids: Array<number>): number {
      if (ids.length === 0) {
        return 0;
      }
      const result = db.delete(discoveredFiles).where(inArray(discoveredFiles.id, ids)).run();
      return result.changes;
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

    findByPath(stepId: number, filePath: string): DiscoveredFile | undefined {
      return db
        .select()
        .from(discoveredFiles)
        .where(and(eq(discoveredFiles.workflowStepId, stepId), eq(discoveredFiles.filePath, filePath)))
        .get();
    },

    findByWorkflowStepId(workflowStepId: number): Array<DiscoveredFile> {
      return db.select().from(discoveredFiles).where(eq(discoveredFiles.workflowStepId, workflowStepId)).all();
    },

    findIncluded(workflowStepId: number): Array<DiscoveredFile> {
      return db
        .select()
        .from(discoveredFiles)
        .where(and(eq(discoveredFiles.workflowStepId, workflowStepId), isNotNull(discoveredFiles.includedAt)))
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

    toggleInclude(id: number): DiscoveredFile | undefined {
      // First get the current record to check its includedAt state
      const current = db.select().from(discoveredFiles).where(eq(discoveredFiles.id, id)).get();
      if (!current) {
        return undefined;
      }

      // Toggle: if includedAt is set, clear it; if null, set it to now
      const now = new Date().toISOString();
      return db
        .update(discoveredFiles)
        .set({
          includedAt: current.includedAt ? null : now,
          updatedAt: now,
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

    upsertMany(files: Array<NewDiscoveredFile>): Array<DiscoveredFile> {
      if (files.length === 0) {
        return [];
      }

      const now = new Date().toISOString();
      const results: Array<DiscoveredFile> = [];

      for (const file of files) {
        // Check if file already exists for this workflow step
        const existing = db
          .select()
          .from(discoveredFiles)
          .where(and(eq(discoveredFiles.workflowStepId, file.workflowStepId), eq(discoveredFiles.filePath, file.filePath)))
          .get();

        if (existing) {
          // Update existing record
          const updated = db
            .update(discoveredFiles)
            .set({
              action: file.action,
              description: file.description,
              originalPriority: file.originalPriority,
              priority: file.priority,
              relevanceExplanation: file.relevanceExplanation,
              role: file.role,
              updatedAt: now,
            })
            .where(eq(discoveredFiles.id, existing.id))
            .returning()
            .get();
          if (updated) {
            results.push(updated);
          }
        } else {
          // Insert new record
          const inserted = db.insert(discoveredFiles).values(file).returning().get();
          results.push(inserted);
        }
      }

      return results;
    },
  };
}

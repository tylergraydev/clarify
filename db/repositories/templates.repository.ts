import { and, eq, isNotNull, isNull, sql } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';
import type { NewTemplate, Template, TemplateCategory } from '../schema';

import { templates } from '../schema';
import { createBaseRepository } from './base.repository';

export interface TemplatesRepository {
  activate(id: number): Template | undefined;
  create(data: NewTemplate): Template;
  deactivate(id: number): Template | undefined;
  delete(id: number): boolean;
  findActive(): Array<Template>;
  findAll(options?: { category?: TemplateCategory; includeDeactivated?: boolean }): Array<Template>;
  findBuiltIn(): Array<Template>;
  findByCategory(category: TemplateCategory): Array<Template>;
  findById(id: number): Template | undefined;
  findByName(name: string): Template | undefined;
  incrementUsageCount(id: number): Template | undefined;
  update(id: number, data: Partial<NewTemplate>): Template | undefined;
}

export function createTemplatesRepository(db: DrizzleDatabase): TemplatesRepository {
  const base = createBaseRepository<typeof templates, Template, NewTemplate>(db, templates);

  return {
    ...base,

    activate(id: number): Template | undefined {
      return db
        .update(templates)
        .set({
          deactivatedAt: null,
          updatedAt: sql`(CURRENT_TIMESTAMP)`,
        })
        .where(eq(templates.id, id))
        .returning()
        .get();
    },

    deactivate(id: number): Template | undefined {
      return db
        .update(templates)
        .set({
          deactivatedAt: sql`(CURRENT_TIMESTAMP)`,
          updatedAt: sql`(CURRENT_TIMESTAMP)`,
        })
        .where(eq(templates.id, id))
        .returning()
        .get();
    },

    findActive(): Array<Template> {
      return db.select().from(templates).where(isNull(templates.deactivatedAt)).all();
    },

    findAll(options?: { category?: TemplateCategory; includeDeactivated?: boolean }): Array<Template> {
      const conditions = [];

      if (options?.category !== undefined) {
        conditions.push(eq(templates.category, options.category));
      }

      if (options?.includeDeactivated !== true) {
        conditions.push(isNull(templates.deactivatedAt));
      }

      if (conditions.length === 0) {
        return db.select().from(templates).all();
      }

      return db
        .select()
        .from(templates)
        .where(and(...conditions))
        .all();
    },

    findBuiltIn(): Array<Template> {
      return db.select().from(templates).where(isNotNull(templates.builtInAt)).all();
    },

    findByCategory(category: TemplateCategory): Array<Template> {
      return db.select().from(templates).where(eq(templates.category, category)).all();
    },

    findByName(name: string): Template | undefined {
      return db.select().from(templates).where(eq(templates.name, name)).get();
    },

    incrementUsageCount(id: number): Template | undefined {
      return db
        .update(templates)
        .set({
          updatedAt: sql`(CURRENT_TIMESTAMP)`,
          usageCount: sql`${templates.usageCount} + 1`,
        })
        .where(eq(templates.id, id))
        .returning()
        .get();
    },
  };
}

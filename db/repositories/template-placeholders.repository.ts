import { eq } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';
import type { NewTemplatePlaceholder, TemplatePlaceholder } from '../schema';

import { templatePlaceholders } from '../schema';
import { createBaseRepository } from './base.repository';

export interface TemplatePlaceholdersRepository {
  create(data: NewTemplatePlaceholder): TemplatePlaceholder;
  createMany(data: Array<NewTemplatePlaceholder>): Array<TemplatePlaceholder>;
  delete(id: number): boolean;
  deleteByTemplateId(templateId: number): number;
  findByTemplateId(templateId: number): Array<TemplatePlaceholder>;
  replaceForTemplate(
    templateId: number,
    placeholders: Array<Omit<NewTemplatePlaceholder, 'templateId'>>
  ): Array<TemplatePlaceholder>;
  update(id: number, data: Partial<Omit<NewTemplatePlaceholder, 'templateId'>>): TemplatePlaceholder | undefined;
}

export function createTemplatePlaceholdersRepository(db: DrizzleDatabase): TemplatePlaceholdersRepository {
  const base = createBaseRepository<typeof templatePlaceholders, TemplatePlaceholder, NewTemplatePlaceholder>(
    db,
    templatePlaceholders
  );

  return {
    ...base,

    createMany(data: Array<NewTemplatePlaceholder>): Array<TemplatePlaceholder> {
      if (data.length === 0) {
        return [];
      }
      return db.insert(templatePlaceholders).values(data).returning().all();
    },

    deleteByTemplateId(templateId: number): number {
      const result = db.delete(templatePlaceholders).where(eq(templatePlaceholders.templateId, templateId)).run();
      return result.changes;
    },

    findByTemplateId(templateId: number): Array<TemplatePlaceholder> {
      return db
        .select()
        .from(templatePlaceholders)
        .where(eq(templatePlaceholders.templateId, templateId))
        .orderBy(templatePlaceholders.orderIndex)
        .all();
    },

    replaceForTemplate(
      templateId: number,
      placeholders: Array<Omit<NewTemplatePlaceholder, 'templateId'>>
    ): Array<TemplatePlaceholder> {
      return db.transaction((tx) => {
        tx.delete(templatePlaceholders).where(eq(templatePlaceholders.templateId, templateId)).run();

        if (placeholders.length === 0) {
          return [];
        }

        const dataWithTemplateId = placeholders.map((p) => ({
          ...p,
          templateId,
        }));

        return tx.insert(templatePlaceholders).values(dataWithTemplateId).returning().all();
      });
    },
  };
}

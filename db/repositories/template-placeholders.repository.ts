import { eq, sql } from "drizzle-orm";

import type { DrizzleDatabase } from "../index";
import type { NewTemplatePlaceholder, TemplatePlaceholder } from "../schema";

import { templatePlaceholders } from "../schema";

export interface TemplatePlaceholdersRepository {
  create(data: NewTemplatePlaceholder): TemplatePlaceholder;
  createMany(data: Array<NewTemplatePlaceholder>): Array<TemplatePlaceholder>;
  delete(id: number): boolean;
  deleteByTemplateId(templateId: number): number;
  findByTemplateId(templateId: number): Array<TemplatePlaceholder>;
  replaceForTemplate(
    templateId: number,
    placeholders: Array<Omit<NewTemplatePlaceholder, "templateId">>
  ): Array<TemplatePlaceholder>;
  update(
    id: number,
    data: Partial<Omit<NewTemplatePlaceholder, "templateId">>
  ): TemplatePlaceholder | undefined;
}

export function createTemplatePlaceholdersRepository(
  db: DrizzleDatabase
): TemplatePlaceholdersRepository {
  return {
    create(data: NewTemplatePlaceholder): TemplatePlaceholder {
      return db.insert(templatePlaceholders).values(data).returning().get();
    },

    createMany(
      data: Array<NewTemplatePlaceholder>
    ): Array<TemplatePlaceholder> {
      if (data.length === 0) {
        return [];
      }
      return db.insert(templatePlaceholders).values(data).returning().all();
    },

    delete(id: number): boolean {
      const result = db
        .delete(templatePlaceholders)
        .where(eq(templatePlaceholders.id, id))
        .run();
      return result.changes > 0;
    },

    deleteByTemplateId(templateId: number): number {
      const result = db
        .delete(templatePlaceholders)
        .where(eq(templatePlaceholders.templateId, templateId))
        .run();
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
      placeholders: Array<Omit<NewTemplatePlaceholder, "templateId">>
    ): Array<TemplatePlaceholder> {
      // Wrap delete and insert in a transaction for atomicity
      // If insert fails after delete, the transaction rolls back preserving existing data
      return db.transaction((tx) => {
        // Delete existing placeholders for this template
        tx.delete(templatePlaceholders)
          .where(eq(templatePlaceholders.templateId, templateId))
          .run();

        // Insert new placeholders if any
        if (placeholders.length === 0) {
          return [];
        }

        const dataWithTemplateId = placeholders.map((p) => ({
          ...p,
          templateId,
        }));

        return tx
          .insert(templatePlaceholders)
          .values(dataWithTemplateId)
          .returning()
          .all();
      });
    },

    update(
      id: number,
      data: Partial<Omit<NewTemplatePlaceholder, "templateId">>
    ): TemplatePlaceholder | undefined {
      return db
        .update(templatePlaceholders)
        .set({ ...data, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(templatePlaceholders.id, id))
        .returning()
        .get();
    },
  };
}

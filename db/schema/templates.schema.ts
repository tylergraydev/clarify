import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const templateCategories = [
  'backend',
  'data',
  'electron',
  'security',
  'ui',
] as const;

export type TemplateCategory = (typeof templateCategories)[number];

export const templates = sqliteTable(
  'templates',
  {
    builtInAt: text('built_in_at'), // null = custom, datetime = bundled
    category: text('category').notNull().$type<TemplateCategory>(),
    createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    deactivatedAt: text('deactivated_at'), // null = active, datetime = deactivated
    description: text('description'),
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull().unique(),
    templateText: text('template_text').notNull(), // Template with {{placeholders}}
    updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    usageCount: integer('usage_count').notNull().default(0),
  },
  (table) => [index('templates_category_idx').on(table.category)]
);

export type NewTemplate = typeof templates.$inferInsert;
export type Template = typeof templates.$inferSelect;

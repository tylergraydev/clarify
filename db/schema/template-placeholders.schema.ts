import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { templates } from './templates.schema';

export const templatePlaceholders = sqliteTable(
  'template_placeholders',
  {
    createdAt: text('created_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    defaultValue: text('default_value'),
    description: text('description'),
    displayName: text('display_name').notNull(), // e.g., 'Entity Name'
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(), // e.g., 'entityName'
    orderIndex: integer('order_index').notNull().default(0),
    requiredAt: text('required_at'), // null = optional, datetime = required
    templateId: integer('template_id')
      .notNull()
      .references(() => templates.id, { onDelete: 'cascade' }),
    updatedAt: text('updated_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    validationPattern: text('validation_pattern'), // Regex
  },
  (table) => [
    index('template_placeholders_template_id_idx').on(table.templateId),
    uniqueIndex('template_placeholders_template_id_name_idx').on(table.templateId, table.name),
  ]
);

export type NewTemplatePlaceholder = typeof templatePlaceholders.$inferInsert;
export type TemplatePlaceholder = typeof templatePlaceholders.$inferSelect;

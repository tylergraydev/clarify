import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const settingCategories = ['workflow', 'worktree', 'logging', 'ui', 'chat'] as const;
export const settingValueTypes = ['string', 'number', 'boolean', 'json'] as const;

export const settings = sqliteTable(
  'settings',
  {
    category: text('category').notNull(),
    createdAt: text('created_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    defaultValue: text('default_value'),
    description: text('description'),
    displayName: text('display_name').notNull(),
    id: integer('id').primaryKey({ autoIncrement: true }),
    key: text('key').notNull().unique(),
    updatedAt: text('updated_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    userModifiedAt: text('user_modified_at'),
    value: text('value').notNull(),
    valueType: text('value_type').notNull().default('string'),
  },
  (table) => [index('settings_category_idx').on(table.category)]
);

export type NewSetting = typeof settings.$inferInsert;
export type Setting = typeof settings.$inferSelect;

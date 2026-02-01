import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const projects = sqliteTable(
  'projects',
  {
    archivedAt: text('archived_at'), // null = active, datetime = archived
    createdAt: text('created_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    description: text('description'),
    id: integer('id').primaryKey({ autoIncrement: true }),
    isFavorite: integer('is_favorite', { mode: 'boolean' }).notNull().default(false),
    name: text('name').notNull(),
    updatedAt: text('updated_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index('projects_archived_at_idx').on(table.archivedAt),
    index('projects_created_at_idx').on(table.createdAt),
    index('projects_is_favorite_idx').on(table.isFavorite),
  ]
);

export type NewProject = typeof projects.$inferInsert;
export type Project = typeof projects.$inferSelect;

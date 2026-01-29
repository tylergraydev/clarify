# Database Schema Conventions

A comprehensive guide for consistent, maintainable database schema design and repository patterns using Drizzle ORM with SQLite.

---

## Tech Stack

- **ORM**: Drizzle ORM
- **Database**: SQLite (via better-sqlite3)
- **Runtime**: Electron main process

---

## File Organization

### Directory Structure

```
db/
  index.ts                    # Database initialization and exports
  schema/
    index.ts                  # Barrel export for all schemas
    users.schema.ts           # One table per file
    projects.schema.ts
    feature-requests.schema.ts
  repositories/
    index.ts                  # Barrel export for all repositories
    users.repository.ts
    projects.repository.ts
    feature-requests.repository.ts
```

### File Naming

- Schema files: `{entity-name}.schema.ts` (kebab-case, singular or plural matching table)
- Repository files: `{entity-name}.repository.ts` (kebab-case, matching schema)
- Always include barrel exports in `index.ts` files

```typescript
// db/schema/index.ts
export * from './users.schema';
export * from './projects.schema';
export * from './feature-requests.schema';

// db/repositories/index.ts
export * from './users.repository';
export * from './projects.repository';
export * from './feature-requests.repository';
```

---

## Schema Definition

### Basic Table Structure

```typescript
import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable(
  'users',
  {
    createdAt: text('created_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    email: text('email').notNull().unique(),
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    updatedAt: text('updated_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [index('users_email_idx').on(table.email), index('users_created_at_idx').on(table.createdAt)]
);

export type NewUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
```

### Required Standard Columns

Every table must include these columns:

```typescript
{
  createdAt: text("created_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  id: integer("id").primaryKey({ autoIncrement: true }),
  updatedAt: text("updated_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
}
```

### Column Order

Define columns in alphabetical order for consistency:

```typescript
{
  content: text("content"),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  description: text("description"),
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  status: text("status").notNull().default("pending"),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
}
```

---

## Naming Conventions

### Table Names

- **Plural, lowercase**: `users`, `projects`, `feature_requests`
- **Use underscores** for multi-word names: `feature_requests`, not `featureRequests`

```typescript
// Correct
export const featureRequests = sqliteTable("feature_requests", { ... });

// Incorrect
export const featureRequest = sqliteTable("featureRequest", { ... });
export const FeatureRequests = sqliteTable("FeatureRequests", { ... });
```

### Column Names

- **Database columns**: `snake_case` in the SQL definition
- **TypeScript properties**: `camelCase` for the object key

```typescript
// Correct - snake_case in SQL, camelCase in TypeScript
{
  createdAt: text("created_at"),
  projectId: integer("project_id"),
  userName: text("user_name"),
}

// Incorrect
{
  created_at: text("created_at"),  // TS key should be camelCase
  projectId: integer("projectId"), // SQL should be snake_case
}
```

### Index Names

Pattern: `{tablename}_{columnname}_idx`

```typescript
(table) => [
  index('users_email_idx').on(table.email),
  index('users_created_at_idx').on(table.createdAt),
  index('feature_requests_project_id_idx').on(table.projectId),
];
```

### Type Names

- **Insert type**: `New{EntityName}` (singular, PascalCase)
- **Select type**: `{EntityName}` (singular, PascalCase)

```typescript
export type NewUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type NewFeatureRequest = typeof featureRequests.$inferInsert;
export type FeatureRequest = typeof featureRequests.$inferSelect;
```

---

## Column Types

### Common Column Patterns

```typescript
// Primary key (always auto-increment integer)
id: integer('id').primaryKey({ autoIncrement: true });

// Required text
name: text('name').notNull();

// Optional text
description: text('description');

// Text with default
status: text('status').notNull().default('pending');

// Unique constraint
email: text('email').notNull().unique();

// Foreign key
projectId: integer('project_id')
  .notNull()
  .references(() => projects.id, { onDelete: 'cascade' });

// Timestamps (always text for SQLite compatibility)
createdAt: text('created_at')
  .default(sql`(CURRENT_TIMESTAMP)`)
  .notNull();

// Boolean (stored as integer in SQLite)
isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true);

// JSON data (stored as text)
metadata: text('metadata', { mode: 'json' }).$type<MetadataType>();
```

### Enum-like Columns

Use text with union types:

```typescript
// In schema
status: text('status').notNull().default('draft');

// In TypeScript types (use the inferred type, or define explicitly if needed)
type Status = 'draft' | 'pending' | 'approved' | 'rejected';
```

---

## Relationships

### Foreign Keys

```typescript
export const featureRequests = sqliteTable(
  'feature_requests',
  {
    // ... other columns
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
  },
  (table) => [index('feature_requests_project_id_idx').on(table.projectId)]
);
```

### On Delete Actions

- **cascade**: Delete child records when parent is deleted
- **set null**: Set foreign key to null (column must be nullable)
- **restrict**: Prevent deletion if children exist (default)

```typescript
// Cascade delete
.references(() => projects.id, { onDelete: "cascade" })

// Set null on delete
.references(() => users.id, { onDelete: "set null" })

// Restrict deletion (explicit)
.references(() => organizations.id, { onDelete: "restrict" })
```

---

## Repository Pattern

### Repository Interface

```typescript
import type { DrizzleDatabase } from '../index';
import type { NewUser, User } from '../schema';

export interface UsersRepository {
  create(data: NewUser): User;
  delete(id: number): boolean;
  getAll(): Array<User>;
  getById(id: number): User | undefined;
  update(id: number, data: Partial<NewUser>): User | undefined;
}
```

### Repository Factory Function

```typescript
import { eq, sql } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';
import type { NewUser, User } from '../schema';

import { users } from '../schema';

export function createUsersRepository(db: DrizzleDatabase): UsersRepository {
  return {
    create(data: NewUser): User {
      return db.insert(users).values(data).returning().get();
    },

    delete(id: number): boolean {
      const result = db.delete(users).where(eq(users.id, id)).run();
      return result.changes > 0;
    },

    getAll(): Array<User> {
      return db.select().from(users).all();
    },

    getById(id: number): User | undefined {
      return db.select().from(users).where(eq(users.id, id)).get();
    },

    update(id: number, data: Partial<NewUser>): User | undefined {
      return db
        .update(users)
        .set({ ...data, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(users.id, id))
        .returning()
        .get();
    },
  };
}
```

### Repository Method Signatures

| Method    | Signature                                                     | Description                          |
| --------- | ------------------------------------------------------------- | ------------------------------------ |
| `create`  | `(data: NewEntity): Entity`                                   | Insert and return the created record |
| `getById` | `(id: number): Entity \| undefined`                           | Find by primary key                  |
| `getAll`  | `(): Array<Entity>`                                           | Return all records                   |
| `update`  | `(id: number, data: Partial<NewEntity>): Entity \| undefined` | Update and return                    |
| `delete`  | `(id: number): boolean`                                       | Delete and return success status     |

### Additional Repository Methods

Add custom methods as needed:

```typescript
export interface UsersRepository {
  // Standard CRUD
  create(data: NewUser): User;
  delete(id: number): boolean;
  getAll(): Array<User>;
  getById(id: number): User | undefined;
  update(id: number, data: Partial<NewUser>): User | undefined;

  // Custom queries
  getByEmail(email: string): User | undefined;
  getByStatus(status: string): Array<User>;
  countByProject(projectId: number): number;
}
```

---

## Timestamp Handling

### Auto-Update on Modification

Always update `updatedAt` in repository update methods:

```typescript
update(id: number, data: Partial<NewUser>): User | undefined {
  return db
    .update(users)
    .set({ ...data, updatedAt: sql`(CURRENT_TIMESTAMP)` })
    .where(eq(users.id, id))
    .returning()
    .get();
}
```

### Timestamp Format

SQLite stores timestamps as TEXT in ISO 8601 format via `CURRENT_TIMESTAMP`.

---

## Migrations

### Generate Migrations

```bash
pnpm db:generate
```

### Run Migrations

```bash
pnpm db:migrate
```

### Migration Best Practices

- Generate a new migration after any schema change
- Review generated SQL before applying
- Test migrations on development database first
- Never modify existing migrations that have been applied

---

## Query Patterns

### Select Queries

```typescript
// Get all
db.select().from(users).all();

// Get single
db.select().from(users).where(eq(users.id, id)).get();

// With conditions
db.select()
  .from(users)
  .where(and(eq(users.status, 'active'), gt(users.createdAt, date)))
  .all();
```

### Insert Queries

```typescript
// Single insert with return
db.insert(users).values(data).returning().get();

// Multiple insert
db.insert(users).values([data1, data2]).returning().all();
```

### Update Queries

```typescript
// Update with return
db.update(users)
  .set({ ...data, updatedAt: sql`(CURRENT_TIMESTAMP)` })
  .where(eq(users.id, id))
  .returning()
  .get();
```

### Delete Queries

```typescript
// Delete and check affected rows
const result = db.delete(users).where(eq(users.id, id)).run();
const wasDeleted = result.changes > 0;
```

---

## Essential Rules Summary

1. **File Organization**: One table per schema file, matching repository file
2. **Standard Columns**: Always include `id`, `createdAt`, `updatedAt`
3. **Column Naming**: `snake_case` in SQL, `camelCase` in TypeScript
4. **Table Naming**: Plural, lowercase with underscores
5. **Index Naming**: `{tablename}_{columnname}_idx`
6. **Type Exports**: `NewEntity` for insert, `Entity` for select
7. **Repository Pattern**: Interface + factory function with standard CRUD
8. **Auto-Update Timestamps**: Always set `updatedAt` in update operations
9. **Barrel Exports**: Use `index.ts` files for clean imports
10. **Foreign Keys**: Enable constraints and define cascade behavior

---

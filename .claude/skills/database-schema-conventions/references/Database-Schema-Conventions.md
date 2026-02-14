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
export * from "./users.schema";
export * from "./projects.schema";
export * from "./feature-requests.schema";

// db/repositories/index.ts
export * from "./users.repository";
export * from "./projects.repository";
export * from "./feature-requests.repository";
```

---

## Schema Definition

### Basic Table Structure

```typescript
import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    email: text("email").notNull().unique(),
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index("users_email_idx").on(table.email),
    index("users_created_at_idx").on(table.createdAt),
  ]
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
  index("users_email_idx").on(table.email),
  index("users_created_at_idx").on(table.createdAt),
  index("feature_requests_project_id_idx").on(table.projectId),
];
```

### Type Names

- **Insert type**: `New{EntityName}` (singular, PascalCase)
- **Select type**: `{EntityName}` (singular, PascalCase)
- **Export order**: Follow ESLint perfectionist alphabetical ordering (e.g., `Agent` before `NewAgent`)

```typescript
// Types exported in alphabetical order per ESLint perfectionist
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type FeatureRequest = typeof featureRequests.$inferSelect;
export type NewFeatureRequest = typeof featureRequests.$inferInsert;
```

---

## Column Types

### Common Column Patterns

```typescript
// Primary key (always auto-increment integer)
id: integer("id").primaryKey({ autoIncrement: true });

// Required text
name: text("name").notNull();

// Optional text
description: text("description");

// Text with default
status: text("status").notNull().default("pending");

// Unique constraint
email: text("email").notNull().unique();

// Foreign key
projectId: integer("project_id")
  .notNull()
  .references(() => projects.id, { onDelete: "cascade" });

// Timestamps (always text for SQLite compatibility)
createdAt: text("created_at")
  .default(sql`(CURRENT_TIMESTAMP)`)
  .notNull();

// Boolean (stored as integer in SQLite)
isActive: integer("is_active", { mode: "boolean" }).notNull().default(true);

// JSON data (stored as text)
metadata: text("metadata", { mode: "json" }).$type<MetadataType>();
```

### Enum-like Columns

Use text with union types:

```typescript
// In schema
status: text("status").notNull().default("draft");

// In TypeScript types (use the inferred type, or define explicitly if needed)
type Status = "draft" | "pending" | "approved" | "rejected";
```

---

## Relationships

### Foreign Keys

```typescript
export const featureRequests = sqliteTable(
  "feature_requests",
  {
    // ... other columns
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
  },
  (table) => [index("feature_requests_project_id_idx").on(table.projectId)]
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

**ALL repository methods MUST be async** and return `Promise<T>`:

```typescript
import type { DrizzleDatabase } from "../index";
import type { NewUser, User } from "../schema";

export interface UsersRepository {
  create(data: NewUser): Promise<User>;
  delete(id: number): Promise<boolean>;
  findAll(): Promise<Array<User>>;
  findById(id: number): Promise<User | undefined>;
  update(id: number, data: Partial<NewUser>): Promise<User | undefined>;
}
```

### Return Type Convention

**Use `T | undefined` ordering** (success case first):

```typescript
// ✅ Correct
Promise<User | undefined>
Promise<Array<User>>

// ❌ Incorrect
Promise<undefined | User>
```

### Repository Factory Function

**ALL repositories MUST validate input with Zod**:

```typescript
import { eq } from "drizzle-orm";

import type { DrizzleDatabase } from "../index";
import type { NewUser, User } from "../schema";

import { users } from "../schema";
import { createUserSchema, updateUserSchema } from "@/lib/validations/user";

export function createUsersRepository(db: DrizzleDatabase): UsersRepository {
  return {
    async create(data: NewUser): Promise<User> {
      // REQUIRED: Validate before insert
      const validated = createUserSchema.parse(data);
      return db.insert(users).values(validated).returning().get();
    },

    async delete(id: number): Promise<boolean> {
      const result = db.delete(users).where(eq(users.id, id)).run();
      return result.changes > 0;
    },

    async findAll(): Promise<Array<User>> {
      return db.select().from(users).all();
    },

    async findById(id: number): Promise<User | undefined> {
      return db.select().from(users).where(eq(users.id, id)).get();
    },

    async update(id: number, data: Partial<NewUser>): Promise<User | undefined> {
      // REQUIRED: Validate partial data
      const validated = updateUserSchema.partial().parse(data);
      const now = new Date().toISOString();

      return db
        .update(users)
        .set({ ...validated, updatedAt: now })
        .where(eq(users.id, id))
        .returning()
        .get();
    },
  };
}
```

### Repository Method Signatures

| Method     | Signature                                                               | Description                          |
| ---------- | ----------------------------------------------------------------------- | ------------------------------------ |
| `create`   | `(data: NewEntity): Promise<Entity>`                                    | Insert and return the created record |
| `findById` | `(id: number): Promise<Entity \| undefined>`                            | Find by primary key                  |
| `findAll`  | `(options?): Promise<Array<Entity>>`                                    | Return all records with optional filters |
| `update`   | `(id: number, data: Partial<NewEntity>): Promise<Entity \| undefined>`  | Update and return                    |
| `delete`   | `(id: number): Promise<boolean>`                                        | Delete and return success status     |

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

**Use JavaScript `toISOString()`** for all timestamp updates in repositories:

```typescript
async update(id: number, data: Partial<NewUser>): Promise<User | undefined> {
  const now = new Date().toISOString();

  return db
    .update(users)
    .set({ ...data, updatedAt: now })
    .where(eq(users.id, id))
    .returning()
    .get();
}
```

```typescript
// ✅ Correct: JavaScript timestamp
const now = new Date().toISOString();
db.update(users).set({ updatedAt: now }).where(...);

// ❌ Incorrect: SQL timestamp in updates
db.update(users).set({ updatedAt: sql`(CURRENT_TIMESTAMP)` }).where(...);
```

**Note**: SQL `CURRENT_TIMESTAMP` is used for schema defaults (createdAt), but JavaScript `toISOString()` is used for explicit updates to ensure consistency and testability.

### Timestamp Format

SQLite stores timestamps as TEXT in ISO 8601 format (e.g., `2024-01-15T10:30:00.000Z`).

---

## Migrations

### Generate Migrations

```bash
bun db:generate
```

### Run Migrations

```bash
bun db:migrate
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
  .where(and(eq(users.status, "active"), gt(users.createdAt, date)))
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
6. **Type Exports**: `NewEntity` for insert, `Entity` for select (alphabetical order per ESLint)
7. **Async Methods**: ALL repository methods MUST be async (return `Promise<T>`)
8. **Zod Validation**: ALL repositories MUST validate input with Zod schemas
9. **Timestamps**: Use JavaScript `toISOString()` for updates, SQL for defaults
10. **Return Types**: Use `T | undefined` ordering (success case first)
11. **Barrel Exports**: Use `index.ts` files for clean imports
12. **Foreign Keys**: Enable constraints and define cascade behavior

---

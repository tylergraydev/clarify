---
name: database-schema-conventions
description: Enforces project database schema conventions automatically when creating or modifying database schemas, repositories, or related code. This skill should be used proactively whenever working with Drizzle ORM, SQLite schemas, or repository patterns to ensure consistent database design across the codebase.
---

# Database Schema Conventions Enforcer

## Purpose

This skill enforces the project database schema conventions automatically during database-related development.
It ensures consistent schema design, repository patterns, and adherence to project-specific standards for
all Drizzle ORM and SQLite work.

## When to Use This Skill

Use this skill proactively in the following scenarios:

- Creating new database tables or schemas
- Modifying existing schema files (`.schema.ts`)
- Creating or updating repositories (`.repository.ts`)
- Adding migrations or database-related code
- Working with Drizzle ORM queries
- Any task involving `db/` directory changes

## How to Use This Skill

### 1. Load Conventions Reference

Before creating or modifying any database schema or repository, load the complete conventions document:

```
Read references/Database-Schema-Conventions.md
```

This reference contains the authoritative standards including:

- File organization patterns
- Schema definition patterns
- Column naming conventions
- Type export patterns
- Index naming conventions
- Repository interface patterns
- Timestamp handling
- Migration best practices

### 2. Apply Conventions During Development

When writing database code, ensure strict adherence to all conventions:

**File Organization**:

- Schema files in `db/schema/` with `.schema.ts` suffix: `users.schema.ts`
- Repository files in `db/repositories/` with `.repository.ts` suffix: `users.repository.ts`
- Barrel exports via `index.ts` files
- One table per schema file

**Schema Definition**:

- Use `sqliteTable` from `drizzle-orm/sqlite-core`
- Table names are plural, lowercase: `users`, `projects`, `feature_requests`
- Always include `id`, `createdAt`, `updatedAt` columns
- Export inferred types: `NewEntity` (insert) and `Entity` (select)

**Column Naming**:

- Database columns use `snake_case`: `created_at`, `user_id`
- TypeScript properties use `camelCase`: `createdAt`, `userId`
- Map with the second parameter: `text("column_name")`

**Index Naming**:

- Pattern: `tablename_columnname_idx`
- Examples: `users_email_idx`, `projects_created_at_idx`

**Repository Pattern**:

- Export interface: `EntityNameRepository`
- Export factory function: `createEntityNameRepository(db: DrizzleDatabase)`
- Standard CRUD methods: `create`, `getById`, `getAll`, `update`, `delete`
- Auto-update `updatedAt` timestamp in update operations

### 3. Automatic Convention Enforcement

After generating or modifying database code, immediately perform automatic validation and correction:

1. **Scan for violations**: Review the generated code against all conventions from the reference document
2. **Identify issues**: Create a mental checklist of any violations found:
   - File naming and location
   - Table/column naming conventions
   - Missing standard columns (id, createdAt, updatedAt)
   - Type export patterns
   - Index naming
   - Repository interface structure
   - Missing barrel exports

3. **Fix automatically**: Apply corrections immediately without asking for permission:
   - Rename files to follow conventions
   - Fix column names to use snake_case
   - Add missing timestamp columns
   - Export proper inferred types
   - Correct index naming
   - Update repository patterns
   - Add barrel exports

4. **Verify completeness**: Ensure all conventions are satisfied before presenting code to user

### 4. Reporting

After automatically fixing violations, provide a brief summary:

```
Database conventions enforced:
  - Added missing updatedAt column
  - Renamed column userId to user_id in schema
  - Added index: feature_requests_project_id_idx
  - Exported NewFeatureRequest and FeatureRequest types
  - Updated repository to auto-set updatedAt on updates
```

**Do not ask for permission to apply fixes** - the skill's purpose is automatic enforcement.

## Convention Categories

The complete conventions are detailed in `references/Database-Schema-Conventions.md`. Key categories include:

1. **File Organization** - Directory structure, file naming, barrel exports
2. **Schema Definition** - Table creation, column definitions, constraints
3. **Naming Conventions** - Tables, columns, indexes, types
4. **Type Exports** - Inferred types for insert and select operations
5. **Repository Pattern** - Interface design, factory functions, CRUD methods
6. **Timestamps** - Standard timestamp columns and auto-update behavior
7. **Relationships** - Foreign keys and referential integrity
8. **Migrations** - Generation and execution patterns

## Important Notes

- **Automatic enforcement**: Apply fixes immediately without requesting permission
- **No compromises**: All conventions must be followed strictly
- **Reference first**: Always load the conventions reference before working with database code
- **Complete validation**: Check all aspects of the conventions, not just obvious violations
- **Proactive application**: Use this skill automatically when database work is detected, even if user doesn't mention conventions

## Workflow Summary

```
1. Detect database work (create/modify schema, repository, or db/ files)
2. Load references/Database-Schema-Conventions.md
3. Generate or modify database code following all conventions
4. Scan generated code for any violations
5. Automatically fix all violations found
6. Present corrected code to user with brief summary of fixes applied
```

This workflow ensures every database schema and repository in the project maintains consistent, high-quality patterns that follow all established conventions.

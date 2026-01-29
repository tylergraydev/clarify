---
name: tanstack-query-conventions
description: Enforces project TanStack Query (React Query) conventions automatically when creating or modifying query hooks, query keys, mutations, or data fetching logic. This skill should be used proactively whenever working with data fetching, caching, or server state management to ensure consistent patterns across the codebase.
---

# TanStack Query Conventions Enforcer

## Purpose

This skill enforces the project TanStack Query conventions automatically during data fetching and state management development. It ensures consistent query key management, hook patterns, and adherence to project-specific standards for all React Query work.

## When to Use This Skill

Use this skill proactively in the following scenarios:

- Creating new query or mutation hooks
- Adding query key definitions
- Implementing data prefetching
- Setting up cache invalidation logic
- Working with files in `hooks/queries/` or `lib/queries/`
- Any task involving `@tanstack/react-query` usage

**Important**: This skill should activate automatically without explicit user request whenever TanStack Query work is detected.

## How to Use This Skill

### 1. Load Conventions Reference

Before creating or modifying any TanStack Query code, load the complete conventions document:

```
Read references/TanStack-Query-Conventions.md
```

This reference contains the authoritative standards including:

- Query key factory patterns with `@lukemorales/query-key-factory`
- Query hook structure and naming conventions
- Mutation hook patterns with cache invalidation
- Prefetching strategies
- Electron IPC integration patterns
- Provider configuration

### 2. Apply Conventions During Development

When writing TanStack Query code, ensure strict adherence to all conventions:

**Query Key Organization**:

- Query keys defined in `lib/queries/{entity}.ts` using `createQueryKeys`
- Merged keys exported from `lib/queries/index.ts`
- Use `_def` for base key invalidation patterns

**Query Hooks**:

- Query hooks in `hooks/queries/use-{entity}.ts`
- Use `useElectronDb` hook for IPC access
- Always include `enabled: isElectron` condition
- Spread query key definition: `...entityKeys.detail(id)`

**Mutation Hooks**:

- Co-locate mutations with queries in same file
- Always invalidate relevant queries on success
- Use `void` prefix for invalidation promises
- Set query data directly when beneficial

**Naming Conventions**:

- Query hooks: `use{Entity}`, `use{Entities}`
- Mutation hooks: `useCreate{Entity}`, `useUpdate{Entity}`, `useDelete{Entity}`
- Query key files: `{entity}.ts` (kebab-case for multi-word)

### 3. Automatic Convention Enforcement

After generating or modifying TanStack Query code, immediately perform automatic validation and correction:

1. **Scan for violations**: Review the generated code against all conventions from the reference document
2. **Identify issues**: Create a mental checklist of any violations found:
   - Query key factory usage
   - Hook naming patterns
   - Missing `enabled` conditions
   - Cache invalidation patterns
   - File organization
   - Type inference patterns

3. **Fix automatically**: Apply corrections immediately without asking for permission:
   - Move query keys to proper location
   - Fix hook naming to follow conventions
   - Add missing `isElectron` checks
   - Correct invalidation patterns
   - Update barrel exports

4. **Verify completeness**: Ensure all conventions are satisfied before presenting code to user

### 4. Reporting

After automatically fixing violations, provide a brief summary:

```
TanStack Query conventions enforced:
  - Created query keys using createQueryKeys factory
  - Added enabled: isElectron condition to query
  - Fixed cache invalidation to use _def pattern
  - Renamed hook from useGetProjects to useProjects
```

**Do not ask for permission to apply fixes** - the skill's purpose is automatic enforcement.

## Convention Categories

The complete conventions are detailed in `references/TanStack-Query-Conventions.md`. Key categories include:

1. **Query Key Management** - Factory pattern, key structure, merging
2. **Query Hooks** - Structure, naming, Electron integration
3. **Mutation Hooks** - Cache invalidation, optimistic updates
4. **Prefetching** - Layout-level prefetching patterns
5. **Provider Configuration** - Client setup, default options
6. **Type Safety** - Inferred types, parameter typing
7. **File Organization** - Directory structure, barrel exports

## Important Notes

- **Automatic enforcement**: Apply fixes immediately without requesting permission
- **No compromises**: All conventions must be followed strictly
- **Reference first**: Always load the conventions reference before working with TanStack Query code
- **Complete validation**: Check all aspects of the conventions, not just obvious violations
- **Proactive application**: Use this skill automatically when TanStack Query work is detected, even if user doesn't mention conventions

## Workflow Summary

```
1. Detect TanStack Query work (queries, mutations, prefetching)
2. Load references/TanStack-Query-Conventions.md
3. Generate or modify code following all conventions
4. Scan generated code for any violations
5. Automatically fix all violations found
6. Present corrected code to user with brief summary of fixes applied
```

This workflow ensures every TanStack Query implementation in the project maintains consistent, high-quality patterns that follow all established conventions.

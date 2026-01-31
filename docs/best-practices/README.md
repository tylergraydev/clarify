# Clarify Best Practices

This directory contains codified best practices for the Clarify codebase. These conventions are enforced by the automated refactoring system and corresponding skills/agents.

## Document Index

| Document | Description | Related Skill |
|----------|-------------|---------------|
| [frontend-components.md](./frontend-components.md) | React components, Base UI, CVA patterns | `component-conventions` |
| [database-backend.md](./database-backend.md) | Drizzle schemas, repositories, data access | `database-schema-conventions` |
| [electron-ipc.md](./electron-ipc.md) | IPC channels, handlers, preload, type safety | `ipc-handler-conventions` |
| [nextjs-routing.md](./nextjs-routing.md) | App Router, route types, page patterns | (new skill needed) |
| [hooks-state.md](./hooks-state.md) | TanStack Query, Zustand, custom hooks | `tanstack-query-conventions`, `zustand-state-management` |
| [forms-validation.md](./forms-validation.md) | TanStack Form, Zod validation, field components | `tanstack-form-conventions` |

## Key Decisions Summary

These decisions were made to establish consistency across the codebase:

### General Principles
- **Error Strategy**: Throw errors (let error boundaries handle display)
- **JSDoc**: Required on all exported public APIs
- **Helper Functions**: Keep in component file if single-use
- **Toast Notifications**: Handled in mutation hooks, not components

### Type Conventions
- **Return Types**: Use `T | undefined` (success case first)
- **Props Typing**: Use `ComponentPropsWithRef<typeof Base> & VariantProps<typeof cva>`
- **Size Variants**: Standard scale only: `sm | default | lg`

### Async Conventions
- **Repositories**: All methods are async (return `Promise<T>`)
- **IPC Handlers**: All handlers declared async
- **Timestamps**: Use JavaScript `new Date().toISOString()`

### Validation
- **Repository Validation**: Zod validation required in all repositories
- **Route Validation**: All pages with params need `route-type.ts`
- **Error Messages**: Descriptive action style ("Enter a valid email address")

## Refactoring System

The automated refactoring system uses these conventions to:
1. **Report** violations found in a route/feature area
2. **Fix** violations using domain-specific specialist agents
3. **Review** fixes (maximum 2 cycles before manual intervention)

Agents run in parallel by domain for efficiency:
- Frontend agent handles components
- Backend agent handles database/repositories
- IPC agent handles Electron communication
- etc.

Reports are generated as markdown files (no database tracking).

## Adding New Conventions

When adding new conventions:
1. Document in the appropriate domain file
2. Create or update the corresponding skill in `.claude/skills/`
3. Update the refactoring agent routing table
4. Add to the relevant specialist agent's knowledge

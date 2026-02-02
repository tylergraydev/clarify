# Available Agents Reference

This file is the single source of truth for all specialist subagents in Clarify.
Reference this file with `@.claude/available-agents.md` in other documentation.

## Specialist Subagents

| Agent                           | Domain              | When to Use                                                         |
| ------------------------------- | ------------------- | ------------------------------------------------------------------- |
| `claude-agent-sdk`              | Claude Agent SDK    | Integrating Claude Agent SDK libraries - services, event handlers, hooks, types |
| `database-schema`               | Drizzle ORM schemas | Creating/modifying database tables, repositories, and migrations    |
| `tanstack-query`                | Data fetching       | Creating query hooks, mutations, cache invalidation                 |
| `tanstack-form`                 | Form implementation | Building forms with validation and field components                 |
| `tanstack-form-base-components` | Form primitives     | Creating new base field components in `components/ui/form/`         |
| `tanstack-table`                | Data tables         | Building tables with pagination, sorting, filtering, virtualization |
| `frontend-component`            | React components    | Creating UI components using Base UI + CVA patterns                 |
| `ipc-handler`                   | Electron IPC        | Creating IPC channels, handlers, preload scripts, and React hooks   |
| `page-route`                    | Next.js routing     | Creating pages, layouts, loading states, error boundaries           |
| `zustand-store`                 | Client state        | Creating Zustand stores with TypeScript, persist, devtools          |
| `vercel-react-best-practices`   | Performance         | Optimizing React/Next.js code for performance                       |
| `clarification-agent`           | Feature clarity     | Assessing and clarifying ambiguous feature requests                 |
| `file-discovery-agent`          | Codebase analysis   | Identifying all files relevant to a feature                         |
| `implementation-planner`        | Plan generation     | Creating detailed implementation plans with quality gates           |
| `general-purpose`               | Everything else     | Utilities, non-component code, misc files                           |

## File Pattern Routing

Use this matrix to route files to the correct specialist agent.

| File Pattern                               | Specialist Agent                | Skills Loaded                                           |
| ------------------------------------------ | ------------------------------- | ------------------------------------------------------- |
| `*sdk*.ts` in `electron/services/`         | `claude-agent-sdk`              | claude-agent-sdk                                        |
| `*agent*.ts` in `electron/services/`       | `claude-agent-sdk`              | claude-agent-sdk                                        |
| `types/agent-sdk.d.ts`                     | `claude-agent-sdk`              | claude-agent-sdk                                        |
| `*.schema.ts` in `db/schema/`              | `database-schema`               | database-schema-conventions                             |
| `*.repository.ts` in `db/repositories/`    | `database-schema`               | database-schema-conventions                             |
| `use-*.ts` in `hooks/queries/`             | `tanstack-query`                | tanstack-query-conventions                              |
| `*.ts` in `lib/queries/`                   | `tanstack-query`                | tanstack-query-conventions                              |
| `*.ts` in `lib/validations/`               | `tanstack-form`                 | tanstack-form-conventions                               |
| `*-field.tsx` in `components/ui/form/`     | `tanstack-form-base-components` | tanstack-form-base-components, react-coding-conventions |
| `*.tsx` in `components/ui/`                | `frontend-component`            | component-conventions, react-coding-conventions         |
| `*.tsx` in `components/*/`                 | `frontend-component`            | component-conventions, react-coding-conventions         |
| `page.tsx`, `layout.tsx` in `app/`         | `page-route`                    | nextjs-routing-conventions, react-coding-conventions    |
| `*.ipc.ts` in `electron/ipc/`              | `ipc-handler`                   | ipc-handler-conventions                                 |
| `*-store.ts` in `lib/stores/`              | `zustand-store`                 | zustand-state-management                                |
| `*-table.tsx` or table components          | `tanstack-table`                | tanstack-table, component-conventions                   |

## Step-Type Detection Rules

For automated routing in implementation plans:

```
1. IF step involves Claude Agent SDK integration (services, event handlers, hooks, types) → claude-agent-sdk
2. IF files contain "db/schema/" AND end with ".schema.ts" → database-schema
3. IF files contain "db/repositories/" → database-schema
4. IF files contain "electron/ipc/" OR "electron/preload.ts" OR step involves IPC handlers → ipc-handler
5. IF files involve TanStack Query hooks/mutations → tanstack-query
6. IF step involves data tables with useReactTable, pagination, sorting, or filtering → tanstack-table
7. IF files contain "components/ui/form/" (base field components) → tanstack-form-base-components
8. IF step involves creating/modifying forms OR files contain "lib/validations/" → tanstack-form
9. IF step involves performance optimization, bundle size, waterfall fixes, or re-render optimization → vercel-react-best-practices
10. IF files contain "lib/stores/" OR step involves Zustand store creation → zustand-store
11. IF files contain "app/(app)/" AND (end with "page.tsx" OR "layout.tsx" OR "loading.tsx" OR "error.tsx" OR "route-type.ts") → page-route
12. IF files contain "components/ui/" (non-form) OR "components/features/" → frontend-component
13. ELSE → general-purpose
```

## Domain Classification

For route/feature audits:

| Domain       | File Patterns                                                                   | Specialist Agent   | Skills                                                                |
| ------------ | ------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------- |
| `claude-sdk` | `electron/services/*sdk*.ts`, `electron/services/*agent*.ts`, `types/agent-sdk.d.ts` | `claude-agent-sdk` | claude-agent-sdk                                                      |
| `frontend`   | `app/**/*.tsx`, `components/**/*.tsx`                                           | `frontend-component` | component-conventions, react-coding-conventions, nextjs-routing-conventions |
| `backend`    | `db/schema/*.ts`, `db/repositories/*.ts`                                        | `database-schema`  | database-schema-conventions                                           |
| `ipc`        | `electron/ipc/*.ts`, `preload.ts`, `types/electron.d.ts`                        | `ipc-handler`      | ipc-handler-conventions                                               |
| `hooks`      | `hooks/**/*.ts`, `lib/queries/*.ts`                                             | `tanstack-query`   | tanstack-query-conventions                                            |
| `forms`      | `lib/validations/*.ts`                                                          | `tanstack-form`    | tanstack-form-conventions                                             |
| `stores`     | `lib/stores/*.ts`                                                               | `zustand-store`    | zustand-state-management                                              |

## Skills Reference

| Skill                           | Purpose                                                    |
| ------------------------------- | ---------------------------------------------------------- |
| `claude-agent-sdk`              | Claude Agent SDK implementation patterns and conventions   |
| `database-schema-conventions`   | Drizzle schema patterns, repository conventions            |
| `tanstack-query-conventions`    | Query key factories, mutation patterns, cache invalidation |
| `tanstack-form-conventions`     | Form structure, field components, validation patterns      |
| `tanstack-form-base-components` | Base field component creation conventions                  |
| `tanstack-table`                | Table implementation with server-side patterns             |
| `component-conventions`         | Base UI + CVA component patterns                           |
| `ipc-handler-conventions`       | Electron IPC channel and handler patterns                  |
| `nextjs-routing-conventions`    | App Router page and layout patterns                        |
| `react-coding-conventions`      | React component and TypeScript patterns                    |
| `zustand-state-management`      | Zustand store patterns with middleware                     |
| `vercel-react-best-practices`   | React/Next.js performance optimization                     |
| `next-best-practices`           | Next.js file conventions and patterns                      |
| `accessibility-a11y`            | WCAG accessibility guidelines                              |
| `claude-code-frontmatter`       | Skill and subagent YAML frontmatter reference              |

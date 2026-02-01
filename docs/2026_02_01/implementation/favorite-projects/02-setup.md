# Implementation Setup and Routing Table

**Feature**: Favorite Projects
**Date**: 2026-02-01

## Routing Table

| Step | Title | Specialist Agent | Files |
|------|-------|------------------|-------|
| 1 | Extend database schema and repository | `database-schema` | db/schema/projects.schema.ts, db/repositories/projects.repository.ts |
| 2 | Generate database migration | `database-schema` | drizzle/[generated].sql |
| 3 | Add IPC channel definitions and handlers | `ipc-handler` | electron/ipc/channels.ts, electron/preload.ts, electron/ipc/project.handlers.ts |
| 4 | Update type definitions and electron hook | `general-purpose` | types/electron.d.ts, hooks/use-electron.ts |
| 5 | Add TanStack Query hooks for favorites | `tanstack-query` | lib/queries/projects.ts, hooks/queries/use-projects.ts |
| 6 | Add Star icon column to projects table | `frontend-component` | components/projects/project-table.tsx |
| 7 | Wire up toggle in projects page | `page-route` | app/(app)/projects/page.tsx |
| 8 | Add favorites section to sidebar | `frontend-component` | components/shell/app-sidebar.tsx |
| 9 | Create favorites dashboard widget | `frontend-component` | components/dashboard/favorites-widget.tsx, app/(app)/dashboard/page.tsx |
| 10 | Export widget and final integration | `general-purpose` | components/dashboard/index.ts (if exists) |

## Execution Order

Steps will be executed sequentially as there are dependencies:
1. Database layer (Steps 1-2) - Foundation
2. IPC layer (Steps 3-4) - Bridge to frontend
3. Query layer (Step 5) - Data fetching
4. UI layer (Steps 6-10) - User interface

## Quality Gate Checkpoints

- After Step 2: Database migration generated and applied
- After Step 4: Electron compiles successfully
- After Step 5: Query hooks typed correctly
- After Step 10: Full lint and typecheck pass

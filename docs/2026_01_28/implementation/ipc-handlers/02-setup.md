# Routing Table and Step Assignments

## Specialist Agent Routing Table

| Step | Title | Specialist | Files |
|------|-------|------------|-------|
| 1 | Create IPC Channel Constants | ipc-handler | `electron/ipc/channels.ts` |
| 2 | Create Central Handler Registration Index | ipc-handler | `electron/ipc/index.ts` |
| 3 | Implement Workflow IPC Handlers | ipc-handler | `electron/ipc/workflows.handlers.ts` |
| 4 | Implement Workflow Steps IPC Handlers | ipc-handler | `electron/ipc/steps.handlers.ts` |
| 5 | Implement Discovery Files IPC Handlers | ipc-handler | `electron/ipc/discovery.handlers.ts` |
| 6 | Implement Agents IPC Handlers | ipc-handler | `electron/ipc/agents.handlers.ts` |
| 7 | Implement Templates IPC Handlers | ipc-handler | `electron/ipc/templates.handlers.ts` |
| 8 | Implement Projects IPC Handlers | ipc-handler | `electron/ipc/projects.handlers.ts` |
| 9 | Implement Repositories IPC Handlers | ipc-handler | `electron/ipc/repositories.handlers.ts` |
| 10 | Implement Audit IPC Handlers | ipc-handler | `electron/ipc/audit.handlers.ts` |
| 11 | Refactor main.ts to Use Centralized Handlers | ipc-handler | `electron/main.ts` |
| 12 | Extend ElectronAPI Interface in Preload | ipc-handler | `electron/preload.ts` |
| 13 | Update types/electron.d.ts with Full API Types | ipc-handler | `types/electron.d.ts` |
| 14 | Create Query Key Definitions | tanstack-query | `lib/queries/*.ts` |
| 15 | Create TanStack Query Hooks for Workflows | tanstack-query | `hooks/queries/use-workflows.ts` |
| 16 | Create TanStack Query Hooks for Steps | tanstack-query | `hooks/queries/use-steps.ts` |
| 17 | Create TanStack Query Hooks for Agents and Templates | tanstack-query | `hooks/queries/use-agents.ts`, `hooks/queries/use-templates.ts` |
| 18 | Create TanStack Query Hooks for Projects and Repositories | tanstack-query | `hooks/queries/use-projects.ts`, `hooks/queries/use-repositories.ts` |
| 19 | Create TanStack Query Hooks for Audit and Discovery | tanstack-query | `hooks/queries/use-audit-logs.ts`, `hooks/queries/use-discovered-files.ts` |
| 20 | Extend use-electron.ts with Domain-Specific Hooks | general-purpose | `hooks/use-electron.ts` |
| 21 | Create Query Hooks Index Export | tanstack-query | `hooks/queries/index.ts` |
| 22 | Move Existing Handlers to Separate Files | ipc-handler | `electron/ipc/fs.handlers.ts`, `electron/ipc/dialog.handlers.ts`, `electron/ipc/store.handlers.ts`, `electron/ipc/app.handlers.ts` |
| 23 | Integration Testing and Final Validation | general-purpose | N/A (validation only) |

## Specialist Summary
- **ipc-handler**: Steps 1-13, 22 (14 steps)
- **tanstack-query**: Steps 14-19, 21 (7 steps)
- **general-purpose**: Steps 20, 23 (2 steps)

## Execution Order
Steps will be executed in order 1-23 as defined in the plan.

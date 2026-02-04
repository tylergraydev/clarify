# Setup and Routing Table

**Phase**: 2 - Setup and Routing Table

## Routing Table

| Step | Title | Specialist Agent | Files |
|------|-------|------------------|-------|
| 1 | Extend Database Schema for Discovery | `database-schema` | `db/schema/discovered-files.schema.ts` |
| 2 | Extend Repository for Re-Discovery and Bulk Operations | `database-schema` | `db/repositories/discovered-files.repository.ts` |
| 3 | Create Discovery Streaming Types and Service | `claude-agent-sdk` | `electron/services/file-discovery.service.ts` (Create) |
| 4 | Extend IPC Channels and Handlers for Discovery | `ipc-handler` | `electron/ipc/channels.ts`, `electron/ipc/discovery.handlers.ts` |
| 5 | Extend Preload Script and Types for Discovery | `ipc-handler` | `electron/preload.ts`, `types/electron.d.ts` |
| 6 | Create Validation Schemas and Query Infrastructure | `tanstack-query` | `lib/validations/discovered-file.ts` (Create), `lib/queries/discovered-files.ts`, `hooks/queries/use-discovered-files.ts` |
| 7 | Create Zustand Store for Discovery UI State | `zustand-store` | `lib/stores/discovery-store.ts` (Create) |
| 8 | Create Discovery Table and Toolbar Components | `tanstack-table` | `components/workflows/discovered-files-table.tsx` (Create), `components/workflows/discovery-table-toolbar.tsx` (Create) |
| 9 | Create File Edit and Add Dialogs | `tanstack-form` | `components/workflows/edit-discovered-file-dialog.tsx` (Create), `components/workflows/add-file-dialog.tsx` (Create) |
| 10 | Create Discovery Streaming and Stale Indicator Components | `frontend-component` | `components/workflows/discovery-streaming.tsx` (Create), `components/workflows/stale-discovery-indicator.tsx` (Create) |
| 11 | Create Discovery Workspace Component | `frontend-component` | `components/workflows/discovery-workspace.tsx` (Create) |
| 12 | Integrate Discovery Workspace into Pipeline View | `frontend-component` | `components/workflows/pipeline-view.tsx`, `components/workflows/pipeline-step.tsx` |

## Quality Gates

| Gate | After Step | Checks |
|------|------------|--------|
| QG1 | Step 5 | Backend Complete - DB, IPC, streaming |
| QG2 | Step 9 | UI Components Complete - Table, dialogs |
| QG3 | Step 12 | Integration Complete - Full workflow |

## Step Assignment Rationale

1. **Steps 1-2**: Database layer → `database-schema` (Drizzle ORM patterns)
2. **Step 3**: Claude Agent SDK service → `claude-agent-sdk` (streaming, sessions)
3. **Steps 4-5**: Electron IPC → `ipc-handler` (channels, preload, types)
4. **Step 6**: TanStack Query hooks → `tanstack-query` (mutations, queries, keys)
5. **Step 7**: Zustand store → `zustand-store` (UI state)
6. **Step 8**: TanStack Table → `tanstack-table` (data tables with filtering)
7. **Step 9**: TanStack Form → `tanstack-form` (dialogs with forms)
8. **Steps 10-12**: React components → `frontend-component` (UI, workspace, integration)

## MILESTONE: PHASE_2_COMPLETE

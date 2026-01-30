# Setup and Routing Table

## Routing Table

| Step | Title | Specialist | Files |
|------|-------|------------|-------|
| 1 | Add New IPC Channels for Agent Move and Copy Operations | ipc-handler | electron/ipc/channels.ts, electron/preload.ts |
| 2 | Implement IPC Handlers for Move and Copy Operations | ipc-handler | electron/ipc/agent.handlers.ts |
| 3 | Update Preload API and Type Definitions | ipc-handler | electron/preload.ts, types/electron.d.ts |
| 4 | Update Query Key Factory and Add Unified Query Hook | tanstack-query | lib/queries/agents.ts, hooks/queries/use-agents.ts |
| 5 | Create Unified Agent Table Columns Definition | tanstack-table | components/agents/agent-table.tsx |
| 6 | Update AgentEditorDialog with Project Assignment Field | tanstack-form | components/agents/agent-editor-dialog.tsx |
| 7 | Create Toolbar Content Component with Faceted Filters | frontend-component | components/agents/agent-table-toolbar.tsx (NEW) |
| 8 | Redesign Agents Page with Unified DataTable | frontend-component | app/(app)/agents/page.tsx |
| 9 | Implement Project Selection Dialog for Move/Copy Actions | frontend-component | components/agents/select-project-dialog.tsx (NEW) |
| 10 | Delete Deprecated Components and Store | general-purpose | Delete 5 files, modify constants.ts |

## Quality Gates

- **Gate 1**: After Step 4 (Backend Complete) - Run typecheck and lint
- **Gate 2**: After Step 8 (UI Complete) - Full validation
- **Gate 3**: After Step 10 (Cleanup Complete) - Final validation

## Execution Order

Steps will be executed sequentially as there are dependencies between them.

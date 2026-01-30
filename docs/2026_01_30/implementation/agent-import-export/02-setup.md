# Implementation Setup and Routing Table

**Execution Started**: 2026-01-30

## Routing Table

| Step | Title | Specialist Agent | Files |
|------|-------|------------------|-------|
| 1 | Add YAML Package Dependency | general-purpose | `package.json` |
| 2 | Create Agent Markdown Utilities | general-purpose | `lib/utils/agent-markdown.ts` (create) |
| 3 | Create Agent Import Validation Schema | general-purpose | `lib/validations/agent-import.ts` (create) |
| 4 | Add IPC Channels | ipc-handler | `electron/ipc/channels.ts`, `electron/preload.ts` |
| 5 | Implement Agent Import/Export IPC Handlers | ipc-handler | `electron/ipc/agent.handlers.ts` |
| 6 | Add ElectronAPI Type Definitions | ipc-handler | `types/electron.d.ts`, `electron/preload.ts` |
| 7 | Create Import/Export Mutation Hooks | tanstack-query | `hooks/queries/use-agents.ts` |
| 8 | Create Import Agent Preview Dialog | frontend-component | `components/agents/import-agent-dialog.tsx` (create) |
| 9 | Add Import/Export Buttons to Toolbar | frontend-component | `components/agents/agent-table-toolbar.tsx` |
| 10 | Add Export Row Action | frontend-component | `components/agents/agent-table.tsx` |
| 11 | Enable Row Selection in Agent Table | frontend-component | `components/agents/agent-table.tsx` |
| 12 | Integrate Import/Export in Agents Page | frontend-component | `app/(app)/agents/page.tsx` |
| 13 | Manual Integration Testing | general-purpose | Testing only |

## Specialist Assignment Summary

- **general-purpose**: Steps 1, 2, 3, 13
- **ipc-handler**: Steps 4, 5, 6
- **tanstack-query**: Step 7
- **frontend-component**: Steps 8, 9, 10, 11, 12

## Todo List Created

14 items added to todo list (13 steps + 1 quality gate)

---

MILESTONE: PHASE_2_COMPLETE

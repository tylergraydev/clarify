# Setup and Routing Table

## Routing Table

| Step | Title | Specialist Agent | Files |
|------|-------|------------------|-------|
| 1 | Add electron-log Dependency and Create Type Definitions | `general-purpose` | `package.json`, `types/debug-log.d.ts` |
| 2 | Create Debug Logger Service | `claude-agent-sdk` | `electron/services/debug-logger.service.ts` |
| 3 | Inject Logging into Agent Stream Service | `claude-agent-sdk` | `electron/services/agent-stream.service.ts` |
| 4 | Add Debug Log IPC Channel Definitions | `ipc-handler` | `electron/ipc/channels.ts`, `electron/preload.ts` |
| 5 | Create Debug Log IPC Handlers | `ipc-handler` | `electron/ipc/debug-log.handlers.ts`, `electron/ipc/index.ts` |
| 6 | Create Debug Window Preload Script and Update Main Process | `general-purpose` | `electron/debug-window/preload.ts`, `electron/main.ts`, `electron/tsconfig.json` |
| 7 | Update Type Definitions for Debug Window API | `ipc-handler` | `types/electron.d.ts`, `electron/preload.ts` |
| 8 | Create Debug Log Zustand Store | `zustand-store` | `lib/stores/debug-log-store.ts` |
| 9 | Create Debug Log Query Key Factory and TanStack Query Hooks | `tanstack-query` | `lib/queries/debug-logs.ts`, `hooks/queries/use-debug-logs.ts`, `lib/queries/index.ts`, `hooks/queries/index.ts` |
| 10 | Create Debug Window Layout and Page | `page-route` | `app/debug/layout.tsx`, `app/debug/page.tsx` |
| 11 | Create Debug Log UI Components | `frontend-component` | `components/debug/debug-log-viewer.tsx`, `components/debug/debug-log-toolbar.tsx`, `components/debug/debug-log-filters.tsx`, `components/debug/debug-log-list.tsx`, `components/debug/debug-log-entry.tsx`, `components/debug/debug-log-search.tsx`, `components/debug/index.ts` |
| 12 | Add Debug Settings Section to Settings Page | `frontend-component` | `components/settings/debug-settings-section.tsx`, `components/settings/settings-form.tsx`, `lib/validations/settings.ts` |
| 13 | Integration Testing and Polish | `general-purpose` | Various files |

## Step-Type Detection Reasoning

- **Step 1**: General package.json modification and type definitions → `general-purpose`
- **Step 2**: Creates service in `electron/services/` for Agent SDK → `claude-agent-sdk`
- **Step 3**: Modifies `electron/services/agent-stream.service.ts` → `claude-agent-sdk`
- **Step 4**: Modifies `electron/ipc/channels.ts` and preload → `ipc-handler`
- **Step 5**: Creates handler in `electron/ipc/` → `ipc-handler`
- **Step 6**: Main process and separate preload (non-standard) → `general-purpose`
- **Step 7**: Updates `types/electron.d.ts` and preload API → `ipc-handler`
- **Step 8**: Creates store in `lib/stores/` → `zustand-store`
- **Step 9**: Creates query keys and hooks → `tanstack-query`
- **Step 10**: Creates pages in `app/` → `page-route`
- **Step 11**: Creates components in `components/` → `frontend-component`
- **Step 12**: Creates settings components → `frontend-component`
- **Step 13**: Integration testing → `general-purpose`

## Phase 2 Complete

Ready to begin step execution.

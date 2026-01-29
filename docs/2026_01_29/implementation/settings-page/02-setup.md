# Setup and Routing Table

## Routing Table

| Step | Title | Specialist | Files |
|------|-------|------------|-------|
| 1 | Create Settings IPC Channel Definitions | ipc-handler | `electron/ipc/channels.ts` |
| 2 | Create Settings IPC Handlers | ipc-handler | `electron/ipc/settings.handlers.ts` |
| 3 | Register Settings Handlers in IPC Index | ipc-handler | `electron/ipc/index.ts` |
| 4 | Update Preload Script with Settings API | ipc-handler | `electron/preload.ts` |
| 5 | Update Electron Type Definitions | ipc-handler | `types/electron.d.ts` |
| 6 | Create Settings Query Key Factory | tanstack-query | `lib/queries/settings.ts` |
| 7 | Export Settings Query Keys from Index | tanstack-query | `lib/queries/index.ts` |
| 8 | Create Settings Validation Schema | tanstack-form | `lib/validations/settings.ts` |
| 9 | Create Settings TanStack Query Hooks | tanstack-query | `hooks/queries/use-settings.ts` |
| 10 | Export Settings Hooks from Index | tanstack-query | `hooks/queries/index.ts` |
| 11 | Create Settings Section Card Component | frontend-component | `components/settings/settings-section.tsx` |
| 12 | Create Path Input Field Component | tanstack-form-base-components | `components/settings/path-input-field.tsx` |
| 13 | Create Workflow Settings Form Section | tanstack-form | `components/settings/workflow-settings-section.tsx` |
| 14 | Create Worktree Settings Form Section | tanstack-form | `components/settings/worktree-settings-section.tsx` |
| 15 | Create Logging Settings Form Section | tanstack-form | `components/settings/logging-settings-section.tsx` |
| 16 | Create UI Settings Form Section | tanstack-form | `components/settings/ui-settings-section.tsx` |
| 17 | Create Settings Form Component | tanstack-form | `components/settings/settings-form.tsx` |
| 18 | Create Settings Loading Skeleton | frontend-component | `components/settings/settings-skeleton.tsx` |
| 19 | Create Component Barrel Export | frontend-component | `components/settings/index.ts` |
| 20 | Implement Settings Page | general-purpose | `app/(app)/settings/page.tsx` |
| 21 | Final Integration Testing | general-purpose | N/A (verification) |

## Execution Strategy

### Phase 1: IPC Layer (Steps 1-5)
All delegated to `ipc-handler` specialist. These can be executed sequentially as each depends on the previous.

### Phase 2: Query Layer (Steps 6-7, 9-10)
All delegated to `tanstack-query` specialist.

### Phase 3: Validation Schema (Step 8)
Delegated to `tanstack-form` specialist.

### Phase 4: Component Layer (Steps 11-19)
Mix of `frontend-component`, `tanstack-form-base-components`, and `tanstack-form` specialists.

### Phase 5: Page Integration (Steps 20-21)
Delegated to `general-purpose` specialist for final assembly.

## Status: MILESTONE:PHASE_2_COMPLETE

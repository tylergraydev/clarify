# Settings Page Implementation Plan

Generated: 2026-01-29

## Overview

| Field | Value |
|-------|-------|
| Estimated Duration | 4-6 hours |
| Complexity | Medium |
| Risk Level | Low |

## Quick Summary

Implement a comprehensive Settings page that consolidates all user configuration options into four grouped sections (Workflow Execution, Git Worktrees, Logging & Audit, UI). The implementation leverages existing settings repository and follows established patterns from the agents page, using TanStack Form for data management and the existing form field components.

## Prerequisites

- [ ] Existing settings repository (`db/repositories/settings.repository.ts`) is functional
- [ ] TanStack Form field components are available in `components/ui/form/`
- [ ] Theme selector component exists at `components/ui/theme-selector.tsx`
- [ ] Settings schema defined at `db/schema/settings.schema.ts`

## Analysis Summary

- Feature request refined with project context
- Discovered 56 files across all architectural layers
- Generated 21-step implementation plan with 4 quality gates

## File Discovery Results

### Critical Files (11 files)
| File | Action |
|------|--------|
| `app/(app)/settings/page.tsx` | Modify (complete rewrite) |
| `hooks/queries/use-settings.ts` | Create |
| `lib/queries/settings.ts` | Create |
| `lib/validations/settings.ts` | Create |
| `electron/ipc/settings.handlers.ts` | Create |
| `electron/ipc/channels.ts` | Modify |
| `electron/ipc/index.ts` | Modify |
| `electron/preload.ts` | Modify |
| `types/electron.d.ts` | Modify |
| `lib/queries/index.ts` | Modify |
| `hooks/queries/index.ts` | Modify |

### New Components to Create (8 files)
| File | Purpose |
|------|---------|
| `components/settings/settings-section.tsx` | Reusable section card component |
| `components/settings/path-input-field.tsx` | Directory path input with browse |
| `components/settings/workflow-settings-section.tsx` | Workflow execution settings |
| `components/settings/worktree-settings-section.tsx` | Git worktree settings |
| `components/settings/logging-settings-section.tsx` | Logging & audit settings |
| `components/settings/ui-settings-section.tsx` | UI settings with theme |
| `components/settings/settings-form.tsx` | Main form component |
| `components/settings/settings-skeleton.tsx` | Loading skeleton |
| `components/settings/index.ts` | Barrel export |

## Implementation Steps

### Step 1: Create Settings IPC Channel Definitions

**What**: Add settings-specific IPC channel constants to the channels configuration.

**Why**: IPC channels must be defined before handlers can be registered and used by the renderer process.

**Confidence**: High

**Files**:
- `electron/ipc/channels.ts` (modify)

**Changes**:
1. Add `settings` object to `IpcChannels` constant with the following channels: `list`, `get`, `getByKey`, `getByCategory`, `setValue`, `resetToDefault`, `bulkUpdate`
2. Maintain alphabetical ordering within the file (place after `step` object)
3. Follow existing naming pattern using `settings:{action}` format

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Settings channels defined in IpcChannels object
- [ ] TypeScript compiles without errors
- [ ] All validation commands pass

---

### Step 2: Create Settings IPC Handlers

**What**: Implement IPC handlers for settings CRUD operations in the main process.

**Why**: The Electron main process needs handlers to bridge database operations with renderer requests.

**Confidence**: High

**Files**:
- `electron/ipc/settings.handlers.ts` (create)

**Changes**:
1. Create handler registration function `registerSettingsHandlers` accepting `SettingsRepository`
2. Implement handlers for: list (with optional category filter), get by ID, get by key, get by category, setValue, resetToDefault, bulkUpdate (for saving all settings at once)
3. Follow pattern established in `electron/ipc/agent.handlers.ts`
4. Include proper TypeScript types for all handler parameters and return values

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Handler file created with all required operations
- [ ] Type-safe handler signatures matching repository interface
- [ ] All validation commands pass

---

### Step 3: Register Settings Handlers in IPC Index

**What**: Register the settings handlers during application initialization.

**Why**: Handlers must be registered to respond to renderer IPC invocations.

**Confidence**: High

**Files**:
- `electron/ipc/index.ts` (modify)

**Changes**:
1. Import `registerSettingsHandlers` from `./settings.handlers`
2. Import `createSettingsRepository` from repositories
3. Instantiate settings repository using the database instance
4. Call `registerSettingsHandlers` with the repository instance
5. Place registration after the audit handlers section (maintaining logical grouping)

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Settings handlers imported and registered
- [ ] Repository created and passed to handler registration
- [ ] All validation commands pass

---

### Step 4: Update Preload Script with Settings API

**What**: Expose settings methods through the Electron context bridge.

**Why**: The renderer process needs typed access to settings IPC channels through the electronAPI.

**Confidence**: High

**Files**:
- `electron/preload.ts` (modify)

**Changes**:
1. Add settings channels to the local `IpcChannels` constant (mirroring Step 1)
2. Add `settings` object to `ElectronAPI` interface with typed method signatures
3. Add `settings` implementation to `electronAPI` object with ipcRenderer.invoke calls
4. Import `Setting`, `NewSetting` types from db/schema if needed for typing

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Settings API added to ElectronAPI interface
- [ ] All methods properly typed with Setting types
- [ ] IPC invoke calls use correct channel names
- [ ] All validation commands pass

---

### Step 5: Update Electron Type Definitions

**What**: Update the global ElectronAPI type declarations for the renderer.

**Why**: TypeScript type definitions must match the preload API for type safety in React components.

**Confidence**: High

**Files**:
- `types/electron.d.ts` (modify)

**Changes**:
1. Add `Setting` and `NewSetting` to the type exports from db/schema
2. Add `settings` object to `ElectronAPI` interface with all method signatures
3. Include methods: `list`, `get`, `getByKey`, `getByCategory`, `setValue`, `resetToDefault`, `bulkUpdate`
4. Ensure return types match the repository interface

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Setting types exported for renderer use
- [ ] ElectronAPI interface includes settings object
- [ ] All method signatures properly typed
- [ ] All validation commands pass

---

### Step 6: Create Settings Query Key Factory

**What**: Define query keys for TanStack Query cache management.

**Why**: Consistent query key structure enables proper cache invalidation when settings change.

**Confidence**: High

**Files**:
- `lib/queries/settings.ts` (create)

**Changes**:
1. Import `createQueryKeys` from `@lukemorales/query-key-factory`
2. Create and export `settingKeys` with queries for: `all`, `list` (with optional category filter), `detail` (by ID), `byKey` (by setting key), `byCategory`
3. Follow pattern from `lib/queries/agents.ts`

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Query key factory created with all necessary keys
- [ ] Keys support filtering by category
- [ ] All validation commands pass

---

### Step 7: Export Settings Query Keys from Index

**What**: Add settings query keys to the centralized query key exports.

**Why**: Enables consistent access to settings query keys throughout the application.

**Confidence**: High

**Files**:
- `lib/queries/index.ts` (modify)

**Changes**:
1. Import `settingKeys` from `./settings`
2. Add `settingKeys` to the `mergeQueryKeys` call
3. Add re-export for `settingKeys` in the individual exports section

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Settings keys imported and merged
- [ ] Settings keys re-exported for direct access
- [ ] All validation commands pass

---

### Step 8: Create Settings Validation Schema

**What**: Define Zod schemas for settings form validation.

**Why**: Type-safe validation ensures data integrity before persisting settings.

**Confidence**: High

**Files**:
- `lib/validations/settings.ts` (create)

**Changes**:
1. Import Zod and define schemas for each settings category
2. Create `workflowSettingsSchema` with fields: `defaultPauseBehavior` (enum: continuous, auto-pause, quality-gates), step timeout fields (numbers with min/max constraints)
3. Create `worktreeSettingsSchema` with fields: `worktreeLocation` (string), `autoCleanup` (boolean), `createFeatureBranch` (boolean), `pushOnCompletion` (boolean)
4. Create `loggingSettingsSchema` with fields: `logRetentionDays` (number), `exportLogsWithDatabase` (boolean), `includeCliOutput` (boolean), `logExportLocation` (string)
5. Create combined `settingsFormSchema` that encompasses all categories
6. Export form value types derived from schemas

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] All category schemas defined with appropriate constraints
- [ ] Combined schema created for full form validation
- [ ] TypeScript types exported for form usage
- [ ] All validation commands pass

---

### Step 9: Create Settings TanStack Query Hooks

**What**: Implement React hooks for fetching and mutating settings data.

**Why**: Query hooks provide consistent data fetching patterns with caching and optimistic updates.

**Confidence**: High

**Files**:
- `hooks/queries/use-settings.ts` (create)

**Changes**:
1. Create `useSettings` hook that fetches all settings, optionally filtered by category
2. Create `useSettingByKey` hook for fetching individual settings by key
3. Create `useSettingsByCategory` hook for fetching settings grouped by category
4. Create `useUpdateSetting` mutation hook with cache invalidation
5. Create `useResetSetting` mutation hook for resetting to defaults
6. Create `useBulkUpdateSettings` mutation hook for saving all form values at once
7. Follow patterns from `hooks/queries/use-agents.ts`

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] All query and mutation hooks created
- [ ] Proper cache invalidation on mutations
- [ ] Hooks enabled only when Electron API available
- [ ] All validation commands pass

---

### Step 10: Export Settings Hooks from Index

**What**: Add settings hooks to the centralized hooks exports.

**Why**: Enables consistent import patterns for settings hooks throughout the application.

**Confidence**: High

**Files**:
- `hooks/queries/index.ts` (modify)

**Changes**:
1. Add Settings Hooks section header comment
2. Export all settings hooks from `./use-settings`
3. Add `settingKeys` to the query keys re-export if not already included via lib/queries

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] All settings hooks exported
- [ ] Section follows alphabetical ordering pattern
- [ ] All validation commands pass

---

### Step 11: Create Settings Section Card Component

**What**: Create a reusable card component for grouping related settings.

**Why**: Provides consistent visual structure for the four settings sections per the design mockup.

**Confidence**: High

**Files**:
- `components/settings/settings-section.tsx` (create)

**Changes**:
1. Create `SettingsSection` component that wraps content in a styled container
2. Accept props for `title` (string) and `children` (ReactNode)
3. Include a separator/divider below the title as shown in the mockup
4. Use existing `Card` component or create semantic section styling
5. Apply appropriate spacing and typography consistent with other pages

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Component renders title with divider
- [ ] Children render within the section body
- [ ] Consistent styling with application design
- [ ] All validation commands pass

---

### Step 12: Create Path Input Field Component

**What**: Create a form field component for directory path selection with browse button.

**Why**: The worktree location and log export location settings require file system path selection.

**Confidence**: Medium

**Files**:
- `components/settings/path-input-field.tsx` (create)

**Changes**:
1. Create `PathInputField` component that combines a text input with a browse button
2. Accept standard field props plus optional `dialogTitle` for the directory picker
3. Use existing `Input` component for the text display
4. Add browse button that triggers `electronAPI.dialog.openDirectory()`
5. Update the field value when a directory is selected
6. Integrate with TanStack Form field context using `useFieldContext`

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Text input displays current path value
- [ ] Browse button opens native directory picker
- [ ] Selected path updates form field
- [ ] Proper error state handling
- [ ] All validation commands pass

---

### Step 13: Create Workflow Settings Form Section

**What**: Implement the Workflow Execution settings form section.

**Why**: This section contains pause behavior radio options and step timeout number inputs.

**Confidence**: High

**Files**:
- `components/settings/workflow-settings-section.tsx` (create)

**Changes**:
1. Create `WorkflowSettingsSection` component using `SettingsSection` wrapper
2. Include `RadioField` for default pause behavior with three options (continuous, auto-pause, quality-gates)
3. Add `NumberField` inputs for each step timeout (clarification, refinement, file discovery, planning, implementation)
4. Include labels and units (seconds) as shown in the mockup
5. Use form field context to bind to parent form state

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Radio group renders three pause behavior options
- [ ] All five timeout fields render with proper labels
- [ ] Fields properly bound to form state
- [ ] All validation commands pass

---

### Step 14: Create Worktree Settings Form Section

**What**: Implement the Git Worktrees settings form section.

**Why**: This section contains path input and checkbox options for worktree behavior.

**Confidence**: High

**Files**:
- `components/settings/worktree-settings-section.tsx` (create)

**Changes**:
1. Create `WorktreeSettingsSection` component using `SettingsSection` wrapper
2. Include `PathInputField` for worktree location with browse capability
3. Add three `CheckboxField` components for auto-cleanup, create feature branch, push on completion
4. Use proper spacing between fields as shown in mockup
5. Bind all fields to parent form state

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Path input with browse button renders correctly
- [ ] All three checkbox options render
- [ ] Fields properly bound to form state
- [ ] All validation commands pass

---

### Step 15: Create Logging Settings Form Section

**What**: Implement the Logging & Audit settings form section.

**Why**: This section contains retention settings, export options, and path selection.

**Confidence**: High

**Files**:
- `components/settings/logging-settings-section.tsx` (create)

**Changes**:
1. Create `LoggingSettingsSection` component using `SettingsSection` wrapper
2. Include `NumberField` for log retention days with appropriate min/max
3. Add two `CheckboxField` components for export logs with database and include CLI output
4. Include `PathInputField` for log export location
5. Bind all fields to parent form state

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Retention days input renders correctly
- [ ] Both checkbox options render
- [ ] Path input with browse button works
- [ ] Fields properly bound to form state
- [ ] All validation commands pass

---

### Step 16: Create UI Settings Form Section

**What**: Implement the UI settings form section integrating the existing theme selector.

**Why**: Consolidates UI preferences including theme selection into the settings page.

**Confidence**: High

**Files**:
- `components/settings/ui-settings-section.tsx` (create)

**Changes**:
1. Create `UISettingsSection` component using `SettingsSection` wrapper
2. Import and include the existing `ThemeSelector` component
3. Add any additional UI preference controls as needed
4. Ensure theme changes are persisted (theme selector already handles this via ThemeProvider)

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Theme selector integrated and functional
- [ ] Section follows consistent styling
- [ ] Theme changes persist correctly
- [ ] All validation commands pass

---

### Step 17: Create Settings Form Component

**What**: Create the main settings form that composes all section components.

**Why**: A unified form component manages state and submission for all settings sections.

**Confidence**: Medium

**Files**:
- `components/settings/settings-form.tsx` (create)

**Changes**:
1. Create `SettingsForm` component using `useAppForm` hook with Zod validation
2. Initialize form with current settings values (from props or query)
3. Compose all four section components within the form
4. Add `SubmitButton` at the bottom of the form
5. Implement `onSubmit` handler that calls the bulk update mutation
6. Show toast notification on successful save
7. Handle loading and error states appropriately

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Form initializes with existing settings values
- [ ] All sections render within form context
- [ ] Submit button triggers save operation
- [ ] Success/error feedback displayed
- [ ] All validation commands pass

---

### Step 18: Create Settings Loading Skeleton

**What**: Create a skeleton loading state for the settings page.

**Why**: Provides visual feedback while settings data is being fetched.

**Confidence**: High

**Files**:
- `components/settings/settings-skeleton.tsx` (create)

**Changes**:
1. Create `SettingsSkeleton` component with animated placeholders
2. Mirror the structure of the settings form with four section areas
3. Include placeholder elements for radio groups, inputs, and checkboxes
4. Apply consistent skeleton animation styles (animate-pulse, bg-muted)
5. Follow pattern from `AgentCardSkeleton` in agents page

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Skeleton matches settings form structure
- [ ] Proper animation applied
- [ ] Visual consistency with other skeletons
- [ ] All validation commands pass

---

### Step 19: Create Component Barrel Export

**What**: Create index file for settings components.

**Why**: Enables clean imports for all settings-related components.

**Confidence**: High

**Files**:
- `components/settings/index.ts` (create)

**Changes**:
1. Export all settings components from the directory
2. Include: `SettingsSection`, `PathInputField`, `WorkflowSettingsSection`, `WorktreeSettingsSection`, `LoggingSettingsSection`, `UISettingsSection`, `SettingsForm`, `SettingsSkeleton`

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] All components exported
- [ ] No circular dependency issues
- [ ] All validation commands pass

---

### Step 20: Implement Settings Page

**What**: Complete the settings page implementation replacing the placeholder.

**Why**: This is the main deliverable that ties together all settings components.

**Confidence**: High

**Files**:
- `app/(app)/settings/page.tsx` (modify - complete rewrite)

**Changes**:
1. Add "use client" directive for client-side rendering
2. Import settings components and hooks
3. Add `QueryErrorBoundary` wrapper for error handling
4. Implement data fetching using `useSettings` hook
5. Show `SettingsSkeleton` during loading state
6. Render `SettingsForm` with fetched settings data when loaded
7. Follow page structure pattern from agents page (heading, description, content)
8. Ensure proper keyboard navigation and accessibility

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Page heading and description render correctly
- [ ] Loading skeleton shows during data fetch
- [ ] Settings form renders with current values
- [ ] Error boundary catches and displays errors
- [ ] All validation commands pass

---

### Step 21: Final Integration Testing

**What**: Verify the complete settings page integration works end-to-end.

**Why**: Ensures all components work together correctly before considering implementation complete.

**Confidence**: High

**Files**:
- No new files (verification step)

**Changes**:
1. Run the full application in development mode
2. Navigate to the Settings page via sidebar
3. Verify all four sections render correctly
4. Test changing values in each section
5. Verify save button persists changes
6. Confirm changes persist after page reload
7. Test theme selector functionality
8. Test path input browse dialogs

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
pnpm electron:dev
```

**Success Criteria**:
- [ ] Settings page accessible via sidebar navigation
- [ ] All form sections render correctly
- [ ] Settings changes persist across sessions
- [ ] Theme changes work and persist
- [ ] Path selection dialogs function properly
- [ ] Form validation prevents invalid inputs
- [ ] All validation commands pass

---

## Quality Gates

### Gate 1: IPC Layer Complete
- **Check**: Verify all settings IPC channels are defined and handlers registered
- **Command**: `pnpm lint && pnpm typecheck`

### Gate 2: Query Layer Complete
- **Check**: Verify settings query keys and hooks export correctly
- **Command**: `pnpm lint && pnpm typecheck`

### Gate 3: Component Layer Complete
- **Check**: Verify all settings components render without errors
- **Command**: `pnpm lint && pnpm typecheck`

### Gate 4: Full Integration
- **Check**: Verify settings page loads, displays data, and persists changes
- **Command**: `pnpm electron:dev` (manual verification)

## Notes

- The existing `ThemeSelector` component already handles theme persistence through the `ThemeProvider`, so UI settings may primarily wrap this existing functionality
- Step timeout values should have sensible defaults and constraints (e.g., minimum 10 seconds, maximum 600 seconds)
- The settings repository already exists with comprehensive methods including `getTypedValue` for type-safe value retrieval
- Default setting values should be seeded in the database during initialization if not already present
- The path input component relies on the Electron dialog API, which is only available in the desktop environment
- Form state should be initialized from existing settings, falling back to sensible defaults if settings are not yet configured
- Consider debouncing auto-save functionality in future iterations, but initial implementation uses explicit save button per the mockup

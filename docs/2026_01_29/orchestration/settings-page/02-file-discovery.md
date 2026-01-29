# Step 2 - AI-Powered File Discovery

## Step Metadata

| Field | Value |
|-------|-------|
| Start Time | 2026-01-29T00:02:00Z |
| End Time | 2026-01-29T00:03:00Z |
| Duration | ~60 seconds |
| Status | **Completed** |

## Refined Request Used as Input

Build a comprehensive Settings page for the Clarify application that consolidates all user configuration options into a single, intuitive interface. The page should implement four grouped settings sections corresponding to the database schema categories: Workflow Execution settings allowing users to configure default pause behavior (auto-pause versus continuous execution) and step timeout durations; Git Worktree settings for specifying the location where worktrees are created, toggling automatic cleanup of completed worktrees, and customizing branch naming patterns; Logging & Audit settings for defining data retention periods and selecting export locations for audit logs; and UI settings including the theme toggle (consolidating the existing header theme control) along with other interface preferences. The implementation should leverage the existing settings repository and IPC handlers already in place, utilizing TanStack Form and Query for consistent data management patterns established throughout the application.

## AI File Discovery Analysis

### Discovery Summary

| Category | Count |
|----------|-------|
| **Total Files** | 56 |
| Critical | 11 |
| High | 14 |
| Medium | 22 |
| Low | 9 |

## Critical Files (Must Modify/Create)

### `app/(app)/settings/page.tsx`
- **Reason**: Main settings page file - currently a placeholder that needs full implementation
- **Action**: Modify (complete rewrite)
- **Dependencies**: Form components, query hooks, UI components, theme provider
- **Validated**: Exists

### `hooks/queries/use-settings.ts`
- **Reason**: No settings query hook exists - needs creation to follow established TanStack Query patterns
- **Action**: Create
- **Dependencies**: `lib/queries/settings.ts`, `use-electron.ts`
- **Validated**: Does not exist (to be created)

### `lib/queries/settings.ts`
- **Reason**: No settings query key factory exists - needs creation for TanStack Query cache management
- **Action**: Create
- **Dependencies**: `@lukemorales/query-key-factory`
- **Validated**: Does not exist (to be created)

### `lib/validations/settings.ts`
- **Reason**: No settings validation schema exists - needs creation for form validation
- **Action**: Create
- **Dependencies**: Zod
- **Validated**: Does not exist (to be created)

### `electron/ipc/settings.handlers.ts`
- **Reason**: No settings IPC handlers exist - needs creation for settings persistence via database
- **Action**: Create
- **Dependencies**: `settings.repository.ts`, `channels.ts`
- **Validated**: Does not exist (to be created)

### `electron/ipc/channels.ts`
- **Reason**: Must add settings IPC channel definitions for new settings operations
- **Action**: Modify
- **Dependencies**: None
- **Validated**: Exists

### `electron/ipc/index.ts`
- **Reason**: Must register new settings handlers
- **Action**: Modify
- **Dependencies**: `settings.handlers.ts`, `settings.repository.ts`
- **Validated**: Exists

### `electron/preload.ts`
- **Reason**: Must add settings methods to ElectronAPI for renderer access
- **Action**: Modify
- **Dependencies**: `settings.schema.ts`
- **Validated**: Exists

### `types/electron.d.ts`
- **Reason**: Must update ElectronAPI type definitions with settings methods
- **Action**: Modify
- **Dependencies**: `settings.schema.ts`
- **Validated**: Exists

### `lib/queries/index.ts`
- **Reason**: Must export new settings query keys
- **Action**: Modify
- **Dependencies**: `settings.ts` query keys
- **Validated**: Exists

### `hooks/queries/index.ts`
- **Reason**: Must export new settings hooks
- **Action**: Modify
- **Dependencies**: `use-settings.ts`
- **Validated**: Exists

## High Priority Files

### `db/schema/settings.schema.ts`
- **Reason**: Existing schema defines settings categories and structure - may need review for alignment
- **Action**: Review/Potentially Modify
- **Dependencies**: None

### `db/repositories/settings.repository.ts`
- **Reason**: Existing repository provides CRUD operations - already has getTypedValue, setValue, resetToDefault
- **Action**: Review/Potentially Modify
- **Dependencies**: `settings.schema.ts`

### `components/providers/theme-provider.tsx`
- **Reason**: Theme management - settings page will consolidate theme control
- **Action**: Review/Potentially Modify
- **Dependencies**: `lib/theme/constants.ts`, `use-electron.ts`

### `lib/theme/constants.ts`
- **Reason**: Theme constants and storage key - may need alignment with settings schema
- **Action**: Review
- **Dependencies**: None

### `components/ui/theme-selector.tsx`
- **Reason**: Existing theme selector component - can be reused directly in settings page
- **Action**: Review/Reuse
- **Dependencies**: `theme-provider.tsx`

### `components/ui/form/radio-field.tsx`
- **Reason**: Required for Default Pause Behavior setting (3 radio options per design document)
- **Action**: Reference/Use
- **Dependencies**: `radio-group.tsx`, `field-wrapper.tsx`

### `components/ui/form/checkbox-field.tsx`
- **Reason**: Required for boolean settings like "Auto-cleanup worktrees", "Export logs"
- **Action**: Reference/Use
- **Dependencies**: `checkbox.tsx`, `field-wrapper.tsx`

### `components/ui/form/number-field.tsx`
- **Reason**: Required for timeout settings and log retention days
- **Action**: Reference/Use
- **Dependencies**: `number-input.tsx`, `field-wrapper.tsx`

### `components/ui/form/text-field.tsx`
- **Reason**: Required for path settings (worktree location, log export location)
- **Action**: Reference/Use
- **Dependencies**: `input.tsx`, `field-wrapper.tsx`

### `lib/forms/form-hook.ts`
- **Reason**: TanStack Form hook configuration - provides useAppForm for settings form
- **Action**: Reference
- **Dependencies**: Form field components

### `hooks/use-electron.ts`
- **Reason**: Provides useElectronDialog for directory picker, useElectronStore for settings
- **Action**: Reference
- **Dependencies**: `types/electron.d.ts`

### `hooks/use-toast.ts`
- **Reason**: Toast notifications for settings save feedback
- **Action**: Reference
- **Dependencies**: `components/ui/toast.tsx`

### `electron/ipc/store.handlers.ts`
- **Reason**: Electron-store handlers - may be used for UI settings
- **Action**: Reference
- **Dependencies**: `channels.ts`

### `components/ui/form/switch-field.tsx`
- **Reason**: Alternative to CheckboxField for toggle settings
- **Action**: Reference/Use
- **Dependencies**: `switch.tsx`, `field-wrapper.tsx`

## Medium Priority Files (Reference/Patterns)

### `app/(app)/agents/page.tsx`
- **Reason**: Excellent reference for page structure, loading states, query patterns
- **Action**: Reference for patterns

### `components/agents/agent-editor-dialog.tsx`
- **Reason**: Reference for TanStack Form implementation with validation
- **Action**: Reference for patterns

### `components/agents/agent-card.tsx`
- **Reason**: Reference for Card-based UI patterns and Switch component usage
- **Action**: Reference for patterns

### `hooks/queries/use-agents.ts`
- **Reason**: Reference for TanStack Query hook patterns (useQuery, useMutation)
- **Action**: Reference for patterns

### `lib/queries/agents.ts`
- **Reason**: Reference for query key factory patterns
- **Action**: Reference for patterns

### `lib/validations/agent.ts`
- **Reason**: Reference for Zod validation schema patterns
- **Action**: Reference for patterns

### UI Components Referenced:
- `components/ui/card.tsx` - Settings section grouping
- `components/ui/separator.tsx` - Section dividers
- `components/ui/button.tsx` - Save button and actions
- `components/ui/form/submit-button.tsx` - Form submit with loading
- `components/ui/form/select-field.tsx` - Dropdown settings
- `components/ui/form/field-wrapper.tsx` - Field styling
- `components/ui/form/tanstack-field-root.tsx` - TanStack Field root
- `components/ui/radio-group.tsx` - Base radio component
- `components/ui/checkbox.tsx` - Base checkbox component
- `components/ui/switch.tsx` - Base switch component
- `components/ui/number-input.tsx` - Base number input
- `components/ui/input.tsx` - Base input component

### IPC Reference:
- `electron/ipc/agent.handlers.ts` - IPC handler patterns
- `electron/ipc/dialog.handlers.ts` - Directory picker handlers

### Error Handling:
- `components/data/query-error-boundary.tsx` - Error boundary

## Low Priority Files (Supporting Context)

- `docs/clarify-design-document.md` - Section 4.7 Settings Panel mockup
- `app/(app)/layout.tsx` - App layout context
- `components/shell/app-sidebar.tsx` - Sidebar navigation
- `components/shell/app-header.tsx` - Header component
- `db/schema/index.ts` - Schema exports
- `db/repositories/index.ts` - Repository exports
- `lib/utils.ts` - cn utility function
- `components/providers/query-provider.tsx` - Query provider
- `components/providers/toast-provider.tsx` - Toast provider

## Integration Points

1. **Settings Database Layer to IPC Bridge**
   - `settings.schema.ts` -> `settings.repository.ts` -> `settings.handlers.ts` -> `preload.ts` -> `electron.d.ts`
   - This chain must be complete for renderer to access settings data

2. **TanStack Query Integration**
   - `settings.ts` (query keys) -> `use-settings.ts` (hooks) -> `settings/page.tsx`
   - Must follow established patterns from agents domain

3. **Theme Integration Challenge**
   - Current theme uses `electron-store` directly via `useElectronStore`
   - Settings page uses database via `settings.repository`
   - May need to choose one source of truth or sync between them

4. **Form Integration**
   - TanStack Form with field components for settings editing
   - Zod validation schema for settings values
   - useAppForm pattern from `lib/forms/form-hook.ts`

5. **Directory Picker Integration**
   - `useElectronDialog().openDirectory()` for worktree location and log export paths
   - Combine with TextField for path display/manual entry

## Architecture Insights

1. **Existing Pattern**: Settings schema already defines categories matching design document: "workflow", "worktree", "logging", "ui", "advanced"

2. **Repository Methods Available**: `setValue`, `getValue`, `getTypedValue<T>`, `resetToDefault`, `findByCategory` - all needed for settings page

3. **Missing Infrastructure**: No IPC handlers, query hooks, or query keys for settings - these must be created following the agent/workflow patterns

4. **Theme Duplication Concern**: Theme currently stored in electron-store (`app:theme`) but settings schema has "ui" category - need to decide on unified approach

5. **Form Pattern**: Use `useAppForm` from `lib/forms/form-hook.ts` with Zod validation, referencing `agent-editor-dialog.tsx` for implementation pattern

## Discovery Statistics

- **AI Analysis Duration**: ~60 seconds
- **Files Analyzed**: 56 total
- **Coverage Assessment**: Comprehensive - covers all architectural layers
- **Confidence Level**: High

---

**MILESTONE:STEP_2_COMPLETE**

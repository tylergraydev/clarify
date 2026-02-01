# Implementation Plan: Active Workflows Page

**Generated**: 2026-02-01
**Original Request**: "The active workflows page"
**Refined Request**: Implement the placeholder page with table layout and comprehensive functionality including bulk actions, real-time updates, grouping by project, and detailed workflow metadata.

---

## Overview

**Estimated Duration**: 4-6 hours
**Complexity**: Medium
**Risk Level**: Low

## Quick Summary

Implement the Active Workflows page as a full-featured data table displaying running, paused, and editing workflows with real-time status updates via 5-second polling. The page will leverage existing `WorkflowTable`, `WorkflowTableToolbar` components, and mutation hooks (`usePauseWorkflow`, `useResumeWorkflow`, `useCancelWorkflow`) with a new Zustand store for persisted UI preferences (filters, sorting, grouping).

## Prerequisites

- [ ] Verify existing `useActiveWorkflows` hook returns workflows with expected fields (status, progress, project info)
- [ ] Confirm `WorkflowTable` and `WorkflowTableToolbar` components are stable and exported
- [ ] Ensure mutation hooks (`usePauseWorkflow`, `useResumeWorkflow`, `useCancelWorkflow`) are functional

## Implementation Steps

### Step 1: Create Active Workflows UI Preferences Store

**What**: Create a Zustand store to persist UI preferences for the active workflows page including filter selections, sorting preferences, and group visibility settings.
**Why**: Enables user preferences to persist across page navigations and sessions, following the existing store patterns in `lib/stores/`.
**Confidence**: High

**Files to Create:**
- `lib/stores/active-workflows-store.ts` - Zustand store for active workflows page UI state

**Changes:**
- Define `ActiveWorkflowsState` interface with properties: `statusFilter`, `typeFilter`, `sortColumn`, `sortDirection`, `groupByProject`, `collapsedGroups`
- Define `ActiveWorkflowsActions` interface with setters for each state property and a `reset` function
- Create `useActiveWorkflowsStore` using Zustand `create` with persist middleware
- Follow pattern from `shell-store.ts` for structure and `pipeline-store.ts` for initial state pattern

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Store exports `useActiveWorkflowsStore` hook
- [ ] Store includes all preference state properties with TypeScript types
- [ ] Store includes action functions for updating each preference
- [ ] Store includes reset function to restore defaults
- [ ] Persistence middleware configured for electron-store compatibility
- [ ] All validation commands pass

---

### Step 2: Extend WorkflowTable with Pause/Resume Actions

**What**: Add pause and resume action support to the `WorkflowTable` component to enable inline workflow control from table rows.
**Why**: The existing table only has View, Edit, and Cancel actions. Pause/Resume are required for active workflow management per the feature requirements.
**Confidence**: High

**Files to Modify:**
- `components/workflows/workflow-table.tsx` - Add pause/resume callbacks and action buttons

**Changes:**
- Add `onPause?: (workflowId: number) => void` prop to `WorkflowTableProps`
- Add `onResume?: (workflowId: number) => void` prop to `WorkflowTableProps`
- Add `pausingIds?: Set<number>` prop for tracking in-progress pause operations
- Add `resumingIds?: Set<number>` prop for tracking in-progress resume operations
- Add `PAUSABLE_STATUSES` and `RESUMABLE_STATUSES` constants (reference `active-workflows-widget.tsx` pattern)
- Extend `ActionsCellProps` to include new callbacks and pending state props
- Add Pause action button in `ActionsCell` component (enabled when status is 'running')
- Add Resume action button in `ActionsCell` component (enabled when status is 'paused')
- Import `Pause` and `Play` icons from lucide-react

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] WorkflowTable accepts onPause and onResume callback props
- [ ] WorkflowTable accepts pausingIds and resumingIds props for loading states
- [ ] Pause action button appears for running workflows
- [ ] Resume action button appears for paused workflows
- [ ] Action buttons disabled during pending mutation state
- [ ] All validation commands pass

---

### Step 3: Extend WorkflowTableToolbar with Active Workflows Filter Options

**What**: Modify the toolbar to focus on active workflow statuses and add project filter capability for the active workflows page.
**Why**: Active workflows page needs filters specific to active statuses (running, paused, editing) and grouping by project for organization.
**Confidence**: High

**Files to Modify:**
- `components/workflows/workflow-table-toolbar.tsx` - Add project filter and update status options

**Changes:**
- Add `ActiveWorkflowStatusFilterValue` type with values: 'all', 'running', 'paused', 'editing'
- Add `ACTIVE_STATUS_FILTER_OPTIONS` constant with only active statuses
- Add optional `projectFilter` prop for project-based filtering
- Add optional `onProjectFilterChange` callback prop
- Add optional `projects` prop (array of project options for select)
- Add optional `showProjectFilter` prop to conditionally render project filter
- Add project filter Select component within PopoverContent (similar pattern to type filter)
- Update `getActiveFilterCount` to include project filter when present
- Update `handleResetFilters` to reset project filter when present

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Toolbar supports optional project filter with select dropdown
- [ ] Active filter count badge includes project filter when active
- [ ] Reset filters clears project filter
- [ ] Existing status/type filter functionality preserved
- [ ] New types exported for consumers
- [ ] All validation commands pass

---

### Step 4: Implement Active Workflows Page Component

**What**: Build the full Active Workflows page with data fetching, filtering, actions, and UI state integration.
**Why**: This is the core deliverable - a complete page that displays active workflows with real-time updates and full interactivity.
**Confidence**: High

**Files to Modify:**
- `app/(app)/workflows/active/page.tsx` - Replace placeholder with full implementation

**Changes:**
- Remove placeholder content
- Import `useActiveWorkflows` hook for data fetching (already has 5-second polling)
- Import `useProjects` hook for building project map
- Import `useCancelWorkflow`, `usePauseWorkflow`, `useResumeWorkflow` mutation hooks
- Import `useActiveWorkflowsStore` for UI preference state
- Import `WorkflowTable` and `WorkflowTableToolbar` components
- Import `DataTableSkeleton`, `EmptyState` components
- Import `useRouter` and `$path` for navigation
- Import `useToast` for action feedback
- Build `projectMap: Record<number, string>` from projects data
- Implement filter logic using store state (status, type, project filters)
- Implement `handleCancelWorkflow` with tracking via `cancellingIds` Set state
- Implement `handlePauseWorkflow` with tracking via `pausingIds` Set state
- Implement `handleResumeWorkflow` with tracking via `resumingIds` Set state
- Implement `handleViewDetails` to navigate to workflow detail page
- Add toast notifications for pause/resume/cancel actions (success and error)
- Render loading state with `DataTableSkeleton` when data loading
- Render error state with `EmptyState` when fetch error occurs
- Render empty state with `EmptyState` when no active workflows (with action button to create workflow)
- Render `WorkflowTable` with toolbar, data, and all callbacks
- Add proper ARIA labels and semantic structure
- Add page header with title and optional refresh button

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Page displays active workflows (running, paused, editing statuses)
- [ ] Data refreshes automatically every 5 seconds via useActiveWorkflows polling
- [ ] Filters work correctly (status, type, project)
- [ ] Cancel action works with confirmation and toast feedback
- [ ] Pause action works with toast feedback
- [ ] Resume action works with toast feedback
- [ ] View action navigates to workflow detail page
- [ ] Loading skeleton displays during data fetch
- [ ] Error state displays on fetch failure
- [ ] Empty state displays when no active workflows
- [ ] All validation commands pass

---

### Step 5: Add Cancel Confirmation Dialog

**What**: Implement a confirmation dialog for cancel workflow action to prevent accidental cancellations.
**Why**: Canceling a workflow is destructive and irreversible. Users should confirm before proceeding, following the pattern in `ActiveWorkflowsWidget`.
**Confidence**: High

**Files to Modify:**
- `app/(app)/workflows/active/page.tsx` - Add cancel confirmation dialog

**Changes:**
- Add `workflowToCancel` state to track which workflow is pending cancellation
- Import Dialog components (`DialogRoot`, `DialogPortal`, `DialogBackdrop`, `DialogPopup`, `DialogTitle`, `DialogDescription`, `DialogClose`)
- Modify `handleCancelWorkflow` to set `workflowToCancel` state instead of immediately canceling
- Add `handleConfirmCancel` function that executes the actual cancel mutation
- Render `DialogRoot` with controlled open state based on `workflowToCancel`
- Include workflow name in dialog description for clarity
- Add "Keep Running" (cancel) and "Cancel Workflow" (confirm) buttons
- Clear `workflowToCancel` on dialog close and after successful cancellation

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Cancel action opens confirmation dialog instead of immediately canceling
- [ ] Dialog displays workflow name being canceled
- [ ] "Keep Running" button closes dialog without action
- [ ] "Cancel Workflow" button executes cancellation and closes dialog
- [ ] Dialog closes after successful cancellation
- [ ] All validation commands pass

---

### Step 6: Add Empty State with Quick Action

**What**: Enhance the empty state to provide a clear call-to-action for creating new workflows when no active workflows exist.
**Why**: An actionable empty state improves UX by guiding users to the next logical step rather than leaving them at a dead end.
**Confidence**: High

**Files to Modify:**
- `app/(app)/workflows/active/page.tsx` - Enhance empty state with navigation action

**Changes:**
- Import `Button` and `Activity` icon for empty state
- Add navigation button to empty state action prop
- Button should navigate to `/workflows/new` for creating new workflow
- Use appropriate icon (Play or Activity) for empty state
- Include helpful description text explaining no active workflows

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Empty state displays when no active workflows exist
- [ ] Empty state includes icon, title, and description
- [ ] Action button navigates to new workflow page
- [ ] Visual design matches other empty states in the application
- [ ] All validation commands pass

---

### Step 7: Integration Testing and Edge Cases

**What**: Verify all integration points work correctly and handle edge cases properly.
**Why**: Ensures the feature works reliably in all scenarios including error states, concurrent operations, and state transitions.
**Confidence**: High

**Files to Modify:**
- `app/(app)/workflows/active/page.tsx` - Add edge case handling

**Changes:**
- Add error handling for mutation failures with appropriate toast messages
- Ensure action buttons are disabled during pending operations (check all three: cancel, pause, resume)
- Handle case where workflow status changes between click and mutation (stale state)
- Verify project map handles missing project gracefully (show "Unknown Project")
- Test filter combinations work correctly together
- Verify table persistence settings are properly configured with unique tableId

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] All mutation errors display appropriate error toast
- [ ] All action buttons properly disabled during pending state
- [ ] Missing project displays fallback text
- [ ] Combined filters work correctly
- [ ] Table column preferences persist across page navigations
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm typecheck`
- [ ] All files pass `pnpm lint`
- [ ] Page renders without console errors in development mode
- [ ] Active workflows display with real-time updates (verify polling works)
- [ ] All three workflow actions (pause, resume, cancel) function correctly
- [ ] Filters and sorting work as expected
- [ ] UI preferences persist after page navigation and browser refresh
- [ ] Empty state displays correctly when no active workflows
- [ ] Loading state displays skeleton during initial data fetch
- [ ] Error state displays when data fetch fails
- [ ] Accessibility: proper ARIA labels, keyboard navigation works

## Notes

- **Existing Infrastructure**: The implementation leverages substantial existing infrastructure (hooks, components, patterns) which significantly reduces complexity and ensures consistency.
- **Polling vs Push**: The feature uses 5-second polling via `useActiveWorkflows` rather than IPC push subscriptions. This is the current pattern and works well for the expected update frequency.
- **Grouping by Project**: The refined requirements mention grouping workflows by project. This can be achieved via the table's sorting capabilities (sort by project column) rather than visual grouping rows, which simplifies implementation while meeting the organization need.
- **Bulk Actions**: While mentioned in requirements, bulk action capabilities would require extending the DataTable with row selection. This could be deferred to a follow-up iteration if not critical for initial release.
- **Persistence Store**: The Zustand store for UI preferences should use the persist middleware pattern but may need testing with electron-store to ensure compatibility in the Electron environment.

---

## File Discovery Results

### Critical Priority (to modify)
- `app/(app)/workflows/active/page.tsx` - Placeholder page needing full implementation
- `hooks/queries/use-workflows.ts` - Has useActiveWorkflows hook with 5-second polling
- `components/workflows/workflow-table.tsx` - Existing table component to extend
- `components/workflows/workflow-table-toolbar.tsx` - Existing toolbar to extend

### High Priority (reference)
- `components/workflows/workflows-tab-content.tsx` - Pattern for integrating WorkflowTable
- `hooks/queries/use-projects.ts` - Project queries for project map
- `lib/queries/workflows.ts` - Query key factory
- `electron/ipc/workflow.handlers.ts` - IPC handlers (all needed operations exist)
- `db/repositories/workflows.repository.ts` - Repository with findRunning, status filters
- `db/schema/workflows.schema.ts` - Workflow schema with progress fields
- `components/ui/table/data-table.tsx` - Base DataTable with all features needed

### New Files to Create
- `lib/stores/active-workflows-store.ts` - Zustand store for UI preferences

# Step 2: File Discovery

**Step**: 2 - AI-Powered File Discovery
**Status**: Completed
**Start Time**: 2026-02-01T00:02:00Z
**End Time**: 2026-02-01T00:03:30Z

## Refined Request Input

The active workflows page should be implemented as a full-featured data table displaying all currently running and paused workflows with real-time status updates. The page should use the existing WorkflowTable component to display workflows with columns including workflow name/ID, associated project, workflow type (planning vs. implementation), current status (running, paused, error), progress percentage, and timestamp information. Each row should support inline actions for viewing detailed workflow information, pausing/resuming execution, and canceling workflows, with bulk action capabilities for multi-select operations across workflows. The implementation should integrate TanStack Query for real-time polling of active workflow data with proper cache invalidation when status changes occur via IPC channels, ensuring the table updates automatically as workflows progress or state changes. The page should support grouping workflows by project for better organization, filtering by status and type, and sorting by various columns including progress and timestamp. Client-side state managed through Zustand should handle UI preferences like group visibility, filter selections, and sorting preferences, persisting these across sessions. The page should display relevant workflow metadata such as current step information, estimated time remaining, total steps, completed steps, and any error messages if workflows are in a failed state. Real-time updates should be achieved through IPC subscriptions that push workflow state changes to the renderer, updating the table without requiring manual refresh. The layout should be responsive and integrate with the existing sidebar navigation, following the project's accessibility standards with Base UI components and proper WCAG compliance. Workflow transitions between states should include visual feedback through toast notifications, and the table should handle edge cases like empty states with helpful messaging and quick action buttons to navigate to workflow creation.

## AI Discovery Analysis

### Analysis Summary
- Explored 8 directories
- Examined 45+ candidate files
- Found 18 highly relevant files
- Identified 12 supporting files

## Discovered Files

### Critical Priority (Core Implementation)

| File | Action | Reasoning |
|------|--------|-----------|
| `app/(app)/workflows/active/page.tsx` | Modify | The placeholder page that needs to be fully implemented with the active workflows data table, filtering, and real-time status updates. Currently contains only a header. |
| `hooks/queries/use-workflows.ts` | Modify | Contains the `useActiveWorkflows` hook with 5-second polling already implemented. May need enhancement for additional filtering options or real-time subscription patterns. |
| `components/workflows/workflow-table.tsx` | Reference/Modify | Existing workflow table component with columns, actions (view, edit, cancel), status badges, and progress display. Can be reused or extended for active workflows with additional columns. |
| `components/workflows/workflow-table-toolbar.tsx` | Reference/Modify | Existing toolbar with status and type filters. May need extension for active-specific filtering (e.g., filter by running vs paused). |

### High Priority (Supporting/Integration)

| File | Action | Reasoning |
|------|--------|-----------|
| `components/workflows/workflows-tab-content.tsx` | Reference | Complete example of how to integrate WorkflowTable with filtering, error handling, empty states, and edit dialog. Shows the pattern for implementing the active workflows page. |
| `hooks/queries/use-projects.ts` | Reference | Project query hooks needed for building project map and project-based grouping functionality. |
| `lib/queries/workflows.ts` | Reference | Query key factory for workflows, includes `running` key used by `useActiveWorkflows`. |
| `electron/ipc/workflow.handlers.ts` | Reference | IPC handlers for workflow operations (start, pause, resume, cancel). All needed operations exist. |
| `electron/ipc/channels.ts` | Reference | IPC channel definitions. Workflow channels already include all necessary operations. |
| `db/repositories/workflows.repository.ts` | Reference | Repository with workflow query methods. Contains `findRunning`, status filters, and statistics methods. |
| `db/schema/workflows.schema.ts` | Reference | Workflow schema with status types, progress fields (`currentStepNumber`, `totalSteps`), and error message storage. |
| `components/ui/table/data-table.tsx` | Reference | Base DataTable component with full feature set: row selection, persistence, empty states, toolbars, and all filtering capabilities needed. |
| `components/ui/table/types.ts` | Reference | DataTable type definitions including row actions, empty state config, and persistence options. |

### Medium Priority (May Need Updates)

| File | Action | Reasoning |
|------|--------|-----------|
| `lib/stores/pipeline-store.ts` | Reference | Existing Zustand store pattern. May need a new `active-workflows-store.ts` for UI preferences like group visibility and filter persistence. |
| `lib/stores/shell-store.ts` | Reference | Example of Zustand store with persistence patterns for sidebar state. |
| `hooks/use-toast.ts` | Reference | Toast hook for workflow state change notifications (pause, resume, cancel feedback). |
| `hooks/use-electron.ts` | Reference | ElectronAPI wrapper with workflow operations. All needed methods are already exposed. |
| `components/ui/empty-state.tsx` | Reference | Empty state component for when no active workflows exist. Shows pattern for icon, description, and action button. |
| `electron/preload.ts` | Reference | Preload script with ElectronAPI type definitions. Defines `WorkflowHistoryFilters`, `WorkflowStatistics`, and all workflow methods. |

### Low Priority (For Reference)

| File | Action | Reasoning |
|------|--------|-----------|
| `components/workflows/index.ts` | Reference | Barrel export file. Will need update to export any new active workflow-specific components. |
| `hooks/queries/index.ts` | Reference | Query hooks barrel export. Exports `useActiveWorkflows` but may need additional exports if new hooks are created. |
| `db/schema/workflow-steps.schema.ts` | Reference | Step schema with status and type fields. Useful for understanding step progress data that may be displayed. |
| `app/(app)/workflows/history/page.tsx` | Reference | Similar placeholder page for comparison. Also needs implementation but separate from active workflows. |

## Architecture Insights

### Key Patterns Discovered

1. **Query Polling Pattern**: `useActiveWorkflows` already implements 5-second polling via `refetchInterval: 5000`. Active statuses filter (`running`, `paused`, `editing`) is defined.

2. **Table Component Reuse**: `WorkflowTable` provides full column definitions, action handlers, and styling. It's designed for reuse via props like `toolbarContent`, `onCancel`, `onViewDetails`.

3. **Filter State Management**: `WorkflowsTabContent` shows local React state for filters with controlled components. A Zustand store could replace this for persistence.

4. **Project Map Pattern**: Tables receive a `projectMap: Record<number, string>` for displaying project names. Projects need to be fetched separately and mapped.

5. **Empty State Handling**: Three-state pattern (loading skeleton, error, empty) with `EmptyState` component and action buttons.

### Existing Similar Functionality

- `WorkflowsTabContent` is 95% similar to what's needed for the active workflows page - it fetches workflows, applies filters, handles cancel/edit actions, and displays in table format.
- The main differences for active workflows: different query hook (`useActiveWorkflows` vs `useWorkflowsByProject`), additional columns (current step info, estimated time), and project grouping.

### Integration Points Identified

1. **Navigation**: Page integrates with sidebar via `app/(app)/workflows/active/` route structure.
2. **IPC Layer**: All workflow operations (pause, resume, cancel) are available via `useElectronDb().workflows`.
3. **Query Invalidation**: `useCancelWorkflow`, `usePauseWorkflow`, `useResumeWorkflow` mutations already invalidate `workflowKeys.running`.
4. **Type Safety**: `Workflow` type from schema includes all needed fields for display.

## File Path Validation

| Path | Exists | Accessible |
|------|--------|------------|
| `app/(app)/workflows/active/page.tsx` | Yes | Yes |
| `hooks/queries/use-workflows.ts` | Yes | Yes |
| `components/workflows/workflow-table.tsx` | Yes | Yes |
| `components/workflows/workflow-table-toolbar.tsx` | Yes | Yes |
| `components/workflows/workflows-tab-content.tsx` | Yes | Yes |

## Discovery Statistics

| Metric | Value |
|--------|-------|
| Total files discovered | 23 |
| Files to modify | 2-3 |
| Files for reference | 20 |
| Directories explored | 8 |
| Candidate files examined | 45+ |

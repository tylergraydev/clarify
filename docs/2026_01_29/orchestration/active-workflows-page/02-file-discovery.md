# Step 2: AI-Powered File Discovery

## Step Metadata

| Field | Value |
|-------|-------|
| Step | 2 - File Discovery |
| Started | 2026-01-29T00:02:00Z |
| Completed | 2026-01-29T00:03:00Z |
| Duration | ~60 seconds |
| Status | Completed |

## Refined Request Used

The Active Workflows page provides a centralized view of all running and paused workflows in the Clarify orchestration system, enabling users to monitor parallel execution across multiple features or implementations at a glance. The page displays workflow cards in a responsive grid layout, each showing the workflow type icon, descriptive title, current step progress with a visual progress bar indicating completion percentage, elapsed time tracking, and current workflow status (running, paused, failed, etc.) with color-coded badges for quick visual identification. Each workflow card includes quick-action buttons for essential workflow management: a "View" button to navigate to the full workflow details, a contextual pause/resume button that toggles based on the current state, and a cancel button for terminating workflows. The page integrates real-time status updates via TanStack Query to automatically refresh workflow states and progress indicators without manual page reload, providing users with continuous visibility into long-running operations.

## Discovery Analysis

### Exploration Summary
- Explored 15+ directories
- Examined 40+ candidate files
- Found 12 highly relevant files
- Identified 15 supporting files

## Discovered Files

### Critical Priority (Core Implementation)

| File | Description | Action |
|------|-------------|--------|
| `app/(app)/workflows/active/page.tsx` | The main Active Workflows page - currently a placeholder | **MODIFY** |
| `hooks/queries/use-workflows.ts` | TanStack Query hooks for workflow data fetching - add `useActiveWorkflows` with polling | **MODIFY** |
| `components/workflows/workflow-card.tsx` | Existing workflow card component with progress, badges, actions | **REFERENCE/MODIFY** |

### High Priority (Supporting Implementation)

| File | Description | Action |
|------|-------------|--------|
| `app/(app)/dashboard/_components/active-workflows-widget.tsx` | Reference implementation for active workflow display | **REFERENCE** |
| `lib/queries/workflows.ts` | Query key factory - may need `active` key | **MODIFY** |
| `app/(app)/workflows/[id]/_components/workflow-control-bar.tsx` | Pause/resume/cancel button logic reference | **REFERENCE** |
| `db/schema/workflows.schema.ts` | Workflow status types (running, paused, editing, etc.) | **REFERENCE** |
| `electron/ipc/workflow.handlers.ts` | IPC handlers for workflow operations | **REFERENCE** |

### Medium Priority (Integration Points)

| File | Description | Action |
|------|-------------|--------|
| `components/ui/badge.tsx` | Badge component for status display | **REFERENCE** |
| `components/ui/card.tsx` | Card component primitives | **REFERENCE** |
| `components/ui/button.tsx` | Button component for actions | **REFERENCE** |
| `components/ui/empty-state.tsx` | Empty state when no active workflows | **REFERENCE** |
| `hooks/queries/use-projects.ts` | Project data for workflow cards | **REFERENCE** |
| `components/data/query-error-boundary.tsx` | Error boundary for TanStack Query | **REFERENCE** |
| `db/repositories/workflows.repository.ts` | Workflow repository methods | **REFERENCE** |

### Low Priority (Reference/Context)

| File | Description | Action |
|------|-------------|--------|
| `app/(app)/workflows/page.tsx` | Workflows list page patterns | **REFERENCE** |
| `app/(app)/layout.tsx` | App shell layout structure | **REFERENCE** |
| `types/electron.d.ts` | ElectronAPI type definitions | **REFERENCE** |
| `types/component-types.ts` | Global component types | **REFERENCE** |
| `lib/utils.ts` | Utility functions (cn, etc.) | **REFERENCE** |
| `hooks/use-electron.ts` | Electron API detection hook | **REFERENCE** |
| `components/providers/query-provider.tsx` | QueryClient configuration | **REFERENCE** |
| `components/shell/app-sidebar.tsx` | Sidebar navigation structure | **REFERENCE** |
| `db/schema/workflow-steps.schema.ts` | Step schema for progress data | **REFERENCE** |
| `app/(app)/workflows/[id]/_components/step-status-badge.tsx` | Step status patterns | **REFERENCE** |

## File Path Validation

All discovered file paths verified to exist in the codebase:

- `app/(app)/workflows/active/page.tsx` - EXISTS (placeholder)
- `hooks/queries/use-workflows.ts` - EXISTS
- `components/workflows/workflow-card.tsx` - EXISTS
- `app/(app)/dashboard/_components/active-workflows-widget.tsx` - EXISTS
- `lib/queries/workflows.ts` - EXISTS
- `db/schema/workflows.schema.ts` - EXISTS
- `components/ui/badge.tsx` - EXISTS
- `components/ui/card.tsx` - EXISTS
- `components/ui/button.tsx` - EXISTS
- `components/ui/empty-state.tsx` - EXISTS

## Architecture Insights

### Key Patterns Discovered

1. **Active Workflows Filtering**: Filter by status (`running`, `paused`, `editing`) to identify active workflows
2. **Progress Calculation**: `(currentStepNumber / totalSteps) * 100` with null handling
3. **Elapsed Time Formatting**: Uses `date-fns` (`differenceInHours`, `differenceInMinutes`, `formatDistanceToNow`)
4. **Status Badge Variants**: Established mapping of statuses to color variants
5. **TanStack Query Patterns**: Query key factories with `@lukemorales/query-key-factory`
6. **Real-time Updates**: Use `refetchInterval` for polling active workflows

### Existing Similar Functionality

- `ActiveWorkflowsWidget` in dashboard - nearly identical functionality in widget format
- `WorkflowCard` component - full-featured card layout ready for reuse
- `WorkflowControlBar` - pause/resume/cancel button logic

### Integration Points

1. **Navigation**: `/workflows/active` already linked from sidebar
2. **Query Hooks**: Extend with `useActiveWorkflows` hook
3. **Actions**: Reuse existing mutation hooks (`usePauseWorkflow`, `useResumeWorkflow`, `useCancelWorkflow`)
4. **Routing**: Use `next-typesafe-url` `$path` for navigation

## Discovery Statistics

| Metric | Value |
|--------|-------|
| Total Files Discovered | 24 |
| Critical Priority | 3 |
| High Priority | 5 |
| Medium Priority | 7 |
| Low Priority | 9 |
| Files to Modify | 4 |
| Files for Reference | 20 |

## Progress Marker

`MILESTONE:STEP_2_COMPLETE`

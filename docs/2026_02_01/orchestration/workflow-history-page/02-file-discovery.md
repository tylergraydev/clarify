# Step 2: AI-Powered File Discovery

**Status**: Completed
**Started**: 2026-02-01
**Duration**: ~45 seconds

## Input

### Refined Feature Request
Implement a complete workflow history page for the Clarify application that displays all completed, cancelled, and failed workflows in a full-featured data table with server-side pagination, comprehensive filtering, and search capabilities. The page should follow established patterns from the existing Active Workflows page, including the same layout structure, component composition, and state management approach. Implement all filtering options: workflow status (completed, cancelled, failed), workflow type, associated project, date range selection, and full-text search across workflow names and descriptions. The table should support TanStack Table features including column sorting, resizing, and visibility toggles with persistence of user preferences. The implementation must use TanStack Query for efficient data fetching with proper cache invalidation, integrate nuqs for URL-based query state management to preserve filters across navigation, and leverage the repository pattern for database queries with server-side filtering and pagination support. The page should display relevant workflow metadata such as workflow name, type, associated project, execution date, duration, status, and number of steps completed. Use Base UI components with CVA patterns for consistent styling throughout, implement proper loading and error states with error boundaries, and ensure responsive design that adapts to various screen sizes.

## Discovery Analysis

### Search Coverage
- Explored 12+ directories
- Examined 45+ candidate files
- Found 15 highly relevant files (critical/high priority)
- Identified 20+ supporting and reference files

## Discovered Files by Priority

### Critical Priority (Must Modify)

| File | Modification Type | Reason |
|------|------------------|--------|
| `app/(app)/workflows/history/page.tsx` | MODIFY | Replace placeholder page with full history implementation |
| `app/(app)/workflows/history/route-type.ts` | MODIFY | Add search params for URL state management |

### High Priority (Supporting Implementation)

| File | Type | Reason |
|------|------|--------|
| `hooks/queries/use-workflows.ts` | REFERENCE | Already has `useWorkflowHistory` and `useWorkflowStatistics` hooks |
| `lib/queries/workflows.ts` | REFERENCE | Already has `history` and `historyStatistics` query keys |
| `db/repositories/workflows.repository.ts` | REFERENCE | Already has `findHistory` and `getHistoryStatistics` methods |
| `electron/ipc/workflow.handlers.ts` | REFERENCE | Already has `listHistory` and `getStatistics` IPC handlers |
| `electron/ipc/channels.ts` | REFERENCE | Already has channel constants |
| `electron/preload.ts` | REFERENCE | Already exposes API methods |
| `types/electron.d.ts` | REFERENCE | Already has TypeScript types defined |

### Medium Priority (Pattern References)

| File | Purpose |
|------|---------|
| `app/(app)/workflows/active/page.tsx` | Primary reference for page structure, state management |
| `app/(app)/projects/page.tsx` | Reference for nuqs URL state management pattern |
| `components/workflows/workflow-table.tsx` | Table component reference |
| `components/workflows/workflow-table-toolbar.tsx` | Toolbar filter component reference |
| `components/workflows/index.ts` | Export barrel |
| `lib/stores/active-workflows-store.ts` | Zustand store pattern reference |
| `lib/layout/constants.ts` | Storage key and default value patterns |

### Low Priority (UI Component References)

| File | Purpose |
|------|---------|
| `components/ui/table/data-table.tsx` | DataTable component with pagination, sorting |
| `components/ui/table/data-table-pagination.tsx` | Pagination component |
| `components/ui/table/data-table-skeleton.tsx` | Loading skeleton |
| `components/ui/badge.tsx` | Badge variants for status display |
| `components/ui/empty-state.tsx` | Empty state component |
| `components/ui/select.tsx` | Select component for filters |
| `components/ui/input.tsx` | Input component for date inputs |
| `components/data/query-error-boundary.tsx` | Error boundary wrapper |
| `hooks/queries/use-projects.ts` | Project list fetching |

## Key Architecture Insights

### Existing Infrastructure (Already Built)
The data layer for workflow history is **already fully implemented**:
- Repository methods `findHistory()` and `getHistoryStatistics()` support filtering, pagination, sorting
- IPC channels and handlers are registered
- Preload script exposes the API methods
- TanStack Query hooks `useWorkflowHistory()` and `useWorkflowStatistics()` are ready
- Query key factory includes history-specific keys

### Key Patterns to Follow

1. **URL State Management with nuqs**: Follow projects page pattern using `useQueryState`
2. **Page Structure**: Follow active workflows pattern (loading/error/empty/content states)
3. **Filter Implementation**: Use `WorkflowTableToolbar` as reference, add date range filter
4. **Table Component**: Consider history-specific variant with duration/completion columns

### Integration Points

- **Date formatting**: Use `date-fns` `format` function
- **Duration formatting**: Use `date-fns` utilities
- **Navigation**: Use `$path` from `next-typesafe-url`
- **Toast notifications**: Use `useToast` hook
- **Project map**: Fetch projects with `useProjects`

## Potential New Files to Create

| File | Description |
|------|-------------|
| `components/workflows/workflow-history-table.tsx` | History-specific table with duration, completedAt columns |
| `components/workflows/history-table-toolbar.tsx` | History-specific toolbar with date range filter |
| `components/workflows/history-statistics-cards.tsx` | Statistics summary cards (optional) |
| `lib/stores/workflow-history-store.ts` | Zustand store for filter persistence (optional) |

## File Validation Results

All discovered file paths were validated to exist in the codebase.

## Discovery Statistics

- Total files discovered: 23+
- Critical files: 2
- High priority: 7
- Medium priority: 7
- Low priority: 9
- New files to create: 2-4

## Next Step
Proceed to Step 3: Implementation Planning with the discovered files and patterns.

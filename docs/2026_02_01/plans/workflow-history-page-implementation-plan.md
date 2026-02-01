# Workflow History Page - Implementation Plan

**Generated**: 2026-02-01
**Original Request**: "The workflow history page"
**Refined Request**: Implement a complete workflow history page for the Clarify application that displays all completed, cancelled, and failed workflows in a full-featured data table with server-side pagination, comprehensive filtering, and search capabilities. The page should follow established patterns from the existing Active Workflows page, including the same layout structure, component composition, and state management approach. Implement all filtering options: workflow status (completed, cancelled, failed), workflow type, associated project, date range selection, and full-text search across workflow names and descriptions. The table should support TanStack Table features including column sorting, resizing, and visibility toggles with persistence of user preferences. The implementation must use TanStack Query for efficient data fetching with proper cache invalidation, integrate nuqs for URL-based query state management to preserve filters across navigation, and leverage the repository pattern for database queries with server-side filtering and pagination support. The page should display relevant workflow metadata such as workflow name, type, associated project, execution date, duration, status, and number of steps completed. Use Base UI components with CVA patterns for consistent styling throughout, implement proper loading and error states with error boundaries, and ensure responsive design that adapts to various screen sizes.

## Analysis Summary

- Feature request refined with project context
- Discovered 23+ files across multiple directories
- Generated 8-step implementation plan
- Data layer already fully implemented (repository, IPC, query hooks)
- Primarily frontend implementation task

## File Discovery Results

### Critical (Must Modify)
- `app/(app)/workflows/history/page.tsx` - Replace placeholder with full implementation
- `app/(app)/workflows/history/route-type.ts` - Add URL search params

### High Priority (Reference - Already Implemented)
- `hooks/queries/use-workflows.ts` - Has useWorkflowHistory, useWorkflowStatistics hooks
- `lib/queries/workflows.ts` - Has history query keys
- `db/repositories/workflows.repository.ts` - Has findHistory, getHistoryStatistics methods
- `electron/ipc/workflow.handlers.ts` - Has listHistory, getStatistics handlers
- `types/electron.d.ts` - Has WorkflowHistoryFilters, WorkflowHistoryResult types

### New Files to Create
- `components/workflows/workflow-history-table.tsx` - History-specific table
- `components/workflows/history-table-toolbar.tsx` - History-specific toolbar with date range

---

## Overview

**Estimated Duration**: 1-2 days
**Complexity**: Medium
**Risk Level**: Low

## Quick Summary

Implement a complete Workflow History page that displays all completed, cancelled, and failed workflows in a full-featured data table with server-side pagination, comprehensive filtering (status, type, project, date range), and search capabilities. The data layer (repository, IPC handlers, query hooks) is already fully implemented, making this primarily a frontend implementation task that follows established patterns from the Active Workflows page.

## Prerequisites

- [ ] Existing `useWorkflowHistory` and `useWorkflowStatistics` hooks are functional
- [ ] IPC handlers `workflow.listHistory` and `workflow.getStatistics` are implemented
- [ ] Repository methods `findHistory` and `getHistoryStatistics` are working
- [ ] Familiarity with the Active Workflows page patterns at `app/(app)/workflows/active/page.tsx`

## Implementation Steps

### Step 1: Create Route Type File for URL State Management

**What**: Create `route-type.ts` with Zod schema for all URL search parameters (status, type, project, date range, page, search)
**Why**: Enables type-safe URL state management with nuqs and next-typesafe-url, preserving filter state across navigation
**Confidence**: High

**Files to Create:**
- `app/(app)/workflows/history/route-type.ts` - Zod schema for URL search params

**Changes:**
- Define search params schema with:
  - `status` - Array of terminal status values (completed, cancelled, failed)
  - `type` - Workflow type filter (all, planning, implementation)
  - `project` - Project ID filter (coerced number)
  - `dateFrom` - Date range start (ISO string)
  - `dateTo` - Date range end (ISO string)
  - `search` - Full-text search term
  - `page` - Current page number (coerced positive integer)
  - `pageSize` - Items per page (coerced positive integer with default 20)
  - `sortBy` - Sort field matching `WorkflowHistorySortField` type
  - `sortOrder` - Sort direction (asc/desc)
- Export `Route` satisfying `DynamicRoute` type
- Export `RouteType` for type inference

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Route type file created with all filter parameters
- [ ] Schema uses proper Zod coercion for numeric values
- [ ] All validation commands pass

---

### Step 2: Create History Table Toolbar Component

**What**: Create `history-table-toolbar.tsx` with filters popover containing status multi-select, type select, project select, and date range inputs
**Why**: Provides the UI for all filtering capabilities specific to workflow history (date range is unique to history)
**Confidence**: High

**Files to Create:**
- `components/workflows/history-table-toolbar.tsx` - Toolbar with history-specific filters

**Changes:**
- Create `HistoryTableToolbarProps` interface with callbacks for all filter changes
- Create constants for terminal status filter options (completed, cancelled, failed)
- Implement status filter as multi-select allowing multiple terminal statuses
- Implement type filter as single select (all, planning, implementation)
- Implement project filter as single select populated from projects list
- Implement date range inputs using native date inputs for `dateFrom` and `dateTo`
- Implement active filter count badge calculation
- Implement reset filters button functionality
- Follow existing `WorkflowTableToolbar` patterns for Popover structure
- Export all relevant types for parent component usage

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Toolbar renders with Filters popover button
- [ ] Status multi-select allows selecting multiple terminal statuses
- [ ] Date range inputs accept and validate date values
- [ ] Filter count badge shows correct active filter count
- [ ] Reset button clears all filters to defaults
- [ ] All validation commands pass

---

### Step 3: Create Workflow History Table Component

**What**: Create `workflow-history-table.tsx` table component optimized for displaying historical workflows with relevant columns
**Why**: Provides a specialized table view for completed workflows with appropriate columns (duration, completed date) and no action buttons for pause/resume
**Confidence**: High

**Files to Create:**
- `components/workflows/workflow-history-table.tsx` - History-specific table component

**Changes:**
- Create `WorkflowHistoryTableProps` interface extending relevant DataTable props
- Define columns using column helper:
  - Actions column with View Details action only
  - Feature Name column (sortable, clickable link)
  - Project column (display project name from map)
  - Type column with badge (sortable)
  - Status column with appropriate badge variants (sortable)
  - Steps Completed column showing progress (X/Y format)
  - Duration column formatted as human-readable time (sortable)
  - Completed At column with formatted date (sortable, filler column)
- Configure DataTable with:
  - Server-side pagination enabled via `isPaginationEnabled` and `onPaginationChange`
  - Column persistence with unique `tableId` for history table
  - Appropriate empty states for no data and no results
  - Row click handler for navigation to workflow details
  - Row style callback for reduced opacity on failed/cancelled workflows
- Accept `toolbarContent` prop for filter toolbar integration
- Implement duration formatting helper function (ms to human-readable)

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Table renders with all specified columns
- [ ] Duration displays in human-readable format
- [ ] Badge variants match status appropriately
- [ ] Table supports server-side pagination props
- [ ] Row click navigates to workflow detail
- [ ] All validation commands pass

---

### Step 4: Update Components Index Export

**What**: Add exports for the new history table components to the workflows components index
**Why**: Enables clean imports from `@/components/workflows` barrel export
**Confidence**: High

**Files to Modify:**
- `components/workflows/index.ts` - Add exports for new components

**Changes:**
- Add export for `HistoryTableToolbar` component and its types
- Add export for `WorkflowHistoryTable` component and its types

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] New components are exported from barrel file
- [ ] Types are properly exported for external use
- [ ] All validation commands pass

---

### Step 5: Implement Workflow History Page

**What**: Replace placeholder page with full implementation including data fetching, URL state, filtering, and pagination
**Why**: Provides the complete user interface for viewing and filtering workflow history
**Confidence**: High

**Files to Modify:**
- `app/(app)/workflows/history/page.tsx` - Full page implementation

**Changes:**
- Add `'use client'` directive (already present, verify)
- Import necessary dependencies:
  - Icons from lucide-react (History, AlertCircle, RefreshCw)
  - $path from next-typesafe-url
  - withParamValidation HOC from next-typesafe-url/app/hoc
  - useRouter from next/navigation
  - nuqs hooks (useQueryState, parseAsStringLiteral, parseAsInteger, parseAsArrayOf, parseAsString)
  - Route from local route-type
  - QueryErrorBoundary from data components
  - UI components (Button, EmptyState, DataTableSkeleton)
  - New history table components (WorkflowHistoryTable, HistoryTableToolbar)
  - Query hooks (useWorkflowHistory, useProjects)
  - useToast hook
- Implement URL state management with nuqs for all filter parameters
- Build `WorkflowHistoryFilters` object from URL state for query hook
- Fetch workflow history data using `useWorkflowHistory(filters)`
- Fetch projects for filter dropdown using `useProjects()`
- Build project map and project filter options from projects data
- Implement filter change handlers that update URL state
- Implement reset filters handler
- Implement refresh handler for manual data refresh
- Implement view details handler navigating to workflow detail page
- Render loading state with DataTableSkeleton
- Render error state with EmptyState and retry action
- Render empty state when no history exists
- Render content state with WorkflowHistoryTable and HistoryTableToolbar
- Wrap page component with withParamValidation HOC

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Page loads and displays workflow history data
- [ ] All filters update URL state and refetch data
- [ ] Pagination controls work with server-side pagination
- [ ] Loading skeleton displays during data fetch
- [ ] Error state displays with retry functionality
- [ ] Empty state displays when no workflows exist
- [ ] Navigation to workflow detail page works
- [ ] Filter state persists across page navigation (via URL)
- [ ] All validation commands pass

---

### Step 6: Add Server-Side Pagination Support to History Query Hook

**What**: Verify and enhance the `useWorkflowHistory` hook to properly support pagination state changes and cache invalidation
**Why**: Ensures smooth pagination experience with proper cache management for server-side pagination
**Confidence**: High

**Files to Modify:**
- `hooks/queries/use-workflows.ts` - Verify pagination support

**Changes:**
- Verify `useWorkflowHistory` hook properly passes filters including pagination params
- Verify query key includes all filter parameters for proper cache isolation
- Add `keepPreviousData: true` option if not present for smooth pagination transitions
- Ensure proper type inference for `WorkflowHistoryResult` return type

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Hook properly accepts all filter parameters
- [ ] Query key uniquely identifies each filter combination
- [ ] Pagination transitions maintain previous data display
- [ ] All validation commands pass

---

### Step 7: Implement Controlled Pagination in History Table

**What**: Add controlled pagination state and callbacks to connect page URL state with DataTable pagination
**Why**: Enables server-side pagination to work correctly with URL-based state management
**Confidence**: Medium

**Files to Modify:**
- `components/workflows/workflow-history-table.tsx` - Add pagination props
- `app/(app)/workflows/history/page.tsx` - Connect pagination state

**Changes:**
- In WorkflowHistoryTable:
  - Add props for `pageIndex`, `pageSize`, `pageCount`, `totalCount`
  - Add callback props `onPageChange`, `onPageSizeChange`
  - Pass pagination state to DataTable via `state.pagination`
  - Pass `onPaginationChange` callback to DataTable
  - Enable pagination in DataTable with `isPaginationEnabled={true}`
- In page.tsx:
  - Calculate `pageCount` from `total` and `pageSize` returned by query
  - Create `onPaginationChange` handler that updates URL state for page/pageSize
  - Pass all pagination props to WorkflowHistoryTable

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Page navigation buttons work correctly
- [ ] Page size selector updates URL and refetches data
- [ ] Current page persists in URL across navigation
- [ ] Page count calculated correctly from total results
- [ ] All validation commands pass

---

### Step 8: Add Statistics Summary Section

**What**: Add a statistics summary section above the table showing completion rate, average duration, and status counts
**Why**: Provides quick insights into workflow history performance metrics
**Confidence**: Medium

**Files to Modify:**
- `app/(app)/workflows/history/page.tsx` - Add statistics display

**Changes:**
- Import `useWorkflowStatistics` hook
- Fetch statistics data with same date/project filters as history query
- Create statistics display section with cards showing:
  - Total workflows count
  - Success rate percentage
  - Average duration
  - Completed/Failed/Cancelled counts
- Position statistics section between header and table
- Add loading state for statistics
- Handle case when statistics are unavailable

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Statistics section displays above table
- [ ] Statistics update when filters change
- [ ] Loading state shows while fetching
- [ ] Displays gracefully when no data available
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm typecheck`
- [ ] All files pass `pnpm lint`
- [ ] Page renders without console errors
- [ ] All filter combinations produce expected results
- [ ] Pagination navigates correctly through all pages
- [ ] URL state persists across page refreshes
- [ ] Empty states display appropriately for no data and no results
- [ ] Error boundary catches and displays fetch errors gracefully
- [ ] Table column preferences persist across sessions
- [ ] Responsive design works on various screen sizes

## Notes

**Architecture Decisions:**

1. **URL State Management**: Using nuqs for URL-based filter state provides shareable links and browser history support. This matches the projects page pattern.

2. **Server-Side Pagination**: The repository already supports server-side pagination with `limit`, `offset`, and returns `total` count. The page will manage pagination state in URL params.

3. **Controlled vs Uncontrolled Table**: The DataTable component supports both modes. For server-side pagination, we use controlled pagination state passed via props.

4. **Separate History Table**: Creating a dedicated `WorkflowHistoryTable` component rather than reusing `WorkflowTable` because:
   - History needs different columns (Duration, Completed At instead of Updated At)
   - History shows only View action, no Pause/Resume/Cancel
   - Server-side pagination requirements differ from client-side filtering

5. **Date Range Implementation**: Using native HTML date inputs (`<input type="date">`) wrapped in the Input component for simplicity. If a date picker component exists or is added later, it can be swapped in.

**Risks and Mitigations:**

- **Risk**: DataTable may not fully support server-side pagination out of the box
  - **Mitigation**: Step 7 specifically addresses connecting controlled pagination state; may need to enhance DataTable if issues arise

- **Risk**: Date inputs may have browser inconsistencies
  - **Mitigation**: Using ISO date strings (YYYY-MM-DD) which have good cross-browser support; can enhance with dedicated date picker component later

**Assumptions Requiring Validation:**

- The existing `useWorkflowHistory` hook correctly handles filter parameter changes
- The `WorkflowHistoryResult` type includes all necessary pagination metadata
- DataTable's `onPaginationChange` callback provides the expected `PaginationState` format

# Workflow History Page Implementation Plan

**Generated**: 2026-01-29
**Original Request**: Workflow History Page Implementation with terminal status filtering, date range filtering, and completion metrics
**Refined Request**: The Workflow History page at `/workflows/history` needs to be implemented to replace the current placeholder, completing the workflow management experience alongside the active workflows page. This page should display workflows filtered by terminal statuses (completed, failed, cancelled) using the existing TanStack Query infrastructure and query key factory pattern from `lib/queries/`. The implementation requires building a filterable data table component using Base UI primitives with CVA variants, displaying columns for feature name, workflow type, final status with appropriate color-coded badges, duration (using the `durationMs` field formatted via date-fns), and completion date (`completedAt` timestamp). Date range filtering should be added to allow users to narrow results by time period, implemented using controlled date inputs that update URL query state via nuqs for shareable/bookmarkable filter states. The page should include completion metrics summary cards showing counts and percentages for each terminal status, success rate calculations, and average duration statistics, providing at-a-glance insights into workflow outcomes. The underlying data fetching should leverage the existing workflow repository in `db/repositories/` with appropriate filtering parameters passed through the Electron IPC bridge, using the established `workflow.handlers.ts` pattern for the main process query. Pagination should be implemented for large history sets, with the table supporting sorting by date, duration, and status. Each row should be clickable to navigate to a detailed workflow view, and a context menu or action column should provide quick access to export audit logs for individual workflows.

## Analysis Summary

- Feature request refined with project context
- Discovered 23 files across 12 directories
- Generated 14-step implementation plan

## File Discovery Results

### Critical Files (Must Modify)

| File | Status | Description |
|------|--------|-------------|
| `app/(app)/workflows/history/page.tsx` | MODIFY | Replace placeholder with full implementation |
| `hooks/queries/use-workflows.ts` | MODIFY | Add history and statistics hooks |
| `lib/queries/workflows.ts` | MODIFY | Add history query keys |
| `db/repositories/workflows.repository.ts` | MODIFY | Add history query methods |
| `electron/ipc/workflow.handlers.ts` | MODIFY | Add history IPC handlers |
| `electron/ipc/channels.ts` | MODIFY | Add channel constants |
| `electron/preload.ts` | MODIFY | Expose new API methods |
| `types/electron.d.ts` | MODIFY | Add type definitions |

### New Files to Create

| File | Description |
|------|-------------|
| `components/workflows/history-statistics-cards.tsx` | Statistics summary component |
| `components/workflows/workflow-history-table.tsx` | History table component |
| `components/workflows/date-range-filter.tsx` | Date range filter component |
| `components/ui/pagination.tsx` | Generic pagination component |
| `app/(app)/workflows/history/route-type.ts` | URL route type definition |

### Reference Files

| File | Purpose |
|------|---------|
| `app/(app)/workflows/page.tsx` | URL state pattern via nuqs |
| `app/(app)/templates/page.tsx` | Table/filter patterns |
| `components/workflows/workflow-table.tsx` | Table structure reference |
| `app/(app)/dashboard/_components/statistics-widget.tsx` | Statistics calculation |
| `components/ui/badge.tsx` | Status badge variants |

---

## Implementation Plan

## Overview

**Estimated Duration**: 3-4 days
**Complexity**: High
**Risk Level**: Medium

## Quick Summary

This plan implements a comprehensive Workflow History page at `/workflows/history` that displays workflows with terminal statuses (completed, failed, cancelled), featuring filterable data tables, date range filtering with URL state via nuqs, statistics summary cards, pagination, sorting, and audit log export functionality. The implementation follows the established patterns from the existing workflows page and templates page.

## Prerequisites

- [ ] Verify all existing dependencies are installed (nuqs, date-fns, TanStack Query)
- [ ] Confirm understanding of the existing workflow repository and IPC handler patterns
- [ ] Review the existing workflow schema to confirm `durationMs`, `completedAt`, and status fields

## Implementation Steps

### Step 1: Extend Workflows Repository with History-Specific Methods

**What**: Add new repository methods for querying workflows with terminal statuses, date range filtering, pagination, sorting, and statistics aggregation.
**Why**: The data layer must support the specific query requirements for the history page before the IPC handlers can expose this functionality.
**Confidence**: High

**Files to Modify:**

- `db/repositories/workflows.repository.ts` - Add new methods to the repository interface and implementation

**Changes:**

- Add `WorkflowHistoryFilters` interface with properties: `statuses` (array of terminal statuses), `dateFrom`, `dateTo`, `projectId`, `searchTerm`, `sortBy`, `sortOrder`, `limit`, `offset`
- Add `WorkflowHistoryResult` interface with `workflows`, `total`, `page`, `pageSize` properties
- Add `WorkflowStatistics` interface with `completedCount`, `failedCount`, `cancelledCount`, `successRate`, `averageDurationMs` properties
- Add `findHistory(filters: WorkflowHistoryFilters): WorkflowHistoryResult` method that queries workflows with terminal statuses, supports date range filtering using SQL `BETWEEN`, pagination with `LIMIT/OFFSET`, and sorting with `ORDER BY`
- Add `getHistoryStatistics(filters?: { dateFrom?: string; dateTo?: string; projectId?: number }): WorkflowStatistics` method that calculates aggregate statistics for terminal-status workflows

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Repository interface includes new method signatures with proper TypeScript types
- [ ] Implementation correctly builds dynamic SQL queries using Drizzle's `and`, `or`, `inArray`, `gte`, `lte`, `like`, `desc`, `asc` operators
- [ ] Statistics calculation uses SQL aggregation for efficiency
- [ ] All validation commands pass

---

### Step 2: Add IPC Channel Constants for History Endpoints

**What**: Define new IPC channel constants for workflow history listing and statistics.
**Why**: Channel constants must be defined before handlers can be registered, following the established pattern.
**Confidence**: High

**Files to Modify:**

- `electron/ipc/channels.ts` - Add new channel constants to the workflow object

**Changes:**

- Add `listHistory: "workflow:listHistory"` to the `workflow` object in `IpcChannels`
- Add `getStatistics: "workflow:getStatistics"` to the `workflow` object in `IpcChannels`

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] New channel constants follow existing naming convention (`domain:action`)
- [ ] Constants are in alphabetical order within the workflow object
- [ ] All validation commands pass

---

### Step 3: Register History IPC Handlers

**What**: Create IPC handlers for the new history and statistics endpoints.
**Why**: Handlers bridge the gap between the preload API and repository methods, enabling the renderer process to query history data.
**Confidence**: High

**Files to Modify:**

- `electron/ipc/workflow.handlers.ts` - Add new handler registrations

**Changes:**

- Define `WorkflowHistoryFilters` interface matching the repository (for type-safe IPC)
- Add handler for `IpcChannels.workflow.listHistory` that accepts filters parameter and calls `workflowsRepository.findHistory(filters)`
- Add handler for `IpcChannels.workflow.getStatistics` that accepts optional filters and calls `workflowsRepository.getHistoryStatistics(filters)`
- Follow the existing handler pattern with proper `IpcMainInvokeEvent` typing

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Handlers properly type parameters using defined interfaces
- [ ] Handlers return repository results directly
- [ ] Handlers follow existing error handling patterns
- [ ] All validation commands pass

---

### Step 4: Update Preload Script with History API Methods

**What**: Expose the new history and statistics methods through the ElectronAPI context bridge.
**Why**: The preload script acts as the bridge between main and renderer processes; new methods must be exposed here for React hooks to consume.
**Confidence**: High

**Files to Modify:**

- `electron/preload.ts` - Add new methods to the workflow namespace in the API object and update the IpcChannels constant

**Changes:**

- Update the inline `IpcChannels` constant to include `listHistory` and `getStatistics` channels
- Add `WorkflowHistoryFilters` and `WorkflowHistoryResult` types inline (matching repository)
- Add `WorkflowStatistics` type inline
- Add `listHistory(filters?: WorkflowHistoryFilters): Promise<WorkflowHistoryResult>` to the workflow object in `ElectronAPI` interface
- Add `getStatistics(filters?: { dateFrom?: string; dateTo?: string; projectId?: number }): Promise<WorkflowStatistics>` to the workflow object
- Add implementations that invoke the corresponding IPC channels

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] ElectronAPI interface includes new method signatures
- [ ] Implementation uses `ipcRenderer.invoke` with correct channel constants
- [ ] Types are consistent with repository definitions
- [ ] All validation commands pass

---

### Step 5: Update TypeScript Type Definitions for Renderer

**What**: Add the new history-related types to the global ElectronAPI type definition.
**Why**: The renderer-side type definitions must be updated for type-safe hook creation.
**Confidence**: High

**Files to Modify:**

- `types/electron.d.ts` - Add new types and update ElectronAPI interface

**Changes:**

- Add `WorkflowHistoryFilters` interface export with all filter properties
- Add `WorkflowHistoryResult` interface export
- Add `WorkflowStatistics` interface export
- Update the `workflow` object in `ElectronAPI` interface to include `listHistory` and `getStatistics` methods

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Types are properly exported and accessible from `@/types/electron`
- [ ] Interface extends existing workflow API correctly
- [ ] All validation commands pass

---

### Step 6: Extend Query Key Factory with History Keys

**What**: Add query keys for history list, statistics, and related queries.
**Why**: Query key factory pattern ensures consistent cache management and invalidation across the application.
**Confidence**: High

**Files to Modify:**

- `lib/queries/workflows.ts` - Add new query key definitions

**Changes:**

- Add `history` key with filters parameter for paginated history queries
- Add `historyStatistics` key with optional date/project filters
- Follow existing pattern using `createQueryKeys` from `@lukemorales/query-key-factory`

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] New keys follow established naming conventions
- [ ] Keys support filter parameters for cache granularity
- [ ] All validation commands pass

---

### Step 7: Create History-Specific React Query Hooks

**What**: Build TanStack Query hooks for fetching workflow history and statistics.
**Why**: Hooks encapsulate data fetching logic with proper caching, loading states, and error handling.
**Confidence**: High

**Files to Modify:**

- `hooks/queries/use-workflows.ts` - Add new hooks for history functionality

**Changes:**

- Add `useWorkflowHistory(filters: WorkflowHistoryFilters)` hook using `useQuery` with `workflowKeys.history`
- Add `useWorkflowStatistics(filters?: { dateFrom?: string; dateTo?: string; projectId?: number })` hook using `useQuery` with `workflowKeys.historyStatistics`
- Ensure hooks use `enabled: isElectron` pattern for conditional execution
- Follow existing hook patterns for query function implementation

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Hooks properly type filter parameters and return values
- [ ] Hooks use correct query keys for caching
- [ ] Hooks follow established patterns from existing use-workflows.ts
- [ ] All validation commands pass

---

### Step 8: Create Statistics Summary Cards Component

**What**: Build a reusable component displaying workflow history statistics.
**Why**: Statistics cards provide at-a-glance insights into workflow outcomes and should be reusable.
**Confidence**: High

**Files to Create:**

- `components/workflows/history-statistics-cards.tsx` - New statistics display component

**Changes:**

- Create `HistoryStatisticsCards` component accepting `statistics` prop of type `WorkflowStatistics`
- Include cards for: Completed count (with completed badge variant), Failed count (with failed badge variant), Cancelled count (with stale badge variant), Success rate percentage, Average duration (formatted via date-fns)
- Use existing `Card`, `CardContent`, `CardHeader` components from `@/components/ui/card`
- Include loading skeleton state following `StatisticCardSkeleton` pattern from dashboard
- Use appropriate icons from lucide-react (CheckCircle2, XCircle, Ban, Percent, Clock)
- Apply CVA patterns for consistent styling

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Component properly displays all five statistics
- [ ] Loading state shows skeleton placeholders
- [ ] Icons and colors match terminal status semantics
- [ ] All validation commands pass

---

### Step 9: Create History Table Component

**What**: Build a sortable, paginated table component for displaying workflow history.
**Why**: The history table is the primary data display with specific columns and behaviors different from the active workflows table.
**Confidence**: High

**Files to Create:**

- `components/workflows/workflow-history-table.tsx` - New history-specific table component

**Changes:**

- Create `WorkflowHistoryTable` component with columns: Feature Name, Workflow Type, Final Status (with color-coded Badge), Duration (formatted with date-fns `formatDuration`), Completed Date, Actions
- Accept props: `workflows`, `projectMap`, `onViewDetails`, `onExportAuditLog`, `sortBy`, `sortOrder`, `onSortChange`
- Implement sortable column headers with visual indicators (ChevronUp/ChevronDown icons)
- Include clickable rows that navigate to workflow detail view
- Add action column with "Export Audit Log" button using existing `useExportAuditLog` mutation pattern
- Use existing Badge component with appropriate variants (completed, failed, stale)
- Format duration using date-fns: convert `durationMs` to human-readable format (e.g., "1h 23m", "45m")
- Format `completedAt` dates using date-fns `format` function

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Table displays all required columns with proper formatting
- [ ] Sorting indicators reflect current sort state
- [ ] Status badges use correct color variants
- [ ] Duration formatting handles edge cases (null, 0, very long)
- [ ] All validation commands pass

---

### Step 10: Create Pagination Component

**What**: Build a pagination control component for navigating history pages.
**Why**: Pagination is needed to handle large history datasets efficiently.
**Confidence**: High

**Files to Create:**

- `components/ui/pagination.tsx` - New generic pagination component

**Changes:**

- Create `Pagination` component accepting: `currentPage`, `totalPages`, `totalItems`, `pageSize`, `onPageChange`
- Include Previous/Next buttons using existing Button component
- Display current page indicator and total count
- Use ChevronLeft/ChevronRight icons from lucide-react
- Follow existing CVA patterns for consistent styling
- Support disabled states for first/last pages

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Pagination renders with correct page information
- [ ] Previous/Next buttons are disabled appropriately at boundaries
- [ ] Callbacks fire with correct page numbers
- [ ] All validation commands pass

---

### Step 11: Create Date Range Filter Component

**What**: Build date range input controls for filtering history by time period.
**Why**: Date range filtering is a core feature requirement for narrowing history results.
**Confidence**: Medium

**Files to Create:**

- `components/workflows/date-range-filter.tsx` - Date range filter component

**Changes:**

- Create `DateRangeFilter` component with two date inputs (from/to)
- Use native HTML5 date inputs with Input component wrapper for consistent styling
- Accept props: `dateFrom`, `dateTo`, `onDateFromChange`, `onDateToChange`
- Include clear button to reset both dates
- Add preset quick-select options (Last 7 days, Last 30 days, Last 90 days, All time)
- Use date-fns for date calculations (`subDays`, `format`)

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Date inputs properly control date range
- [ ] Preset buttons calculate correct date ranges
- [ ] Clear button resets both values
- [ ] All validation commands pass

---

### Step 12: Implement Workflow History Page

**What**: Replace the placeholder with the full-featured history page implementation.
**Why**: This is the core deliverable that ties all components together.
**Confidence**: High

**Files to Modify:**

- `app/(app)/workflows/history/page.tsx` - Replace placeholder content

**Changes:**

- Add `"use client"` directive for client-side interactivity
- Import all required components, hooks, and utilities
- Implement URL query state using nuqs for: `dateFrom`, `dateTo`, `status` (optional terminal status filter), `projectId`, `search`, `page`, `pageSize`, `sortBy`, `sortOrder`
- Wire up `useWorkflowHistory` hook with filter parameters from URL state
- Wire up `useWorkflowStatistics` hook with date range and project filters
- Render `HistoryStatisticsCards` with statistics data
- Render filter controls: `DateRangeFilter`, status Select, project Select, search Input
- Render `WorkflowHistoryTable` with fetched workflows
- Render `Pagination` component with page controls
- Include `QueryErrorBoundary` for error handling
- Add loading skeletons matching table and cards
- Add empty state using `EmptyState` component when no history exists
- Implement navigation to workflow detail using `$path` from `next-typesafe-url`
- Implement audit log export using `useExportAuditLog` mutation with toast notifications

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Page renders with all sections (statistics, filters, table, pagination)
- [ ] URL state persists filter selections (shareable/bookmarkable)
- [ ] Data fetches correctly with applied filters
- [ ] Sorting and pagination work correctly
- [ ] Export audit log functionality works with toast feedback
- [ ] All validation commands pass

---

### Step 13: Add Route Type for URL Validation (Optional Enhancement)

**What**: Create route type definition for type-safe URL parameter validation.
**Why**: Following the existing pattern from the workflows page for consistent URL validation.
**Confidence**: Medium

**Files to Create:**

- `app/(app)/workflows/history/route-type.ts` - Route type definition

**Changes:**

- Define `Route` object with `searchParams` Zod schema
- Include validation for: `dateFrom` (optional string), `dateTo` (optional string), `status` (optional enum), `projectId` (optional number), `search` (optional string), `page` (optional number), `pageSize` (optional number), `sortBy` (optional string), `sortOrder` (optional enum)
- Follow pattern from `app/(app)/workflows/route-type.ts`

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
pnpm run next-typesafe-url
```

**Success Criteria:**

- [ ] Route type exports valid Zod schema
- [ ] Type generation succeeds
- [ ] All validation commands pass

---

### Step 14: Integration Testing and Polish

**What**: Verify all components work together and refine the user experience.
**Why**: Final integration ensures all pieces function correctly as a cohesive feature.
**Confidence**: High

**Files to Modify:**

- Various files may need minor adjustments based on testing

**Changes:**

- Verify data flows correctly from repository through IPC to React hooks to components
- Test filter combinations (date range + status + project + search)
- Test pagination edge cases (first page, last page, empty results)
- Test sorting behavior across columns
- Test audit log export with different workflow states
- Verify URL state persistence across page refreshes
- Add any missing aria-labels and accessibility attributes
- Ensure keyboard navigation works correctly

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
pnpm run build
```

**Success Criteria:**

- [ ] All filters work independently and in combination
- [ ] Pagination navigates correctly
- [ ] Sorting toggles direction appropriately
- [ ] Audit log export downloads successfully
- [ ] URL reflects all current filter states
- [ ] Build completes without errors
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint:fix`
- [ ] Application builds successfully with `pnpm run build`
- [ ] Electron dev environment runs without errors with `pnpm run electron:dev`
- [ ] Manual verification: History page loads and displays data
- [ ] Manual verification: Filters update URL and refetch data
- [ ] Manual verification: Pagination navigates through results
- [ ] Manual verification: Sorting orders table correctly
- [ ] Manual verification: Export audit log downloads file

## Notes

**Architecture Decisions:**

- The repository layer handles filtering, pagination, and sorting in SQL for efficiency rather than client-side filtering
- Statistics are calculated via SQL aggregation to avoid loading all workflows into memory
- URL state management via nuqs ensures shareable/bookmarkable filter states
- The history table is a separate component from the active workflows table due to different column requirements and behaviors

**Potential Risks:**

- Date handling between JavaScript (ISO strings) and SQLite (text columns) requires careful formatting - use consistent ISO 8601 format throughout
- Large history datasets may require query optimization - consider adding database indices on `completedAt` and composite index on `status + completedAt` if performance issues arise
- The pagination offset calculation needs careful handling to avoid off-by-one errors

**Dependencies:**

- This implementation builds on existing patterns; no new npm dependencies are required
- All UI components reuse existing Base UI + CVA primitives

---

**MILESTONE:PLAN_FEATURE_SUCCESS**

# TanStack Table Components Implementation Plan

**Generated**: 2026-01-30
**Original Request**: Create a reusable data table component system using @tanstack/react-table
**Refined Request**: Create a reusable data table component system using @tanstack/react-table v8 that serves as foundational infrastructure for replacing various list/grid views throughout the Clarify application with robust, type-safe tables. The system should build on the project's existing patterns, utilizing Base UI primitives for unstyled accessible foundations, CVA for variant-based styling (with density variants: default, compact, comfortable), and TypeScript strict mode for full type safety. The core DataTable component should accept generic row data with fully-typed column definitions and support all essential features: column sorting with visual indicators via sortable DataTableColumnHeader components, per-column and global search filtering integrated with the DataTableToolbar, configurable pagination with DataTablePagination controls, drag-to-resize column widths, drag-to-reorder columns, and toggle-able column visibility. An optional row selection feature with checkboxes should enable bulk actions. Additional components include DataTableRowActions for row-level dropdown menus and support for row styling callbacks to differentiate certain rows visually. The implementation should place all components in `components/ui/table/` following existing project structure, maintain dark/light theme compatibility through CSS variables, and handle responsive overflow gracefully. Critically, table state—including column order, visibility, and sizing—should persist via electron-store with a reusable hook or utility pattern keyed by table ID, maintaining user preferences across sessions. The system must integrate seamlessly with TanStack Query data sources, displaying appropriate loading skeleton states and empty state component slots. Export reusable column helper utilities and ensure the architecture supports multiple concurrent tables on the same page without state conflicts.

## Analysis Summary

- Feature request refined with project context
- Discovered 47 files across 12+ directories
- Generated 15-step implementation plan

## File Discovery Results

### Critical Files (Must Understand/Reference)
| File | Purpose |
|------|---------|
| `components/ui/checkbox.tsx` | Row selection pattern |
| `components/ui/pagination.tsx` | Existing pagination to extend |
| `components/ui/button.tsx` | CVA button variants |
| `components/ui/input.tsx` | Filter/search inputs |
| `components/ui/select.tsx` | Page size selector |
| `components/ui/empty-state.tsx` | Empty state slot |
| `hooks/use-electron.ts` | useElectronStore for persistence |
| `components/agents/agent-table.tsx` | Current table to replace |

### Project Patterns Identified
- Base UI + CVA for all components
- Size variants: default, sm, lg
- electron-store via useElectronStore hook
- TanStack Query for data fetching
- Skeleton loading with animate-pulse

---

## Implementation Plan

## Overview

**Estimated Duration**: 3-4 days for core implementation, 1 day for polish and integration
**Complexity**: High
**Risk Level**: Medium

## Quick Summary

Build a comprehensive, reusable data table component system using TanStack React Table v8 that integrates with the project's existing Base UI + CVA patterns. The system will provide type-safe tables with sorting, filtering, pagination, column resizing, column reordering, column visibility toggling, and optional row selection. Table state (column order, visibility, sizing) will persist via electron-store with unique table IDs, and the components will support loading skeletons and empty states when integrated with TanStack Query data sources.

## Prerequisites

- [x] `@tanstack/react-table@^8.21.3` already installed in package.json
- [x] `@tanstack/react-virtual@^3.13.18` already installed for potential virtualization
- [ ] Understand existing UI component patterns in `components/ui/` (checkbox, button, input, select, pagination, etc.)
- [ ] Understand `useElectronStore` hook for persistence in `hooks/use-electron.ts`
- [ ] Review current `components/agents/agent-table.tsx` to understand replacement target

## Implementation Steps

### Step 1: Create DropdownMenu Component (Base UI Menu Wrapper)

**What**: Create a styled dropdown menu component using Base UI's Menu primitive as the foundation for DataTableRowActions and column visibility menus
**Why**: The project lacks a dropdown menu component, which is required for row actions and column visibility toggling. Following the existing pattern of wrapping Base UI primitives with CVA variants ensures consistency.
**Confidence**: High

**Files to Create:**
- `components/ui/dropdown-menu.tsx` - Dropdown menu component with MenuRoot, MenuTrigger, MenuPortal, MenuPositioner, MenuPopup, MenuItem, MenuSeparator, MenuGroup exports

**Changes:**
- Create MenuRoot re-export from Base UI Menu.Root
- Create MenuTrigger with render prop pattern (matching DialogTrigger pattern)
- Create MenuPositioner with proper z-index and positioning offset
- Create MenuPopup with CVA variants for size (default, sm)
- Create MenuItem with CVA variants matching selectItemVariants pattern (hover states, disabled states)
- Create MenuSeparator using existing Separator pattern
- Create MenuGroup for grouping related items
- Add MenuItemIcon utility component for icons in menu items

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] All menu components export correctly with proper TypeScript types
- [ ] Component follows existing Base UI wrapper patterns from select.tsx and dialog.tsx
- [ ] Supports keyboard navigation and accessibility out of the box
- [ ] All validation commands pass

---

### Step 2: Create Core Table Type Definitions

**What**: Define TypeScript types and interfaces for the table system including column definitions, table state, and persistence
**Why**: Establishing strong type definitions first ensures type safety throughout the implementation and provides clear contracts for all table components
**Confidence**: High

**Files to Create:**
- `components/ui/table/types.ts` - Core type definitions for the table system

**Changes:**
- Define `DataTableColumnDef<TData>` extending TanStack's ColumnDef with additional metadata (enableColumnFilter, enableHiding)
- Define `DataTableState` interface for column order, visibility, sizing, sorting, filtering, pagination
- Define `DataTablePersistenceConfig` for electron-store integration (tableId, persistedKeys array)
- Define `DataTableDensity` union type ('default' | 'compact' | 'comfortable')
- Define `DataTableRowStyleCallback<TData>` for conditional row styling
- Define `DataTableEmptyStateProps` for empty state slot configuration
- Define `DataTableLoadingProps` for loading skeleton configuration

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] All types are fully generic and support any row data type
- [ ] Types integrate with TanStack Table's built-in types
- [ ] All validation commands pass

---

### Step 3: Create Table State Persistence Hook

**What**: Build a custom hook that manages table state persistence using electron-store via the existing useElectronStore hook
**Why**: Users expect table preferences (column order, visibility, sizing) to persist across sessions. This hook abstracts the persistence logic and can be reused across multiple tables
**Confidence**: High

**Files to Create:**
- `hooks/use-table-persistence.ts` - Hook for persisting and restoring table state

**Changes:**
- Create `useTablePersistence<TState>` hook accepting tableId and initial state
- Implement load state from electron-store on mount with fallback to initial state
- Implement debounced save state to electron-store on state changes
- Handle merging of partial persisted state with initial state
- Support configurable persistence keys (only persist specified state properties)
- Return state, setState, and isLoaded flag for loading state handling
- Use unique storage key pattern: `table-state-${tableId}`

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] Hook properly loads persisted state on mount
- [ ] Hook debounces writes to prevent excessive storage operations
- [ ] Hook supports partial state persistence (e.g., only column order and sizing)
- [ ] Multiple tables with different IDs maintain separate state
- [ ] All validation commands pass

---

### Step 4: Create Skeleton Loading Component for Tables

**What**: Create a table skeleton component that displays animated placeholder rows during data loading
**Why**: Provides visual feedback during async data fetching and integrates with TanStack Query's loading states. Following the project's animate-pulse skeleton pattern ensures consistency
**Confidence**: High

**Files to Create:**
- `components/ui/table/data-table-skeleton.tsx` - Skeleton loading component for tables

**Changes:**
- Create DataTableSkeleton component accepting columnCount and rowCount props
- Implement skeleton rows with animate-pulse styling matching project patterns
- Support density variants for proper row height during loading
- Use CSS variables for consistent spacing
- Make skeleton cells vary in width for visual interest

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] Skeleton displays correct number of columns and rows
- [ ] Animation matches existing project skeleton patterns
- [ ] Supports all density variants
- [ ] All validation commands pass

---

### Step 5: Create DataTableColumnHeader Component

**What**: Build a sortable column header component with visual sort direction indicators and optional tooltip
**Why**: Provides consistent sorting UX across all table columns with clear visual feedback. This component encapsulates sort toggle logic and accessibility
**Confidence**: High

**Files to Create:**
- `components/ui/table/data-table-column-header.tsx` - Sortable column header component

**Changes:**
- Create DataTableColumnHeader component accepting column and title props
- Implement sort toggle using column.getToggleSortingHandler()
- Display sort direction icons (ArrowUp, ArrowDown, ArrowUpDown for unsorted)
- Support disabling sort via column.getCanSort()
- Add optional tooltip for long column titles using existing Tooltip component
- Style with hover state and cursor pointer when sortable
- Support multi-sort indicator showing sort priority number

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] Clicking header toggles sort direction correctly
- [ ] Visual indicators show current sort state (asc/desc/none)
- [ ] Multi-sort shows priority numbers
- [ ] Disabled sort columns show no interactive styling
- [ ] All validation commands pass

---

### Step 6: Create DataTablePagination Component

**What**: Extend the existing Pagination component with page size selector for table-specific pagination needs
**Why**: Tables need configurable page sizes in addition to page navigation. Building on existing Pagination ensures consistency while adding table-specific features
**Confidence**: High

**Files to Create:**
- `components/ui/table/data-table-pagination.tsx` - Extended pagination component with page size selector

**Changes:**
- Create DataTablePagination wrapping existing Pagination component
- Add page size selector using Select component with common options (10, 25, 50, 100)
- Accept TanStack Table instance for direct API integration
- Support configurable page size options
- Display row count information (Showing X to Y of Z rows)
- Implement first/last page navigation buttons
- Match existing pagination styling with added page size controls

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] Page size selector changes rows per page
- [ ] Navigation works correctly with TanStack Table pagination state
- [ ] Row count display updates correctly
- [ ] Styling matches existing Pagination component
- [ ] All validation commands pass

---

### Step 7: Create DataTableToolbar Component

**What**: Build a toolbar component with global search/filter input and column visibility toggle dropdown
**Why**: Provides common table controls in a consistent location above the table. Global search and column visibility are essential features for data-dense tables
**Confidence**: High

**Files to Create:**
- `components/ui/table/data-table-toolbar.tsx` - Toolbar with search and column visibility

**Changes:**
- Create DataTableToolbar accepting table instance and optional children for custom actions
- Implement global filter input using Input component with search icon
- Create column visibility dropdown using new DropdownMenu component
- Display toggleable column list with Checkbox for each hideable column
- Support debounced global filter updates
- Add "Reset columns" action to restore default visibility
- Allow custom toolbar actions via children prop (for bulk actions, export, etc.)

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] Global search filters table data with debounce
- [ ] Column visibility toggles show/hide columns correctly
- [ ] Only columns with enableHiding show in visibility menu
- [ ] Custom actions render alongside default controls
- [ ] All validation commands pass

---

### Step 8: Create DataTableRowActions Component

**What**: Build a row-level actions dropdown menu component for common row operations
**Why**: Provides consistent pattern for row-level actions (view, edit, delete, etc.) that can be customized per table use case
**Confidence**: High

**Files to Create:**
- `components/ui/table/data-table-row-actions.tsx` - Row actions dropdown component

**Changes:**
- Create DataTableRowActions accepting row data and actions array
- Use DropdownMenu with IconButton trigger (MoreHorizontal icon)
- Support action types: button, link, separator, destructive
- Each action receives row data for context
- Support disabled state per action
- Add keyboard shortcut hints in menu items
- Style destructive actions with destructive color

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] Actions dropdown opens with correct menu items
- [ ] Actions receive row data when triggered
- [ ] Destructive actions styled appropriately
- [ ] Disabled actions show disabled state
- [ ] All validation commands pass

---

### Step 9: Create Column Resize Handle Component

**What**: Build a draggable resize handle component for column width adjustment
**Why**: Column resizing improves data table usability by allowing users to customize column widths to fit their content and preferences
**Confidence**: Medium

**Files to Create:**
- `components/ui/table/data-table-resize-handle.tsx` - Column resize handle component

**Changes:**
- Create DataTableResizeHandle accepting header from TanStack Table
- Implement mouse and touch drag handlers using header.getResizeHandler()
- Style resize handle as thin vertical bar visible on hover
- Show resize indicator during active resize (using columnSizingInfo.deltaOffset)
- Support cursor change to col-resize during hover/drag
- Position at right edge of header cell

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] Dragging handle resizes column width
- [ ] Resize cursor appears on hover
- [ ] Visual indicator shows during resize
- [ ] Works with both mouse and touch events
- [ ] All validation commands pass

---

### Step 10: Create Core DataTable Component

**What**: Build the main DataTable component that orchestrates all table features and sub-components
**Why**: This is the primary consumer-facing component that provides a complete, feature-rich table experience with minimal configuration required
**Confidence**: High

**Files to Create:**
- `components/ui/table/data-table.tsx` - Main DataTable component

**Changes:**
- Create generic DataTable<TData, TValue> component with full type inference
- Accept columns, data, and extensive configuration props
- Initialize TanStack Table with all required row models (core, sorted, filtered, paginated)
- Integrate useTablePersistence for state management
- Support controlled and uncontrolled state modes
- Implement density variants ('default' | 'compact' | 'comfortable') with CVA
- Support row selection with checkbox column (optional)
- Support row click handler and row styling callback
- Render table structure (thead, tbody) with proper accessibility attributes
- Integrate DataTableColumnHeader, DataTablePagination, DataTableToolbar
- Support column resizing via DataTableResizeHandle
- Display DataTableSkeleton during loading
- Display EmptyState component when no data
- Use CSS variables for column widths (performance optimization)
- Support responsive overflow with horizontal scroll

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] Table renders with all configured features
- [ ] Sorting, filtering, pagination work correctly
- [ ] Column resizing persists across renders
- [ ] Row selection state accessible to parent
- [ ] Loading and empty states display appropriately
- [ ] TypeScript provides full type inference for columns and data
- [ ] All validation commands pass

---

### Step 11: Create Column Reorder Support

**What**: Add drag-and-drop column reordering capability to the DataTable
**Why**: Users should be able to customize column order to match their workflow. Using native drag events keeps the implementation lightweight
**Confidence**: Medium

**Files to Modify:**
- `components/ui/table/data-table.tsx` - Add column reorder functionality

**Changes:**
- Add enableColumnReorder prop to DataTable
- Implement native HTML5 drag-and-drop on header cells
- Add onDragStart, onDragOver, onDragEnd handlers to header cells
- Create visual feedback during drag (opacity change, drop indicator)
- Update columnOrder state on successful drop
- Persist column order via useTablePersistence
- Make reorder opt-in per table instance

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] Columns can be reordered via drag-and-drop
- [ ] Visual feedback during drag operation
- [ ] Column order persists across sessions
- [ ] Feature is opt-in and disabled by default
- [ ] All validation commands pass

---

### Step 12: Create Column Definition Helpers

**What**: Build utility functions for creating common column types with proper defaults
**Why**: Reduces boilerplate when defining columns and ensures consistent configuration across tables
**Confidence**: High

**Files to Create:**
- `components/ui/table/column-helpers.ts` - Column definition helper utilities

**Changes:**
- Create createColumnHelper<TData>() factory matching TanStack's pattern
- Create selectColumn() helper for row selection checkbox column
- Create actionsColumn() helper for row actions column (non-sortable, fixed width)
- Create dateColumn() helper with proper datetime sorting function
- Create statusColumn() helper with Badge rendering
- Create textColumn() helper with text sorting function
- All helpers accept partial column config for overrides

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] Helpers reduce boilerplate for common column types
- [ ] Type inference works correctly with helpers
- [ ] Default configurations are sensible and overridable
- [ ] All validation commands pass

---

### Step 13: Create Table Index Export File

**What**: Create barrel export file for all table components
**Why**: Provides clean import path for consumers and establishes public API surface
**Confidence**: High

**Files to Create:**
- `components/ui/table/index.ts` - Barrel export file

**Changes:**
- Export DataTable as default and named export
- Export all sub-components (DataTableColumnHeader, DataTablePagination, DataTableToolbar, DataTableRowActions, DataTableSkeleton, DataTableResizeHandle)
- Export all types from types.ts
- Export column helpers from column-helpers.ts
- Export useTablePersistence hook

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] All public components and utilities exported
- [ ] Clean import path: `import { DataTable, createColumnHelper } from '@/components/ui/table'`
- [ ] All validation commands pass

---

### Step 14: Add CSS Variables for Table Styling

**What**: Define CSS variables for table dimensions and density variants
**Why**: CSS variables enable runtime theming and consistent sizing across density variants without JavaScript recalculation
**Confidence**: High

**Files to Modify:**
- `app/globals.css` - Add table-specific CSS variables

**Changes:**
- Add table cell padding variables for each density (--table-cell-padding-default, --table-cell-padding-compact, --table-cell-padding-comfortable)
- Add table row height variables for each density
- Add table header background variable
- Add table border radius variable
- Add resize handle width variable
- Add variables within appropriate media query breakpoints for responsive behavior

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] CSS variables defined for all density variants
- [ ] Variables used consistently in table components
- [ ] Responsive variables adjust appropriately
- [ ] All validation commands pass

---

### Step 15: Integration Testing with Agent Table Replacement

**What**: Replace the existing agent-table.tsx with the new DataTable component to validate the implementation
**Why**: Real-world integration testing ensures the component system works for actual use cases and reveals any gaps in the API
**Confidence**: Medium

**Files to Modify:**
- `components/agents/agent-table.tsx` - Refactor to use new DataTable

**Changes:**
- Replace custom table markup with DataTable component
- Define Agent columns using createColumnHelper and column helpers
- Configure row actions using DataTableRowActions pattern
- Set up persistence with unique tableId ('agents-table')
- Maintain all existing functionality (edit dialog, status toggle, actions)
- Use row styling callback for inactive agent opacity
- Verify all features work as expected

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] Agent table renders correctly with DataTable
- [ ] All existing functionality preserved
- [ ] Column preferences persist across sessions
- [ ] No regressions in UX or accessibility
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint`
- [ ] DataTable component renders without errors with sample data
- [ ] Sorting cycles through asc/desc/none correctly
- [ ] Filtering updates table rows with debounce
- [ ] Pagination controls navigate pages correctly
- [ ] Column resizing persists via electron-store
- [ ] Column reordering persists via electron-store
- [ ] Column visibility toggles persist via electron-store
- [ ] Row selection state is accessible to parent component
- [ ] Loading skeleton displays during isLoading state
- [ ] Empty state displays when data array is empty
- [ ] Multiple tables on same page maintain independent state
- [ ] Dark/light theme compatibility verified
- [ ] Keyboard navigation works for all interactive elements

## Notes

**Architecture Decisions:**
- Using native HTML5 drag-and-drop for column reordering instead of dnd-kit to minimize bundle size and dependencies
- Implementing CVA variants for density rather than inline style calculations for better performance and maintainability
- Using CSS variables for column widths as recommended by TanStack Table documentation for resize performance
- Persistence hook uses debouncing to prevent excessive writes to electron-store

**Risk Mitigation:**
- Column resize performance: Following TanStack's advanced performance recommendations by memoizing column widths and using CSS variables
- State conflicts: Each table instance requires unique tableId for persistence isolation
- TypeScript complexity: Using TanStack's createColumnHelper pattern for better type inference

**Dependencies:**
- No new npm dependencies required (TanStack Table and TanStack Virtual already installed)
- Base UI Menu component needed for dropdown menus (created in Step 1)

**Future Enhancements (Out of Scope):**
- Virtualization for very large datasets (foundation laid with @tanstack/react-virtual)
- Column pinning (left/right)
- Row grouping/expanding
- Export to CSV/Excel
- Print-friendly view

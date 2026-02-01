# Column Sorting Persistence - Implementation Plan

**Generated**: 2026-02-01
**Original Request**: "add column level sorting to the tanstack data-table components and update the agents, projects, workflows tables to enable the column sorting. The user should be able to click on the column header and sort the column, with clear indicators of the sort state and a way to reset the sort to the default state. The last used sort should be persisted and reloaded when the user returns to the tabe."

**Refined Request**: Implement column-level sorting for TanStack Table components across the Clarify application by enhancing the existing DataTable and DataTableColumnHeader components to support clickable column headers that toggle between ascending, descending, and no sort states, with visual indicators using the existing ArrowUp/ArrowDown/ArrowUpDown icons to clearly communicate the current sort direction. The sorting functionality should integrate with TanStack Table v8's built-in `sorting` state and `setSorting` API, allowing users to click any column header to apply or modify sorting. Enable persistent sorting state by extending the existing `useTablePersistence` hook to save and restore the sorting configuration (which column is sorted and in which direction) using Zustand, ensuring that when users navigate away from and return to a table—whether it's the agents table, projects table, or the active and history workflows tables—their last used sort preference is automatically reloaded. Implement a reset mechanism (such as clicking the currently sorted column header or a dedicated reset button) that clears all sorting and returns the table to its default unsorted state. The implementation should maintain consistency across all tables mentioned (agents, projects, workflows active, and workflows history) by centralizing the sorting logic in the DataTable component wrapper and leveraging the existing DataTableColumnHeader component's icon system to avoid code duplication.

---

## Analysis Summary

- Feature request refined with project context
- Discovered 24 files across 8 directories
- Generated 6-step implementation plan

## File Discovery Results

### Critical Priority
| File | Relevance |
|------|-----------|
| `components/ui/table/data-table.tsx` | Core DataTable with sorting support, needs persistence integration |
| `components/ui/table/data-table-column-header.tsx` | Column header with sort icons (already functional) |
| `hooks/use-table-persistence.ts` | Persistence hook, needs 'sorting' added to DEFAULT_PERSISTED_KEYS |
| `components/ui/table/types.ts` | Types with PersistableStateKey (already includes 'sorting') |

### High Priority
| File | Relevance |
|------|-----------|
| `components/agents/agent-table.tsx` | Needs persistedKeys updated to include 'sorting' |
| `components/projects/project-table.tsx` | Needs persistedKeys updated to include 'sorting' |
| `components/workflows/workflow-table.tsx` | Needs persistedKeys updated to include 'sorting' |

---

## Implementation Plan

## Overview

**Estimated Duration**: 2-3 hours
**Complexity**: Low
**Risk Level**: Low

## Quick Summary

This implementation enables persistent column sorting state across all DataTable instances by adding 'sorting' to the default persisted keys in the useTablePersistence hook and updating individual table configurations. The core sorting functionality already exists in DataTable and DataTableColumnHeader components; this plan focuses solely on wiring up the persistence layer to save and restore sorting preferences.

## Prerequisites

- [ ] Verify the development environment is running with `pnpm electron:dev`
- [ ] Confirm understanding that DataTable already supports sorting via TanStack Table v8 (`isSortingEnabled`, `getSortedRowModel`, `onSortingChange`)
- [ ] Confirm DataTableColumnHeader already implements the clickable sort toggle with ArrowUp/ArrowDown/ArrowUpDown icons

## Implementation Steps

### Step 1: Update DEFAULT_PERSISTED_KEYS in useTablePersistence Hook

**What**: Add 'sorting' to the DEFAULT_PERSISTED_KEYS array so sorting state is persisted by default alongside column order, visibility, and sizing.
**Why**: This is the centralized location that determines which table states are persisted. Adding 'sorting' here ensures all tables using persistence will automatically include sorting state.
**Confidence**: High

**Files to Modify:**
- `C:\Users\jasonpaff\dev\clarify\hooks\use-table-persistence.ts` - Add 'sorting' to DEFAULT_PERSISTED_KEYS array

**Changes:**
- Modify the DEFAULT_PERSISTED_KEYS constant on line 21 to include 'sorting' as the fourth element in the array

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] DEFAULT_PERSISTED_KEYS array contains ['columnOrder', 'columnVisibility', 'columnSizing', 'sorting']
- [ ] All validation commands pass
- [ ] No TypeScript errors (PersistableStateKey type already includes 'sorting')

---

### Step 2: Add Sorting State Handler to DataTable Component

**What**: Add a handleSortingChange callback in DataTable that persists sorting state changes, similar to the existing handlers for columnSizing, columnVisibility, and columnOrder.
**Why**: The DataTable component needs to intercept sorting changes and persist them via the useTablePersistence hook, just like it does for other persisted state types.
**Confidence**: High

**Files to Modify:**
- `C:\Users\jasonpaff\dev\clarify\components\ui\table\data-table.tsx` - Add sorting state handling with persistence

**Changes:**
- Add handleSortingChange callback (following the pattern of handleColumnSizingChange, handleColumnVisibilityChange, handleColumnOrderChange)
- Add 'sorting' to the initialState object in persistenceOptions
- Add resolvedSorting variable for merging persisted and controlled state
- Pass handleSortingChange to the useReactTable onSortingChange option instead of the prop directly

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] handleSortingChange callback is defined and follows the same pattern as other state handlers
- [ ] Sorting state is included in persistenceOptions.initialState
- [ ] resolvedSorting variable properly merges persisted and controlled state
- [ ] useReactTable receives handleSortingChange for onSortingChange
- [ ] All validation commands pass

---

### Step 3: Update Agent Table Persistence Configuration

**What**: Add 'sorting' to the persistedKeys array in the AgentTable component's persistence configuration.
**Why**: While DEFAULT_PERSISTED_KEYS now includes sorting, the AgentTable explicitly specifies its persistedKeys, so it needs to be updated to include 'sorting' for sorting persistence to work.
**Confidence**: High

**Files to Modify:**
- `C:\Users\jasonpaff\dev\clarify\components\agents\agent-table.tsx` - Update persistedKeys to include 'sorting'

**Changes:**
- Modify the persistence.persistedKeys array to include 'sorting' alongside existing keys

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] persistedKeys array contains ['columnOrder', 'columnVisibility', 'columnSizing', 'sorting']
- [ ] All validation commands pass

---

### Step 4: Update Project Table Persistence Configuration

**What**: Add 'sorting' to the persistedKeys array in the ProjectTable component's persistence configuration.
**Why**: The ProjectTable explicitly specifies its persistedKeys, so it needs to be updated to include 'sorting' for sorting persistence to work.
**Confidence**: High

**Files to Modify:**
- `C:\Users\jasonpaff\dev\clarify\components\projects\project-table.tsx` - Update persistedKeys to include 'sorting'

**Changes:**
- Modify the persistence.persistedKeys array to include 'sorting' alongside existing keys

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] persistedKeys array contains ['columnOrder', 'columnVisibility', 'columnSizing', 'sorting']
- [ ] All validation commands pass

---

### Step 5: Update Workflow Table Persistence Configuration

**What**: Add 'sorting' to the persistedKeys array in the WorkflowTable component's persistence configuration.
**Why**: The WorkflowTable explicitly specifies its persistedKeys, so it needs to be updated to include 'sorting' for sorting persistence to work.
**Confidence**: High

**Files to Modify:**
- `C:\Users\jasonpaff\dev\clarify\components\workflows\workflow-table.tsx` - Update persistedKeys to include 'sorting'

**Changes:**
- Modify the persistence.persistedKeys array to include 'sorting' alongside existing keys

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] persistedKeys array contains ['columnOrder', 'columnVisibility', 'columnSizing', 'sorting']
- [ ] All validation commands pass

---

### Step 6: Manual Integration Testing

**What**: Verify sorting persistence works correctly across all tables by testing the complete user flow.
**Why**: Manual testing ensures the implementation works end-to-end, including persistence to electron-store and restoration on page reload.
**Confidence**: High

**Files to Modify:**
- None (testing only)

**Changes:**
- No code changes

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] Agents table: Click column header to sort, navigate away, return - sort preference is restored
- [ ] Projects table: Click column header to sort, navigate away, return - sort preference is restored
- [ ] Workflows table: Click column header to sort, navigate away, return - sort preference is restored
- [ ] Clicking sorted column cycles through: ascending -> descending -> unsorted (already implemented in DataTableColumnHeader)
- [ ] Sort icons display correctly: ArrowUp for ascending, ArrowDown for descending, ArrowUpDown for unsorted
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint`
- [ ] Sorting persists across navigation for agents table
- [ ] Sorting persists across navigation for projects table
- [ ] Sorting persists across navigation for workflows table
- [ ] Sorting state clears when clicking the sorted column a third time (unsorted state)
- [ ] No console errors during sorting operations

## Notes

- **Existing Functionality**: The DataTableColumnHeader component already implements the full sorting toggle behavior (ascending -> descending -> unsorted) via TanStack Table's `getToggleSortingHandler()`. No changes needed to the column header component.

- **Reset Mechanism**: TanStack Table's default sorting toggle already supports a reset mechanism - clicking a sorted column header cycles through asc -> desc -> none (unsorted). This is already wired up in DataTableColumnHeader via `column.getToggleSortingHandler()`.

- **Type Safety**: The PersistableStateKey type in `components/ui/table/types.ts` already includes 'sorting' as a valid key, so no type changes are needed.

- **Debounced Persistence**: The useTablePersistence hook already implements debounced writes (500ms default) to electron-store, preventing excessive writes during rapid sort changes.

- **Multi-Sort Support**: DataTableColumnHeader already supports multi-sort with priority indicators. This will also be persisted since the entire SortingState array is saved.

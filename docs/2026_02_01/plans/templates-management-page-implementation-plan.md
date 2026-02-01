# Templates Management Page Implementation Plan

**Generated**: 2026-02-01
**Original Request**: templates management page
**Refined Request**: The templates management page should provide a comprehensive interface for viewing, creating, editing, and managing workflow templates within the Clarify application, following the established pattern from the agents page at `app/(app)/agents/page.tsx`. This page will display templates in a TanStack Table with columns for name, category, description, usage count, and status (built-in vs custom, active vs deactivated), supporting sorting, filtering by category (backend, data, electron, security, ui), and search by name or description. The toolbar should include a search input, category filter dropdown using Base UI Select with CVA styling, and action buttons for creating new templates and potentially importing/exporting template configurations. Each table row should have actions for editing, duplicating, and deactivating/reactivating templates, with built-in templates (those with non-null `builtInAt`) being editable as custom copies rather than directly modified. The create/edit dialog should use TanStack Form with fields for name, category selection, description, and a template body textarea that supports `{{placeholder}}` syntax with syntax highlighting via Shiki. A nested section or separate tab within the dialog should allow managing template placeholders from the `template_placeholders` table, including fields for placeholder name, display name, description, default value, order index, required status, and optional validation pattern (regex). The page should use TanStack Query hooks following the query key factory pattern in `lib/queries/` for data fetching, with mutations for CRUD operations that properly invalidate the template list query. The IPC layer should have handlers in `electron/ipc/template-handlers.ts` connecting to a `TemplateRepository` in `db/repositories/` that implements standard CRUD operations plus queries for filtering by category and searching by name. State management for UI concerns like selected rows, dialog open states, and filter values should use Zustand stores, while all template data flows through TanStack Query for proper caching and synchronization.

## Analysis Summary

- Feature request refined with project context
- Discovered 25 existing files (infrastructure complete)
- Identified 15 files to create
- Generated 16-step implementation plan

## File Discovery Results

### Existing Infrastructure (COMPLETE - Do Not Recreate)

| File | Description |
|------|-------------|
| `db/schema/templates.schema.ts` | Template database schema |
| `db/schema/template-placeholders.schema.ts` | Placeholder schema |
| `db/repositories/templates.repository.ts` | Template CRUD operations |
| `db/repositories/template-placeholders.repository.ts` | Placeholder CRUD |
| `electron/ipc/template.handlers.ts` | IPC handlers |
| `hooks/queries/use-templates.ts` | TanStack Query hooks |
| `lib/queries/templates.ts` | Query key factory |
| `lib/validations/template.ts` | Zod schemas |
| `types/electron.d.ts` | TypeScript types |

### Files to Create

| Priority | File |
|----------|------|
| Critical | `app/(app)/templates/page.tsx` |
| Critical | `components/templates/template-table.tsx` |
| Critical | `components/templates/template-table-toolbar.tsx` |
| Critical | `components/templates/template-editor-dialog.tsx` |
| Critical | `components/templates/template-placeholders-section.tsx` |
| Critical | `components/templates/confirm-delete-template-dialog.tsx` |
| High | `app/(app)/templates/_components/templates-page-header.tsx` |
| High | `app/(app)/templates/_components/templates-page-skeleton.tsx` |
| High | `app/(app)/templates/_components/templates-dialogs.tsx` |
| High | `hooks/templates/use-template-filters.ts` |
| High | `hooks/templates/use-template-dialogs.ts` |
| High | `hooks/templates/use-template-actions.ts` |
| High | `hooks/templates/use-filtered-templates.ts` |
| Medium | `lib/stores/template-layout-store.ts` |

---

## Overview

**Estimated Duration**: 2-3 days
**Complexity**: Medium-High
**Risk Level**: Medium

## Quick Summary

This plan implements a comprehensive templates management page following the established agents page pattern. The implementation creates a TanStack Table-based interface for viewing, creating, editing, duplicating, and managing workflow templates with category filtering, search, and placeholder management within a dialog editor.

## Prerequisites

- [ ] Verify existing infrastructure is complete (db schema, repositories, IPC handlers, query hooks)
- [ ] Confirm `db/schema/templates.schema.ts` exports `templateCategories`
- [ ] Confirm `hooks/queries/use-templates.ts` exports all required hooks

## Implementation Steps

### Step 1: Create Layout Constants for Templates

**What**: Add template-specific storage keys and defaults to the layout constants file
**Why**: Provides consistent storage key naming and default values for template UI preferences
**Confidence**: High

**Files to Modify:**

- `lib/layout/constants.ts` - Add template storage keys and defaults

**Changes:**

- Add `TEMPLATE_SHOW_BUILTIN_STORAGE_KEY` constant
- Add `TEMPLATE_SHOW_DEACTIVATED_STORAGE_KEY` constant
- Add `DEFAULT_TEMPLATE_SHOW_BUILTIN` constant (default: true)
- Add `DEFAULT_TEMPLATE_SHOW_DEACTIVATED` constant (default: false)

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Constants are exported and available for import
- [ ] All validation commands pass

---

### Step 2: Create Template Layout Zustand Store

**What**: Create a Zustand store for managing template UI preferences with electron-store persistence
**Why**: Persists user preferences for showing built-in and deactivated templates across sessions
**Confidence**: High

**Files to Create:**

- `lib/stores/template-layout-store.ts` - Zustand store for template UI state

**Changes:**

- Define `TemplateLayoutState` interface with `showBuiltIn` and `showDeactivated` booleans
- Define `TemplateLayoutActions` interface with setter functions
- Create `useTemplateLayoutStore` Zustand store following `agent-layout-store.ts` pattern
- Implement electron-store persistence via IPC

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Store exports `useTemplateLayoutStore` hook
- [ ] Store persists to electron-store on changes
- [ ] All validation commands pass

---

### Step 3: Create Template Filters Hook

**What**: Create a custom hook for managing template filter state
**Why**: Centralizes filter state management with Zustand integration for persisted preferences
**Confidence**: High

**Files to Create:**

- `hooks/templates/use-template-filters.ts` - Filter state management hook

**Changes:**

- Define `FilterValue` type alias (null | string)
- Define `UseTemplateFiltersReturn` interface with filter values and setters
- Create `useTemplateFilters` hook with local state for search, category, and status filters
- Integrate with `useTemplateLayoutStore` for `showBuiltIn` and `showDeactivated`
- Implement `onResetFilters` callback

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Hook exports `useTemplateFilters` function
- [ ] Hook returns all filter state and setters
- [ ] All validation commands pass

---

### Step 4: Create Filtered Templates Hook

**What**: Create a hook for client-side filtering of templates
**Why**: Enables efficient filtering without additional server requests
**Confidence**: High

**Files to Create:**

- `hooks/templates/use-filtered-templates.ts` - Client-side filtering hook

**Changes:**

- Define `UseFilteredTemplatesOptions` interface with templates array and filter values
- Define `UseFilteredTemplatesReturn` interface with filtered results and counts
- Implement `useFilteredTemplates` hook with useMemo for performance
- Filter by: search (name/description), category, status, showBuiltIn, showDeactivated

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Hook correctly filters templates by all criteria
- [ ] Hook returns `filteredTemplates`, `filteredCount`, `totalCount`, `isFiltered`
- [ ] All validation commands pass

---

### Step 5: Create Template Dialogs Hook

**What**: Create a reducer-based hook for managing dialog state
**Why**: Centralizes dialog state for delete and editor dialogs using reducer pattern
**Confidence**: High

**Files to Create:**

- `hooks/templates/use-template-dialogs.ts` - Dialog state management hook

**Changes:**

- Define `DeleteDialogState` interface with template and isOpen
- Define `EditorDialogState` interface with template, mode, and isOpen
- Define `DialogState` combining delete and editor states
- Define `DialogAction` union type for reducer actions
- Implement `dialogReducer` function
- Create `useTemplateDialogs` hook with useReducer and handler callbacks

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Hook exports dialog state and dispatch function
- [ ] Hook provides callbacks for opening/closing dialogs
- [ ] All validation commands pass

---

### Step 6: Create Template Actions Hook

**What**: Create a hook for template CRUD action handlers with loading state
**Why**: Consolidates mutation hooks and provides stable action handlers
**Confidence**: High

**Files to Create:**

- `hooks/templates/use-template-actions.ts` - CRUD action handlers hook

**Changes:**

- Define `TemplateActionsLoadingState` interface with mutation pending states
- Define `UseTemplateActionsOptions` interface with templates array and dialog callbacks
- Define `UseTemplateActionsReturn` interface with action handlers and loading state
- Implement handlers for: toggle active, duplicate, delete click/confirm
- Integrate with `useCreateTemplate`, `useUpdateTemplate`, `useDeleteTemplate` mutations
- Return consolidated `loadingState` object

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Hook provides stable action handlers
- [ ] Loading state tracks all pending mutations
- [ ] All validation commands pass

---

### Step 7: Create Confirm Delete Template Dialog

**What**: Create a confirmation dialog for template deletion
**Why**: Provides user confirmation before destructive delete operation
**Confidence**: High

**Files to Create:**

- `components/templates/confirm-delete-template-dialog.tsx` - Delete confirmation dialog

**Changes:**

- Define `ConfirmDeleteTemplateDialogProps` interface with templateName, isOpen, isLoading, callbacks
- Create controlled dialog component using Dialog primitives
- Include warning message about permanent deletion
- Style with destructive variant for delete button

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Dialog renders with template name in message
- [ ] Delete button shows loading state when `isLoading` is true
- [ ] All validation commands pass

---

### Step 8: Create Template Placeholders Section Component

**What**: Create a component for managing template placeholders within the editor dialog
**Why**: Enables CRUD operations on placeholders with inline editing
**Confidence**: Medium

**Files to Create:**

- `components/templates/template-placeholders-section.tsx` - Placeholder management section

**Changes:**

- Define `TemplatePlaceholderItem` interface for form state
- Define `TemplatePlaceholdersSectionProps` with placeholders array and onChange callback
- Create section with list of placeholder items
- Implement add/edit/remove placeholder functionality
- Include fields: name, displayName, description, defaultValue, orderIndex, required toggle, validationPattern
- Use Collapsible pattern for compact display

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Component displays list of placeholders with edit/delete actions
- [ ] Add button creates new placeholder with defaults
- [ ] Changes propagate via onChange callback
- [ ] All validation commands pass

---

### Step 9: Create Template Editor Dialog

**What**: Create the main create/edit dialog for templates with TanStack Form
**Why**: Provides comprehensive template editing with placeholder management
**Confidence**: Medium

**Files to Create:**

- `components/templates/template-editor-dialog.tsx` - Create/edit template dialog

**Changes:**

- Define `TemplateEditorDialogProps` with template, mode, isOpen, onOpenChange, onSuccess
- Create form using `useAppForm` with `templateWithPlaceholdersSchema` validation
- Include fields: name, category (Select), description (Textarea), templateText (Textarea)
- Integrate `TemplatePlaceholdersSection` for placeholder management
- Handle create mode with `useCreateTemplate` and `useUpdateTemplatePlaceholders`
- Handle edit mode with `useUpdateTemplate` and `useUpdateTemplatePlaceholders`
- Show view-only mode for built-in templates
- Include discard confirmation dialog

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Dialog opens in create/edit/view mode based on props
- [ ] Form validates and submits correctly
- [ ] Placeholders are saved along with template
- [ ] Built-in templates show as view-only
- [ ] All validation commands pass

---

### Step 10: Create Template Table Toolbar

**What**: Create toolbar component with filters popover and action buttons
**Why**: Provides filtering and actions for the template table
**Confidence**: High

**Files to Create:**

- `components/templates/template-table-toolbar.tsx` - Table toolbar with filters

**Changes:**

- Define `TemplateTableToolbarProps` with filter values, callbacks, and selected count
- Create filters Popover with category Select, status Select, toggle switches
- Include active filter count badge on Filters button
- Include Reset Filters button when filters are active
- Follow `AgentTableToolbar` pattern for structure

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Toolbar renders with Filters popover
- [ ] Category and status filters work correctly
- [ ] Show built-in and deactivated toggles function
- [ ] Reset filters clears all filter state
- [ ] All validation commands pass

---

### Step 11: Create Template Table Component

**What**: Create the main TanStack Table component for displaying templates
**Why**: Core table display with sorting, actions, and integrated editor dialog
**Confidence**: High

**Files to Create:**

- `components/templates/template-table.tsx` - Main data table component

**Changes:**

- Define `TemplateTableProps` with templates, loading states, action callbacks, toolbar content
- Create columns: actions, name (with badges), category, description, usageCount, status switch, createdAt, updatedAt
- Implement memoized ActionsCell with Edit/View, Duplicate, Deactivate/Activate, Delete actions
- Implement memoized StatusCell with toggle switch
- Apply row styling for built-in (bg-muted/30) and deactivated (opacity-60) templates
- Integrate editor dialog with row click handling
- Configure DataTable with persistence using tableId 'templates-table'

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Table displays all template columns correctly
- [ ] Row actions menu works for all action types
- [ ] Status toggle updates template active state
- [ ] Row click opens editor dialog
- [ ] Column preferences persist
- [ ] All validation commands pass

---

### Step 12: Create Templates Page Header Component

**What**: Create the page header with title, count badge, and create button
**Why**: Consistent page header following agents page pattern
**Confidence**: High

**Files to Create:**

- `app/(app)/templates/_components/templates-page-header.tsx` - Page header component

**Changes:**

- Define `TemplatesPageHeaderProps` with filteredCount, totalCount, isFiltered
- Create header with h1 title "Templates"
- Include result count Badge showing filtered/total counts
- Include description text
- Integrate TemplateEditorDialog with Create Template button trigger
- Add skip link for keyboard navigation

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Header displays title, badge, and description
- [ ] Create Template button opens editor dialog in create mode
- [ ] Skip link targets template content section
- [ ] All validation commands pass

---

### Step 13: Create Templates Page Skeleton Component

**What**: Create skeleton loading state component for the templates page
**Why**: Provides smooth loading experience matching actual page structure
**Confidence**: High

**Files to Create:**

- `app/(app)/templates/_components/templates-page-skeleton.tsx` - Loading skeleton component

**Changes:**

- Define `TemplatesPageSkeletonProps` extending ComponentPropsWithRef
- Create skeleton matching page structure: header, toolbar, table
- Use DataTableSkeleton for table section
- Include proper aria attributes for accessibility

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Skeleton matches actual page layout
- [ ] Skeleton has proper loading aria attributes
- [ ] All validation commands pass

---

### Step 14: Create Templates Dialogs Container Component

**What**: Create a container component for all template-related dialogs
**Why**: Centralizes dialog rendering for cleaner page component
**Confidence**: High

**Files to Create:**

- `app/(app)/templates/_components/templates-dialogs.tsx` - Dialog container component

**Changes:**

- Define `TemplatesDialogsProps` with dialog states, loading states, and callbacks
- Render ConfirmDeleteTemplateDialog with props
- Use Fragment wrapper pattern

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Container renders delete confirmation dialog
- [ ] Props pass through correctly to child dialogs
- [ ] All validation commands pass

---

### Step 15: Create Templates Page

**What**: Create the main templates management page component
**Why**: Entry point for the templates feature following established patterns
**Confidence**: High

**Files to Create:**

- `app/(app)/templates/page.tsx` - Main templates page

**Changes:**

- Add 'use client' directive
- Import and use all template hooks (filters, dialogs, actions, filtered)
- Fetch templates using `useTemplates` with includeDeactivated based on filter
- Compose page with: TemplatesPageHeader, TemplateTable with TemplateTableToolbar, TemplatesDialogs
- Handle loading state with TemplatesPageSkeleton
- Wrap in QueryErrorBoundary

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Page loads and displays templates
- [ ] All filters work correctly
- [ ] Create/Edit/Delete operations function
- [ ] Loading and error states handled
- [ ] All validation commands pass

---

### Step 16: Final Integration Testing and Cleanup

**What**: Verify all components work together and clean up any issues
**Why**: Ensures feature is complete and production-ready
**Confidence**: High

**Files to Modify:**

- All files created in previous steps (review and fix any issues)

**Changes:**

- Test all CRUD operations work end-to-end
- Verify filter combinations work correctly
- Test keyboard navigation and accessibility
- Ensure responsive behavior
- Fix any lint or type errors

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] All CRUD operations complete successfully
- [ ] Filters apply and reset correctly
- [ ] Dialogs open/close properly
- [ ] Table sorting and persistence works
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm typecheck`
- [ ] All files pass `pnpm lint`
- [ ] Templates page accessible at `/templates` route
- [ ] Create template flow works end-to-end
- [ ] Edit template flow works end-to-end
- [ ] Delete template flow works with confirmation
- [ ] Duplicate template creates new copy
- [ ] Category and status filters work correctly
- [ ] Search filters by name and description
- [ ] Built-in templates show as view-only in editor
- [ ] Placeholder management works within editor

## Notes

- Built-in templates (builtInAt !== null) should open in view mode only; editing should create a custom copy
- The template editor dialog includes placeholder management as a collapsible section
- Template categories are: backend, data, electron, security, ui
- Status toggle uses the deactivatedAt timestamp pattern (null = active)
- Follow exact patterns from agents page for consistency
- Shiki syntax highlighting for template body is a nice-to-have enhancement that can be added later
- Import/export functionality is not included in this initial implementation but can be added following the agents pattern

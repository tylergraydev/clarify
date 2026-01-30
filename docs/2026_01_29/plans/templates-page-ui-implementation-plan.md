# Templates Page UI Implementation Plan

**Generated**: 2026-01-29
**Original Request**: Templates Page UI with full management capabilities
**Refined Request**: Implement a comprehensive templates page UI in `app/(app)/templates/` that provides full template library management capabilities, building on the existing complete backend infrastructure.

## Analysis Summary

- Feature request refined with project context
- Discovered 35 files across 12+ directories
- Generated 15-step implementation plan
- All backend infrastructure confirmed complete (schema, repository, IPC handlers, query hooks)

## File Discovery Results

### Core Infrastructure (Already Complete)

| File                                        | Purpose                                                                  |
| ------------------------------------------- | ------------------------------------------------------------------------ |
| `db/schema/templates.schema.ts`             | Template schema with category enum, usageCount, builtInAt, deactivatedAt |
| `db/schema/template-placeholders.schema.ts` | Placeholder schema with name, displayName, validationPattern, orderIndex |
| `db/repositories/templates.repository.ts`   | Complete CRUD (13 methods)                                               |
| `electron/ipc/template.handlers.ts`         | All IPC operations                                                       |
| `hooks/queries/use-templates.ts`            | 9 TanStack Query hooks                                                   |

### Pattern References

| File                                        | Pattern                                       |
| ------------------------------------------- | --------------------------------------------- |
| `app/(app)/agents/page.tsx`                 | Page layout with nuqs, filters, grid, dialogs |
| `components/agents/agent-card.tsx`          | Card with badges, actions, status             |
| `components/agents/agent-editor-dialog.tsx` | Dialog form with TanStack Form                |

### Files to Create

1. `lib/validations/template.ts` - Zod validation schemas
2. `components/templates/template-card.tsx` - Template card component
3. `components/templates/placeholder-editor.tsx` - Placeholder management
4. `components/templates/template-editor-dialog.tsx` - Create/edit dialog
5. `components/workflows/template-picker-dialog.tsx` - Template picker for workflows

---

## Implementation Plan

## Overview

- **Estimated Duration**: 2-3 days
- **Complexity**: Medium
- **Risk Level**: Low

## Quick Summary

Implement a comprehensive templates management page with card/table view layouts, search/filter functionality, create/edit dialogs with placeholder management, and enhanced template selection for workflow creation. This builds on complete backend infrastructure (schemas, repositories, IPC handlers, TanStack Query hooks) requiring only frontend implementation following existing agents page patterns.

## Prerequisites

- [ ] Verify all backend infrastructure is functional (templates.repository.ts, template.handlers.ts, use-templates.ts)
- [ ] Review agents page implementation pattern (`app/(app)/agents/page.tsx`, `agent-card.tsx`, `agent-editor-dialog.tsx`)
- [ ] Confirm all UI primitives are available (`card`, `dialog`, `button`, `badge`, `empty-state`, form fields)
- [ ] Ensure TanStack Form `useAppForm` hook is accessible

## Implementation Steps

### Step 1: Create Template Validation Schemas

**What**: Create Zod validation schemas for template creation, editing, and placeholder management
**Why**: Establish type-safe validation layer for forms before building UI components
**Confidence**: High

**Files to Create**:

- `lib/validations/template.ts` - Template and placeholder validation schemas

**Changes**:

- Add `createTemplateSchema` with name, category, description validation
- Add `updateTemplateSchema` extending create schema with id and active state
- Add `templatePlaceholderSchema` with name, displayName, description, defaultValue, validationPattern (regex), orderIndex
- Add `templateWithPlaceholdersSchema` combining template and placeholder array
- Export type inference helpers for each schema

**Validation Commands**:

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria**:

- [ ] All schemas export proper TypeScript types
- [ ] Validation patterns match database schema constraints
- [ ] All validation commands pass

---

### Step 2: Build Template Card Component

**What**: Create template card component for grid view layout following agent-card.tsx pattern
**Why**: Provides reusable display component before building page layout
**Confidence**: High

**Files to Create**:

- `components/templates/template-card.tsx` - Template card display component

**Changes**:

- Import Card components and Badge from `components/ui`
- Accept template data prop with placeholders, usageCount, isBuiltIn, deactivatedAt
- Display template name, category badge, description truncated to 2 lines
- Show placeholder count badge and usage count metric
- Include active/deactivated state indicator
- Add built-in template badge when `isBuiltIn` is true
- Provide edit button that accepts onClick handler prop
- Use CVA for variant styling (default vs deactivated state)
- Follow Tailwind CSS 4.x conventions

**Validation Commands**:

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria**:

- [ ] Component renders all template metadata correctly
- [ ] Active/deactivated states visually distinct
- [ ] Follows existing card component patterns
- [ ] All validation commands pass

---

### Step 3: Build Placeholder Editor Component

**What**: Create placeholder editor component for managing template placeholder definitions
**Why**: Provides reusable placeholder management interface for both create and edit dialogs
**Confidence**: Medium

**Files to Create**:

- `components/templates/placeholder-editor.tsx` - Placeholder array management component

**Changes**:

- Accept placeholders array prop and onChange handler
- Use TanStack Form field components (TextField, TextareaField, NumberField)
- Implement add placeholder button with default values
- Create placeholder item card with drag handle for reordering
- Include remove placeholder button per item
- Add fields for: name (slug), displayName, description, defaultValue, validationPattern (regex), orderIndex
- Validate placeholder name format (alphanumeric, hyphens, underscores only)
- Provide regex pattern validation with error messages
- Auto-increment orderIndex when adding new placeholders
- Show validation errors inline per field

**Validation Commands**:

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria**:

- [ ] Users can add, edit, remove, and reorder placeholders
- [ ] Validation patterns work correctly
- [ ] Form state updates propagate to parent
- [ ] All validation commands pass

---

### Step 4: Build Template Editor Dialog Component

**What**: Create template editor dialog for creating and editing templates with placeholder management
**Why**: Central form component for template CRUD operations before page integration
**Confidence**: Medium

**Files to Create**:

- `components/templates/template-editor-dialog.tsx` - Template create/edit dialog

**Changes**:

- Import Dialog components, Button, form fields from `components/ui`
- Accept mode prop (create vs edit), template data for edit mode, onSave, onCancel handlers
- Use `useAppForm` with appropriate validation schema from step 1
- Include form fields: name (TextField), category (SelectField with enum options), description (TextareaField)
- Integrate PlaceholderEditor component for placeholder array management
- Add active/deactivated toggle (SwitchField) in edit mode only
- Show usage count metric in edit mode (read-only)
- Disable editing for built-in templates except active state toggle
- Wire up form submission to useCreateTemplate or useUpdateTemplate hooks
- Show loading state during submission
- Display toast notifications on success/error
- Handle dialog close and form reset

**Validation Commands**:

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria**:

- [ ] Dialog opens/closes correctly with proper form reset
- [ ] Create and edit modes render appropriate fields
- [ ] Built-in template restrictions enforced
- [ ] Form submission triggers correct mutations
- [ ] All validation commands pass

---

### Step 5: Implement Templates Page Core Layout

**What**: Create templates page main layout with header, view toggle, search/filter, and template list
**Why**: Establishes page structure before adding interactive features
**Confidence**: High

**Files to Modify**:

- `app/(app)/templates/page.tsx` - Replace placeholder with full implementation

**Changes**:

- Import useTemplates hook and required UI components
- Add page header with title "Templates" and create template button
- Implement view toggle buttons (card grid vs table layout) using nuqs for URL state
- Add search input with debounced search using nuqs searchParams
- Add category filter dropdown (all categories plus "All" option)
- Add active/deactivated filter toggle using nuqs
- Render loading skeleton during initial data fetch
- Show EmptyState component when no templates match filters
- Render TemplateCard components in grid layout when view mode is "cards"
- Prepare table layout structure for step 6 when view mode is "table"
- Handle error states with QueryErrorBoundary
- Wire create button to open TemplateEditorDialog in create mode

**Validation Commands**:

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria**:

- [ ] Page renders with proper header and controls
- [ ] Search and filters sync with URL state
- [ ] Create button opens dialog correctly
- [ ] Loading and empty states display appropriately
- [ ] All validation commands pass

---

### Step 6: Add Table View Layout Option

**What**: Implement table view layout alternative following agents page table pattern
**Why**: Provides compact view option for users managing many templates
**Confidence**: High

**Files to Modify**:

- `app/(app)/templates/page.tsx` - Add table layout rendering

**Changes**:

- Import Table components from `components/ui/table`
- Conditionally render table when view mode is "table"
- Add table columns: Name, Category (badge), Placeholders (count), Usage Count, Status (active/deactivated badge), Actions
- Display template name with description on hover
- Show category as colored badge matching card view
- Display placeholder count as numeric badge
- Show usage count metric
- Render active/deactivated status badge
- Add edit button action in Actions column
- Make rows clickable to open editor dialog
- Apply hover states and proper table styling
- Handle empty state within table structure

**Validation Commands**:

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria**:

- [ ] Table view displays all template information clearly
- [ ] Sorting and row actions work correctly
- [ ] View toggle switches between card and table seamlessly
- [ ] All validation commands pass

---

### Step 7: Wire Template List Interactions

**What**: Connect template cards/table rows to editor dialog and delete functionality
**Why**: Enables full CRUD operations through the UI
**Confidence**: High

**Files to Modify**:

- `app/(app)/templates/page.tsx` - Add edit and delete handlers

**Changes**:

- Add local state for selected template and editor dialog open state
- Implement handleEditTemplate function to open dialog with template data
- Implement handleDeleteTemplate function using useDeleteTemplate hook
- Add confirmation dialog for delete action (especially for templates with usage count > 0)
- Pass edit handler to TemplateCard and table row actions
- Update TemplateEditorDialog onSave to close dialog and invalidate queries
- Show toast notifications on successful create, update, delete
- Handle optimistic updates using TanStack Query cache
- Ensure template list refreshes after mutations

**Validation Commands**:

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria**:

- [ ] Edit opens dialog with correct template data
- [ ] Delete shows confirmation and removes template
- [ ] List updates reflect mutations immediately
- [ ] Toast notifications appear on all actions
- [ ] All validation commands pass

---

### Step 8: Implement Template Search and Filter Logic

**What**: Add client-side search and filter functionality for template list
**Why**: Helps users discover templates efficiently in large libraries
**Confidence**: High

**Files to Modify**:

- `app/(app)/templates/page.tsx` - Add filtering logic

**Changes**:

- Extract search term and filter values from nuqs searchParams
- Implement filterTemplates function that applies search and filters to template array
- Search against template name, description, category, and placeholder names
- Filter by category when category filter is not "All"
- Filter by active/deactivated state based on toggle
- Update template list rendering to use filtered results
- Show result count in page header or empty state
- Update empty state message to reflect active filters
- Add clear filters button when filters are active
- Ensure search and filters work in both card and table views

**Validation Commands**:

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria**:

- [ ] Search filters templates by name, description, category, placeholders
- [ ] Category and active state filters work correctly
- [ ] Empty state reflects current filter context
- [ ] Clear filters resets to full template list
- [ ] All validation commands pass

---

### Step 9: Create Template Picker Component for Workflow Creation

**What**: Build searchable template picker component for workflow feature request field
**Why**: Enhances workflow creation with template insertion and placeholder value filling
**Confidence**: Medium

**Files to Create**:

- `components/workflows/template-picker-dialog.tsx` - Template selection dialog with placeholder form

**Changes**:

- Import Dialog, Button, TextField components from `components/ui`
- Use useTemplates hook to fetch active templates only
- Add search input to filter templates by name/category
- Render template list with name, category badge, description, placeholder count
- Show template preview on selection with placeholder list
- Create placeholder value form when template is selected
- Generate form fields dynamically based on template placeholders
- Use placeholder displayName, description, defaultValue, validationPattern
- Validate placeholder values against validation patterns
- Add insert button that substitutes placeholder values into template content
- Return formatted template content with filled placeholders to parent
- Handle dialog close and form reset
- Provide cancel and insert actions

**Validation Commands**:

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria**:

- [ ] Dialog displays active templates with search
- [ ] Placeholder form generates correctly from template
- [ ] Validation patterns enforce correct input
- [ ] Insert returns properly formatted content
- [ ] All validation commands pass

---

### Step 10: Integrate Template Picker into Workflow Creation

**What**: Add template picker button to workflow creation feature request field
**Why**: Completes template insertion workflow enhancement
**Confidence**: Medium

**Files to Modify**:

- `app/(app)/workflows/new/page.tsx` - Add template picker integration (or equivalent workflow creation component)

**Changes**:

- Import TemplatePicker component
- Add "Insert Template" button near feature request textarea
- Open TemplatePicker dialog on button click
- Handle template insertion callback to append or replace textarea content
- Position cursor after inserted template content
- Show placeholder indicators in inserted text for user clarity
- Ensure textarea remains controlled component
- Update form validation to accept template-generated content
- Add tooltip explaining template feature

**Validation Commands**:

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria**:

- [ ] Insert template button opens picker
- [ ] Selected template with filled placeholders inserts correctly
- [ ] Textarea state updates properly
- [ ] User can continue editing after insertion
- [ ] All validation commands pass

---

### Step 11: Add Template Usage Tracking

**What**: Implement usage count increment when templates are used in workflow creation
**Why**: Provides usage metrics for template popularity and relevance
**Confidence**: Medium

**Files to Modify**:

- `components/workflows/template-picker-dialog.tsx` - Add usage tracking on insert
- `hooks/queries/use-templates.ts` - Verify incrementUsageCount mutation exists

**Changes**:

- Import useIncrementTemplateUsage hook (verify exists or matches naming)
- Call incrementUsageCount mutation when template is inserted
- Handle mutation optimistically to update local cache
- Don't block template insertion on usage tracking failure
- Log errors silently without disrupting user workflow
- Update template card usage count display after increment

**Validation Commands**:

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria**:

- [ ] Usage count increments when template is inserted
- [ ] Failure doesn't block template insertion
- [ ] Template list reflects updated usage counts
- [ ] All validation commands pass

---

### Step 12: Add Keyboard Shortcuts and Accessibility

**What**: Implement keyboard navigation and ARIA attributes for template management
**Why**: Ensures accessibility compliance and improved user experience
**Confidence**: Medium

**Files to Modify**:

- `app/(app)/templates/page.tsx` - Add keyboard shortcuts
- `components/templates/template-card.tsx` - Add ARIA attributes
- `components/templates/template-editor-dialog.tsx` - Add dialog accessibility
- `components/workflows/template-picker-dialog.tsx` - Add picker accessibility

**Changes**:

- Add keyboard shortcut (Ctrl/Cmd+K) to focus search input
- Add keyboard shortcut (Ctrl/Cmd+N) to open create template dialog
- Implement arrow key navigation in template grid/table
- Add proper ARIA labels to all interactive elements
- Ensure dialog focus trapping works correctly
- Add screen reader announcements for mutations
- Include skip links for keyboard navigation
- Test with keyboard-only navigation
- Verify all focusable elements have visible focus indicators

**Validation Commands**:

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria**:

- [ ] All keyboard shortcuts work correctly
- [ ] Screen reader navigation is logical
- [ ] Focus management follows accessibility guidelines
- [ ] All interactive elements are keyboard accessible
- [ ] All validation commands pass

---

### Step 13: Add Loading Skeletons and Optimistic Updates

**What**: Implement skeleton loading states and optimistic UI updates for mutations
**Why**: Improves perceived performance and user experience during async operations
**Confidence**: High

**Files to Modify**:

- `app/(app)/templates/page.tsx` - Add loading skeletons
- `components/templates/template-editor-dialog.tsx` - Add optimistic updates

**Changes**:

- Create skeleton components matching TemplateCard layout
- Show skeletons during initial template fetch
- Show skeletons during search/filter operations
- Implement optimistic updates for template creation (add to list immediately)
- Implement optimistic updates for template editing (update in place)
- Implement optimistic updates for template deletion (remove from list)
- Handle rollback on mutation failure with error toast
- Add loading spinner to dialog save button during submission
- Disable form fields during submission
- Show inline loading indicators for usage count updates

**Validation Commands**:

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria**:

- [ ] Skeletons match actual card/table layout
- [ ] Optimistic updates feel instant
- [ ] Rollback works correctly on errors
- [ ] Loading states are clear and consistent
- [ ] All validation commands pass

---

### Step 14: Add Template Duplicate Functionality

**What**: Add ability to duplicate existing templates with modifications
**Why**: Accelerates template creation by copying similar templates
**Confidence**: Medium

**Files to Modify**:

- `app/(app)/templates/page.tsx` - Add duplicate action
- `components/templates/template-card.tsx` - Add duplicate button
- `components/templates/template-editor-dialog.tsx` - Support duplicate mode

**Changes**:

- Add duplicate button to template card actions menu
- Add duplicate action to table row actions
- Implement handleDuplicateTemplate function
- Open editor dialog in create mode with duplicated template data
- Append "(Copy)" to template name
- Preserve category, description, and all placeholders
- Reset usage count to 0
- Set active state to true
- Clear built-in status
- Focus name field for user to rename

**Validation Commands**:

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria**:

- [ ] Duplicate button opens editor with copied data
- [ ] Name is modified to indicate copy
- [ ] All placeholders are preserved
- [ ] Usage count and built-in status reset
- [ ] All validation commands pass

---

### Step 15: Add Bulk Actions for Template Management

**What**: Implement multi-select and bulk operations (activate, deactivate, delete)
**Why**: Enables efficient management of multiple templates simultaneously
**Confidence**: Medium

**Files to Modify**:

- `app/(app)/templates/page.tsx` - Add bulk action UI and logic

**Changes**:

- Add checkbox to template cards and table rows for selection
- Add "Select All" checkbox in table header
- Show bulk action toolbar when templates are selected
- Add bulk activate button to activate all selected deactivated templates
- Add bulk deactivate button to deactivate all selected active templates
- Add bulk delete button with confirmation dialog
- Implement handleBulkActivate function using updateTemplate mutations
- Implement handleBulkDeactivate function using updateTemplate mutations
- Implement handleBulkDelete function using deleteTemplate mutations
- Show selection count in bulk action toolbar
- Add clear selection button
- Disable bulk actions for built-in templates
- Handle partial success scenarios with informative toasts

**Validation Commands**:

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria**:

- [ ] Multi-select works in both card and table views
- [ ] Bulk actions execute correctly
- [ ] Built-in templates protected from bulk operations
- [ ] Success/error feedback is clear
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck` without errors
- [ ] All files pass `pnpm run lint` without errors
- [ ] Template CRUD operations work correctly (create, read, update, delete)
- [ ] Search and filter functionality returns correct results
- [ ] Placeholder editor validates input correctly
- [ ] Template picker inserts formatted content with filled placeholders
- [ ] Usage count increments when templates are used
- [ ] Keyboard navigation and accessibility tested
- [ ] Loading states and optimistic updates feel smooth
- [ ] Error boundaries catch and display errors appropriately
- [ ] Toast notifications appear for all user actions
- [ ] Built-in templates cannot be edited except for active state
- [ ] Bulk actions work correctly with proper validation
- [ ] Component patterns match existing agents page implementation
- [ ] CVA styling variants are consistent with design system
- [ ] All dialogs implement proper focus trapping

## Notes

**Architecture Decisions:**

- **Pattern Consistency**: Following agents page architecture exactly ensures consistency and reduces learning curve
- **Placeholder Management**: Complex nested form state requires careful component extraction (PlaceholderEditor)
- **Template Picker Integration**: Separate dialog component enables reuse in different workflow contexts
- **Usage Tracking**: Non-blocking mutation prevents disrupting user workflow on tracking failures
- **Bulk Actions**: Implemented in final steps as enhancement since not critical to core functionality

**Risk Mitigation:**

- **Medium Confidence Areas**: Placeholder editor component (Step 3), template picker with dynamic forms (Step 9), bulk actions (Step 15)
- **Validation Strategy**: Regex pattern validation in placeholder editor requires careful testing with edge cases
- **Performance Consideration**: Large placeholder arrays may need virtualization in future iterations
- **Error Handling**: All mutations include proper error boundaries and rollback mechanisms

**Assumptions Requiring Confirmation:**

- TanStack Query hooks in `hooks/queries/use-templates.ts` include all required mutations (create, update, delete, incrementUsageCount)
- Template repository supports all operations documented in Step 1 validation schemas
- Workflow creation page location is `app/(app)/workflows/new/page.tsx` (verify actual path)
- Category enum values are accessible from schema exports for SelectField options

**Future Enhancements Not Included:**

- Template versioning and change history
- Template import/export functionality
- Template preview with syntax highlighting
- Advanced placeholder types (dropdown, date, number with constraints)
- Template analytics dashboard showing usage trends

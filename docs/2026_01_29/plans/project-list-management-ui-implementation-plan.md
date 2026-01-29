# Project List & Management UI Implementation Plan

**Generated**: 2026-01-29
**Feature**: Project List & Management UI
**Status**: Ready for Implementation

---

## Analysis Summary

- **Original Request**: Project list page, create dialog, detail page with tabs, archive functionality, hook wiring
- **Refined Request**: 345-word expansion with technical integration details
- **Files Discovered**: 45 relevant files (6 critical, 9 high, 13 medium, 17 low priority)
- **Implementation Steps**: 12 steps with 3 quality gates

---

## Overview

- **Estimated Duration**: 3-4 days
- **Complexity**: Medium
- **Risk Level**: Low

## Quick Summary

Implement a complete Project List & Management UI that serves as the organizational hub for workflows and repositories in Clarify. The feature leverages the existing fully-functional data layer (IPC handlers, repositories, query hooks) to provide card/table views of projects with create, archive/unarchive capabilities, plus a tabbed detail page with breadcrumb navigation. View preferences will persist via nuqs URL state, and the selected project context will integrate with the shell store and project selector component.

## Prerequisites

- [ ] Verify existing project IPC handlers function correctly (create, get, list, update, delete)
- [ ] Confirm useProjects, useCreateProject, useUpdateProject, useDeleteProject hooks work as expected
- [ ] Ensure Base UI components (Dialog, Card, Tabs, Button) are available and functional

## Implementation Steps

### Step 1: Extend Shell Store with Selected Project State

**What**: Add selectedProjectId state and actions to the Zustand shell store for tracking the currently active project across the application.

**Why**: The project context needs to be accessible globally for sidebar navigation updates and header project selector synchronization.

**Confidence**: High

**Files**:
- `lib/stores/shell-store.ts` (modify)

**Changes**:
- Add `selectedProjectId: number | null` to ShellState interface
- Add `setSelectedProject: (id: number | null) => void` to ShellActions interface
- Implement setSelectedProject action in the store creator
- Initialize selectedProjectId to null

**Validation Commands**:
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] ShellStore includes selectedProjectId state
- [ ] setSelectedProject action updates the state correctly
- [ ] All validation commands pass

---

### Step 2: Extend Project Query Keys for Archived Filtering

**What**: Update the project query key factory to properly support filtering by archived status, ensuring cache invalidation works correctly for filtered views.

**Why**: The project list needs to filter between active and archived projects, and TanStack Query needs proper cache keys to avoid stale data issues.

**Confidence**: High

**Files**:
- `lib/queries/projects.ts` (modify)

**Changes**:
- Ensure list query key factory correctly handles includeArchived filter parameter
- Add archived query key for filtered archived project lists if needed

**Validation Commands**:
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] Query keys differentiate between active-only and all-projects views
- [ ] All validation commands pass

---

### Step 3: Add Archive/Unarchive Mutation Hooks

**What**: Create useArchiveProject and useUnarchiveProject mutation hooks that toggle the archivedAt timestamp field.

**Why**: Archive operations need dedicated hooks with proper optimistic updates and cache invalidation to provide immediate UI feedback.

**Confidence**: High

**Files**:
- `hooks/queries/use-projects.ts` (modify)

**Changes**:
- Add useArchiveProject hook that calls project.update with archivedAt set to current ISO timestamp
- Add useUnarchiveProject hook that calls project.update with archivedAt set to null
- Both hooks should invalidate projectKeys.list._def and update detail cache
- Follow existing mutation pattern with useElectron and useQueryClient

**Validation Commands**:
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] useArchiveProject sets archivedAt to current timestamp
- [ ] useUnarchiveProject clears archivedAt to null
- [ ] Both hooks follow existing mutation patterns with proper cache invalidation
- [ ] All validation commands pass

---

### Step 4: Add Projects Navigation Item to Sidebar

**What**: Add a Projects navigation item to the app sidebar below Dashboard, using the FolderKanban icon.

**Why**: Users need direct navigation access to the project management section from the main sidebar.

**Confidence**: High

**Files**:
- `components/shell/app-sidebar.tsx` (modify)

**Changes**:
- Import FolderKanban icon from lucide-react
- Add NavItem for Projects route after Dashboard section (before Separator)
- Use $path with route "/projects" for the href
- Add isPathActive check for the projects route

**Validation Commands**:
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] Projects nav item appears in sidebar below Dashboard
- [ ] Active state displays correctly when on projects routes
- [ ] Navigation works for both collapsed and expanded sidebar states
- [ ] All validation commands pass

---

### Step 5: Create Project Card Component

**What**: Build a reusable project card component that displays project name, description, creation date, and archive status with visual indicators.

**Why**: The card view needs a dedicated component to render each project with consistent styling and inline action buttons.

**Confidence**: High

**Files**:
- `components/projects/project-card.tsx` (create)

**Changes**:
- Create ProjectCard component accepting Project type as prop
- Display project name as CardTitle, description as CardDescription
- Show creation date formatted with date-fns
- Add visual indicator (Badge) for archived status
- Include inline action buttons for archive/unarchive and view details
- Use Card, CardHeader, CardContent, CardFooter from existing UI components
- Add onClick handler prop for navigation to detail page
- Apply opacity or muted styling for archived projects

**Validation Commands**:
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] Card displays all project information correctly
- [ ] Archived projects have visual distinction (badge, muted styling)
- [ ] Action buttons are accessible and keyboard navigable
- [ ] All validation commands pass

---

### Step 6: Create Confirm Archive Dialog Component

**What**: Build a confirmation dialog component for archive and unarchive operations to prevent accidental actions.

**Why**: Destructive or significant state changes should require user confirmation to prevent accidents.

**Confidence**: High

**Files**:
- `components/projects/confirm-archive-dialog.tsx` (create)

**Changes**:
- Create ConfirmArchiveDialog component using DialogRoot, DialogTrigger, DialogPortal, DialogBackdrop, DialogPopup
- Accept props for project name, isArchived (to determine action direction), onConfirm callback, and isLoading state
- Display appropriate title and description based on archive/unarchive action
- Include Cancel and Confirm buttons with destructive variant for confirm
- Pass loading state to disable buttons during mutation
- Use DialogClose for the cancel action

**Validation Commands**:
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] Dialog opens and closes correctly via trigger
- [ ] Displays appropriate messaging for archive vs unarchive
- [ ] Buttons are disabled during loading state
- [ ] All validation commands pass

---

### Step 7: Create Project Table Component

**What**: Build a table view component for displaying projects in a compact list format with sortable columns.

**Why**: Users need an alternative view to cards for managing larger numbers of projects efficiently.

**Confidence**: Medium

**Files**:
- `components/projects/project-table.tsx` (create)

**Changes**:
- Create ProjectTable component accepting projects array as prop
- Build semantic HTML table with accessible structure (thead, tbody, th scope)
- Include columns: Name, Description (truncated), Created, Status, Actions
- Add Archive/Unarchive action buttons in Actions column
- Use Badge component for status column
- Apply consistent row hover states and borders
- Make rows clickable for navigation to detail page
- Integrate ConfirmArchiveDialog for archive actions

**Validation Commands**:
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] Table renders all projects with correct column data
- [ ] Rows are clickable and navigate to project detail
- [ ] Archive actions show confirmation dialog
- [ ] Table is accessible with proper semantic markup
- [ ] All validation commands pass

---

### Step 8: Create Create Project Dialog Component

**What**: Build a dialog with a TanStack Form for creating new projects with validation.

**Why**: Users need a modal interface to create projects without navigating away from the list view.

**Confidence**: High

**Files**:
- `components/projects/create-project-dialog.tsx` (create)

**Changes**:
- Create CreateProjectDialog component using DialogRoot and form components
- Use useAppForm hook with defaultValues for name (empty string) and description (empty string)
- Implement name validation: required, non-empty, minimum length
- Add TextField for project name with isRequired prop
- Add TextareaField for project description (optional)
- Include SubmitButton with loading state from form
- Use useCreateProject hook on form submit
- Close dialog on successful creation
- Display FormError for server errors

**Validation Commands**:
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] Form validates name as required and non-empty
- [ ] Successful creation closes dialog and shows new project in list
- [ ] Loading state prevents double submission
- [ ] Error states display appropriately
- [ ] All validation commands pass

---

### Step 9: Create Project List Page

**What**: Build the main projects list page with card/table view toggle, create button, and archive filter.

**Why**: This is the primary entry point for project management, requiring all components to work together.

**Confidence**: High

**Files**:
- `app/(app)/projects/page.tsx` (create)

**Changes**:
- Create ProjectsPage component with standard page heading structure
- Use useProjects hook to fetch project list
- Implement nuqs parseAsStringLiteral for view preference (card | table) with default card
- Implement nuqs parseAsBoolean for showArchived filter with default false
- Add ButtonGroup or tabs for view toggle (card/table)
- Add checkbox or toggle for "Show archived" filter
- Add "Create Project" button that opens CreateProjectDialog
- Render ProjectCard grid or ProjectTable based on view preference
- Filter projects based on showArchived state
- Display EmptyState when no projects exist with action to create first project
- Wrap data-dependent UI with QueryErrorBoundary
- Show loading skeleton while data is fetching

**Validation Commands**:
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] Page displays projects in selected view format
- [ ] View toggle persists preference to URL via nuqs
- [ ] Archive filter correctly shows/hides archived projects
- [ ] Create dialog opens and creates projects successfully
- [ ] Empty state displays when no projects exist
- [ ] All validation commands pass

---

### Step 10: Create Project Detail Page with Tabbed Layout

**What**: Build the project detail page with breadcrumb navigation and a tabbed placeholder layout for future content.

**Why**: Users need a dedicated page to view and manage individual project details with room for future tabs (repositories, workflows, settings).

**Confidence**: High

**Files**:
- `app/(app)/projects/[id]/page.tsx` (create)

**Changes**:
- Create ProjectDetailPage component with dynamic route parameter
- Extract project ID from route params and parse as number
- Use useProject hook to fetch single project by ID
- Display breadcrumb navigation: Projects > [Project Name]
- Show project name as page title with description below
- Implement TabsRoot with TabsList containing placeholder tabs: Overview, Repositories, Workflows, Settings
- Add TabsIndicator for active tab styling
- Create TabsPanel for each tab with placeholder content
- Display project metadata (created date, updated date, archive status)
- Add Edit and Archive/Unarchive buttons in header area
- Update shell store selectedProjectId when page loads
- Handle loading and error states
- Redirect to projects list if project not found

**Validation Commands**:
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] Page loads correct project based on route ID
- [ ] Breadcrumb navigation works correctly
- [ ] Tabs render and switch between panels
- [ ] Shell store receives selected project ID
- [ ] Loading and error states display appropriately
- [ ] All validation commands pass

---

### Step 11: Integrate Project Selector with Shell Store

**What**: Update the project selector component in the header to read from and write to the shell store for selected project state.

**Why**: The header project selector needs to stay synchronized with the currently viewed project context.

**Confidence**: High

**Files**:
- `components/shell/project-selector.tsx` (modify)

**Changes**:
- Import useShellStore from lib/stores/shell-store
- Read selectedProjectId from shell store for controlled value
- Call setSelectedProject from shell store when selection changes
- Update component to use shell store value as default when no explicit value prop provided
- Ensure two-way binding: selecting project updates store, viewing project detail updates store

**Validation Commands**:
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] Project selector reflects currently selected project from shell store
- [ ] Changing selection in dropdown updates shell store
- [ ] Navigating to project detail page updates selector
- [ ] All validation commands pass

---

### Step 12: Add Type-Safe Route Definitions

**What**: Generate type-safe route definitions for the new project pages using next-typesafe-url.

**Why**: The project uses next-typesafe-url for type-safe routing, and new routes need to be registered for $path usage.

**Confidence**: High

**Files**:
- Run `pnpm next-typesafe-url` to regenerate route definitions

**Changes**:
- Execute the route generation command after creating new page files
- Verify generated types include /projects and /projects/[id] routes
- Update any $path usages in components to use new route types

**Validation Commands**:
```bash
pnpm next-typesafe-url && pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] Route types generated for /projects and /projects/[id]
- [ ] $path function works with new routes in NavItem
- [ ] All validation commands pass

---

## Quality Gates

### After Step 4: Navigation Foundation Complete
- [ ] Shell store has selectedProjectId state
- [ ] Query keys support archived filtering
- [ ] Archive/unarchive hooks are functional
- [ ] Projects nav item appears in sidebar
- [ ] `pnpm run lint:fix && pnpm run typecheck` passes

### After Step 8: Components Complete
- [ ] ProjectCard renders correctly with all data
- [ ] ProjectTable displays projects in rows
- [ ] ConfirmArchiveDialog shows appropriate messaging
- [ ] CreateProjectDialog validates and submits
- [ ] `pnpm run lint:fix && pnpm run typecheck` passes

### After Step 12: Feature Complete
- [ ] Projects list page displays with view toggle
- [ ] Create, archive, unarchive operations work
- [ ] Project detail page loads with tabs
- [ ] Project selector syncs with shell store
- [ ] URL state persists view preferences
- [ ] Empty states display correctly
- [ ] Loading and error states work
- [ ] `pnpm run lint:fix && pnpm run typecheck` passes

## Notes

- The existing data layer (IPC handlers, repositories, ElectronAPI) is already complete, making this primarily a UI implementation task
- Project name uniqueness validation mentioned in the request requires checking against existing projects during form submission; this may need a separate API endpoint or client-side check
- The tabbed detail page is structured as a placeholder for future work on repositories, workflows, and settings tabs
- Archive/unarchive uses the existing update endpoint rather than dedicated endpoints, which is the current API design
- Consider adding keyboard shortcuts (Cmd/Ctrl+N for new project) in a future iteration
- The project selector integration assumes single-project context; multi-select would require architectural changes

---

## File Discovery Reference

### Files to Create
| File | Purpose |
|------|---------|
| `app/(app)/projects/page.tsx` | Project list page |
| `app/(app)/projects/[id]/page.tsx` | Project detail page |
| `components/projects/project-card.tsx` | Card view component |
| `components/projects/project-table.tsx` | Table view component |
| `components/projects/create-project-dialog.tsx` | Create form dialog |
| `components/projects/confirm-archive-dialog.tsx` | Confirmation dialog |

### Files to Modify
| File | Changes |
|------|---------|
| `lib/stores/shell-store.ts` | Add selectedProjectId state |
| `lib/queries/projects.ts` | Extend for archived filters |
| `hooks/queries/use-projects.ts` | Add archive/unarchive hooks |
| `components/shell/app-sidebar.tsx` | Add Projects nav item |
| `components/shell/project-selector.tsx` | Integrate with shell store |

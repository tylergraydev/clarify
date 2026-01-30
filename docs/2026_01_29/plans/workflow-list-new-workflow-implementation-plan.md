# Workflow List & New Workflow Entry - Implementation Plan

**Generated**: 2026-01-29
**Original Request**: Create workflow list page with status filtering, search, and table/card views; Build new workflow creation dialog with repository selection, feature request input, and template selection; Implement workflow configuration (pause behavior, timeout settings)

**Refined Request**: Implement the workflow list page and new workflow creation dialog to establish the primary user journey for Clarify's core orchestration feature. The workflow infrastructure is fully complete on the backend with the database schema defining workflows with status types (created, running, paused, editing, completed, failed, cancelled), workflow types (planning, implementation), and pause behaviors (continuous, auto_pause, gates_only), along with corresponding repositories, IPC handlers in the workflow domain, and TanStack Query hooks (useWorkflows, useWorkflow, useWorkflowsByProject, useCreateWorkflow, useCancelWorkflow, usePauseWorkflow, useResumeWorkflow, useStartWorkflow) already implemented. The workflow list page at /workflows should follow the established Projects page pattern, featuring a dual card/table view toggle, status-based filtering using the existing workflow status enum, text search functionality, proper loading states with skeletons, and meaningful empty states that guide users toward creating their first workflow. URL state for filters and view mode should be managed via nuqs for persistence and shareability. The new workflow creation flow should be implemented as a dialog component built on Base UI primitives with CVA styling patterns, incorporating a multi-step or sectioned form using TanStack Form that collects repository selection (leveraging the existing repository hooks and project context), feature request text input with optional template selection from the template library, workflow type selection between planning and implementation modes, and configuration options for pause behavior and timeout settings. The form should use the existing query key factory pattern for proper cache invalidation after successful creation via useCreateWorkflow, redirecting users to the newly created workflow detail view. All components should integrate with the app shell layout, respect the established dark/light theme system via CSS variables, and maintain accessibility through proper Base UI component composition. This implementation directly unblocks the active workflows view, workflow history page, individual workflow detail view with step visualization, and ultimately the entire planning and implementation pipeline that represents Clarify's core value proposition of providing visual, pausable control over Claude Code CLI orchestration workflows.

---

## Analysis Summary

- Feature request refined with project context
- Discovered 47 files across 5 priority levels
- Generated 8-step implementation plan

## File Discovery Results

### Critical Files (Must modify/create)

| File                                              | Action | Purpose                       |
| ------------------------------------------------- | ------ | ----------------------------- |
| `app/(app)/workflows/page.tsx`                    | Modify | Main workflow list page       |
| `app/(app)/workflows/new/page.tsx`                | Modify | New workflow creation page    |
| `components/workflows/create-workflow-dialog.tsx` | Create | Multi-section creation dialog |
| `components/workflows/workflow-card.tsx`          | Create | Card view component           |
| `components/workflows/workflow-table.tsx`         | Create | Table view component          |
| `app/(app)/workflows/route-type.ts`               | Create | Type-safe route parameters    |
| `lib/validations/workflow.ts`                     | Create | Zod validation schema         |

### Key Reference Files

- `app/(app)/projects/page.tsx` - Primary pattern reference for list page
- `components/projects/create-project-dialog.tsx` - Dialog form pattern
- `components/projects/project-card.tsx` - Card component pattern
- `components/projects/project-table.tsx` - Table component pattern
- `hooks/queries/use-workflows.ts` - Existing query hooks
- `db/schema/workflows.schema.ts` - Workflow schema with types

---

## Implementation Plan

## Overview

**Estimated Duration**: 2-3 days
**Complexity**: Medium
**Risk Level**: Low

## Quick Summary

Implement the workflow list page at `/workflows` with dual card/table view toggle, status-based filtering, text search, and a multi-section creation dialog. This follows the established Projects page pattern and leverages existing TanStack Query hooks (`useWorkflows`, `useCreateWorkflow`), form infrastructure (`useAppForm`), and UI components (Base UI primitives with CVA patterns).

## Prerequisites

- [ ] Verify existing workflow hooks are functional (`useWorkflows`, `useCreateWorkflow`)
- [ ] Confirm workflow schema exports are available from `@/types/electron`
- [ ] Ensure `useProjects`, `useRepositoriesByProject`, `useActiveTemplates` hooks are working
- [ ] Verify `next-typesafe-url` is configured for the `/workflows` and `/workflows/[id]` routes

## Implementation Steps

### Step 1: Create Workflow Validation Schema

**What**: Create Zod validation schema for workflow creation form
**Why**: Provides type-safe form validation consistent with the project pattern (mirrors `lib/validations/project.ts`)
**Confidence**: High

**Files to Create:**

- `C:\Users\jasonpaff\dev\clarify\lib\validations\workflow.ts` - Workflow form validation schema

**Changes:**

- Define `createWorkflowSchema` with fields: `projectId` (required number), `featureName` (required string, 1-255 chars), `featureRequest` (required string, 1-10000 chars), `type` (enum: planning/implementation), `pauseBehavior` (enum: continuous/auto_pause/gates_only with default), `templateId` (optional number)
- Export inferred TypeScript type `CreateWorkflowFormValues`
- Import pause behaviors and workflow types from `@/db/schema/workflows.schema`

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Schema exports `createWorkflowSchema` and `CreateWorkflowFormValues`
- [ ] Schema validates all required workflow creation fields
- [ ] All validation commands pass

---

### Step 2: Create Route Type Definition for Workflows Page

**What**: Define type-safe route parameters for the workflows list page
**Why**: Enables URL state persistence for view mode, status filter, and search query via nuqs with type safety
**Confidence**: High

**Files to Create:**

- `C:\Users\jasonpaff\dev\clarify\app\(app)\workflows\route-type.ts` - Route type definitions

**Changes:**

- Define `VIEW_OPTIONS` constant array (`['card', 'table']`)
- Define `Route` object with `searchParams` Zod schema including: `view` (enum with default 'card'), `status` (optional workflow status enum), `search` (optional string), `projectId` (optional number for filtering)
- Export `RouteType` type alias

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Route type exports `Route` and `RouteType`
- [ ] Search params schema includes view, status, search, and projectId
- [ ] All validation commands pass

---

### Step 3: Create Workflow Card Component

**What**: Build reusable card component for displaying individual workflows
**Why**: Enables card view display with status badge, progress indication, and action buttons following ProjectCard pattern
**Confidence**: High

**Files to Create:**

- `C:\Users\jasonpaff\dev\clarify\components\workflows\workflow-card.tsx` - Workflow card component

**Changes:**

- Define `WorkflowCardProps` interface with `workflow`, `projectName`, `onViewDetails`, `onCancel` callbacks
- Implement card with header (feature name, status badge), content (project name, workflow type, progress bar), footer (created date, duration, action buttons)
- Use existing `getStatusVariant` and `formatStatus` helper functions from active-workflows-widget pattern
- Use existing Badge, Button, Card components from UI library
- Display progress as `currentStepNumber/totalSteps` with percentage
- Show elapsed time using date-fns formatDistanceToNow

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Component renders workflow data correctly
- [ ] Status badge uses appropriate variant mapping
- [ ] Progress visualization matches active-workflows-widget pattern
- [ ] All validation commands pass

---

### Step 4: Create Workflow Table Component

**What**: Build table component for displaying workflows in list format
**Why**: Provides alternative dense view for workflow management following ProjectTable pattern
**Confidence**: High

**Files to Create:**

- `C:\Users\jasonpaff\dev\clarify\components\workflows\workflow-table.tsx` - Workflow table component

**Changes:**

- Define `WorkflowTableProps` interface with `workflows` array, `projectMap` for name lookup, callbacks for actions
- Implement table with columns: Feature Name (clickable), Project, Type, Status (Badge), Progress, Created, Actions
- Add row click handling for navigation to detail view
- Add action buttons (View, Cancel) in final column with stopPropagation
- Apply hover styles and archived/cancelled opacity styling
- Use scope="col" for accessibility on headers

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Table displays all workflow columns correctly
- [ ] Row click navigates to workflow detail
- [ ] Action buttons work independently of row click
- [ ] All validation commands pass

---

### Step 5: Create Workflow Creation Dialog Component

**What**: Build multi-section dialog for creating new workflows
**Why**: Central workflow creation interface collecting project, feature request, type, and configuration options
**Confidence**: Medium

**Files to Create:**

- `C:\Users\jasonpaff\dev\clarify\components\workflows\create-workflow-dialog.tsx` - Creation dialog component

**Changes:**

- Define `CreateWorkflowDialogProps` interface with `trigger` ReactNode and optional `onSuccess` callback
- Use DialogRoot, DialogTrigger, DialogPortal, DialogBackdrop, DialogPopup, DialogTitle, DialogDescription, DialogClose from `@/components/ui/dialog`
- Implement form using `useAppForm` with `createWorkflowSchema` validator
- Form sections: Project Selection (SelectField using `useProjects`), Feature Request (TextareaField with optional template selection dropdown), Workflow Type (RadioField for planning/implementation), Configuration (SelectField for pauseBehavior)
- Add template selection that populates featureRequest textarea when selected (using `useActiveTemplates`)
- Handle form submission with `useCreateWorkflow` mutation
- On success: close dialog, reset form, call onSuccess, redirect to new workflow detail page using router.push with $path
- Show loading state during submission

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Dialog opens and closes correctly
- [ ] Form validates all required fields
- [ ] Template selection populates feature request
- [ ] Successful submission creates workflow and navigates to detail
- [ ] All validation commands pass

---

### Step 6: Implement Workflows List Page

**What**: Build the main workflows page with filtering, search, and view toggle
**Why**: Primary entry point for workflow management, enabling users to view, filter, and create workflows
**Confidence**: High

**Files to Modify:**

- `C:\Users\jasonpaff\dev\clarify\app\(app)\workflows\page.tsx` - Replace placeholder with full implementation

**Changes:**

- Add "use client" directive
- Import components: QueryErrorBoundary, CreateWorkflowDialog, WorkflowCard, WorkflowTable, Button, ButtonGroup, EmptyState, Input, Select components
- Import hooks: useWorkflows, useProjects, useCancelWorkflow
- Import nuqs hooks: parseAsStringLiteral, parseAsString, parseAsNumber, useQueryState
- Import Route from route-type.ts, wrap with withParamValidation HOC
- Implement URL state for view, status filter, search query, projectId filter
- Create skeleton components for card and table loading states (following Projects page pattern)
- Implement filter logic using useMemo to filter workflows by status, search term (matches featureName), and projectId
- Build page layout with: heading section (title, description, Create Workflow button), filter controls (view toggle ButtonGroup, status Select, search Input, project Select), content area (skeletons during loading, EmptyState when no workflows, WorkflowCard grid or WorkflowTable based on view)
- Handle workflow cancellation via useCancelWorkflow mutation
- Empty state guides users to create first workflow

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Page displays workflows from useWorkflows hook
- [ ] View toggle switches between card and table views
- [ ] Status filter correctly filters workflows
- [ ] Search filters by feature name
- [ ] Empty state displays when no workflows exist
- [ ] Loading skeletons display during data fetch
- [ ] All validation commands pass

---

### Step 7: Update New Workflow Page to Use Dialog or Redirect

**What**: Update the `/workflows/new` page to either render the dialog inline or redirect to workflows page with dialog open
**Why**: Provides consistent UX for workflow creation from both the list page button and direct navigation
**Confidence**: Medium

**Files to Modify:**

- `C:\Users\jasonpaff\dev\clarify\app\(app)\workflows\new\page.tsx` - Update to render creation form or redirect

**Changes:**

- Import CreateWorkflowDialog component
- Render the dialog content directly (not as a triggered dialog) in a Card container
- Alternatively, implement as a full page form if dialog approach is too constrained
- Use the same form structure and validation as the dialog
- Include back navigation to /workflows
- On successful creation, redirect to the workflow detail page

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Page renders workflow creation form
- [ ] Form validation works correctly
- [ ] Successful submission creates workflow and redirects
- [ ] Back navigation returns to workflows list
- [ ] All validation commands pass

---

### Step 8: Run Type Generation and Final Validation

**What**: Generate type-safe route definitions and verify all types are correct
**Why**: Ensures next-typesafe-url picks up new route definitions and all components integrate correctly
**Confidence**: High

**Files to Modify:**

- None (command execution only)

**Changes:**

- Run `pnpm next-typesafe-url` to regenerate route types
- Run full lint and typecheck to catch any integration issues
- Verify imports across all new files are resolving correctly

**Validation Commands:**

```bash
pnpm next-typesafe-url && pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Route types generated successfully
- [ ] No TypeScript errors across the codebase
- [ ] No lint errors
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint`
- [ ] Route types regenerated with `pnpm next-typesafe-url`
- [ ] Workflow list page displays workflows correctly
- [ ] Card/table view toggle persists to URL
- [ ] Status and search filters work correctly
- [ ] Create workflow dialog validates and submits successfully
- [ ] New workflow redirects to detail page after creation
- [ ] Empty states guide users appropriately
- [ ] Loading skeletons display during data fetching

## Notes

**Architectural Decisions:**

- Following established Projects page pattern exactly for consistency
- Using existing `getStatusVariant` helper pattern from active-workflows-widget for status badge mapping
- Leveraging pre-built form field components (TextField, TextareaField, SelectField, RadioField) via `useAppForm`
- URL state managed via nuqs for filter persistence and shareability

**Assumptions Requiring Confirmation:**

- The workflow detail route `/workflows/[id]` exists or will be created (used for navigation after creation)
- `useActiveTemplates` returns templates with `content` field that can populate feature request

**Risk Mitigation:**

- Step validation commands ensure each step is independently verifiable
- Using existing hooks reduces integration risk
- Following established patterns minimizes architectural risk

**Dependencies:**

- Step 5 (Dialog) depends on Step 1 (Validation Schema)
- Step 6 (List Page) depends on Steps 2, 3, 4, 5
- Step 7 depends on Step 5
- Step 8 should run last after all files are created

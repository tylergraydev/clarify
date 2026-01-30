# Workflow Detail and Pipeline View Implementation Plan

**Generated**: 2026-01-29
**Verified**: 2026-01-29 (confirmed against current codebase)
**Original Request**: Workflow Detail & Pipeline View - Build /workflows/[id] page with pipeline visualization, step progress indicators, expandable detail panels, and workflow controls
**Refined Request**: The Workflow Detail and Pipeline View feature implements the /workflows/[id] dynamic route page to visualize workflow execution progress through the orchestration pipeline stages (Clarify, Refine, Discover, Plan). This page serves as the primary interface for monitoring and controlling active workflows after creation.

## Analysis Summary

- Feature request refined with project context
- Discovered 40 files across all application layers
- Generated 8-step implementation plan

## File Discovery Results

### Critical Priority (Must Modify/Create)

1. `app/(app)/workflows/[id]/page.tsx` - Main page file, currently placeholder. Complete rewrite needed.
2. `app/(app)/workflows/[id]/route-type.ts` - Route type definition for type-safe params.

### High Priority (Reference - No Changes Needed)

1. `hooks/queries/use-workflows.ts` - Workflow query hooks (all needed hooks exist: `useWorkflow`, `usePauseWorkflow`, `useResumeWorkflow`, `useCancelWorkflow`)
2. `hooks/queries/use-steps.ts` - Step query hooks (has `useStepsByWorkflow`)
3. `lib/queries/steps.ts` - Query key factory for steps
4. `lib/queries/workflows.ts` - Query key factory for workflows
5. `components/ui/badge.tsx` - Existing variants sufficient (use mapping pattern from `workflow-card.tsx`)

### Key Reference Files

- `db/schema/workflow-steps.schema.ts` - Step statuses: pending, running, paused, editing, completed, failed, skipped
- `db/schema/workflows.schema.ts` - Workflow statuses: created, running, paused, editing, completed, failed, cancelled
- `app/(app)/projects/[id]/page.tsx` - Reference for dynamic route pattern (useRouteParams, skeleton, not-found components)
- `app/(app)/workflows/page.tsx` - Reference for workflow list patterns (filtering, card/table views, mutations)
- `components/workflows/workflow-card.tsx` - Reference for status-to-badge-variant mapping pattern
- `components/ui/collapsible.tsx` - For expandable step panels

---

## Implementation Plan

## Overview

- **Estimated Complexity**: High
- **Risk Level**: Medium
- **Total Steps**: 8

## Quick Summary

This plan implements the /workflows/[id] dynamic route page to visualize workflow execution progress through orchestration pipeline stages. The implementation creates a pipeline visualization with expandable step nodes showing real-time status, input/output data, and workflow control actions (pause, resume, cancel), following existing CVA patterns and TanStack Query integration.

## Prerequisites

- [ ] Verify existing IPC handlers in `electron/ipc/step.handlers.ts` are functional
- [ ] Confirm TanStack Query hooks in `hooks/queries/use-workflows.ts` and `hooks/queries/use-steps.ts` work correctly
- [ ] Ensure database schema types are exported from `db/schema/index.ts`
- [ ] Verify `next-typesafe-url` route generation works with `pnpm next-typesafe-url`

## Implementation Steps

### Step 1: Create Step Status Badge Mapping Utility

- **What**: Create a status-to-variant mapping utility for step statuses, following the established pattern in `components/workflows/workflow-card.tsx`.
- **Why**: The existing badge variants are sufficient when mapped appropriately. The `workflow-card.tsx` already demonstrates this pattern for workflow statuses. Reusing existing variants maintains consistency and avoids unnecessary additions to the badge component.
- **Confidence**: High

**Files to Create:**

- `app/(app)/workflows/[id]/_components/step-status-badge.tsx` - Step status badge with mapping

**Changes:**

- Create a `StepStatusBadge` component that wraps Badge with step-specific mapping
- Implement status-to-variant mapping following `workflow-card.tsx` pattern:
  ```typescript
  const stepStatusVariantMap: Record<StepStatus, BadgeVariant> = {
    pending: "default", // neutral gray
    running: "planning", // purple (indicates active work)
    paused: "draft", // neutral gray
    editing: "clarifying", // yellow
    completed: "completed", // green
    failed: "failed", // red
    skipped: "stale", // amber/muted
  };
  ```
- Export helper function `getStepStatusVariant(status: StepStatus): BadgeVariant`
- Include formatted label display (capitalize first letter)

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] StepStatusBadge component renders correct variant for each step status
- [ ] Mapping covers all statuses: pending, running, paused, editing, completed, failed, skipped
- [ ] All validation commands pass
- [ ] No changes required to `components/ui/badge.tsx`

---

### Step 2: Create Pipeline Step Node Component

- **What**: Create a reusable `PipelineStepNode` component that displays a single workflow step as a node in the pipeline visualization, including status indicator, step type icon, title, and expand/collapse trigger.
- **Why**: This is the core building block of the pipeline view. It encapsulates the visual representation of each step with its status badge, allowing for consistent rendering across the pipeline.
- **Confidence**: High

**Files to Create:**

- `app/(app)/workflows/[id]/_components/pipeline-step-node.tsx` - Pipeline step node component

**Changes:**

- Create component accepting `WorkflowStep` data as props
- Implement status badge using `StepStatusBadge` component from Step 1
- Add step type icon mapping (clarification, refinement, discovery, planning, routing, implementation, quality_gate, gemini_review)
- Use `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` from `components/ui/collapsible.tsx` for expand/collapse behavior
- Include step number indicator and title display
- Add visual connector line (border or separator) between nodes for pipeline flow visualization
- Implement CVA variants for different step states (active, completed, failed, pending)

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Component renders step with status badge, icon, title, and step number
- [ ] Collapsible trigger expands/collapses step details
- [ ] Component follows CVA pattern with appropriate variants
- [ ] All validation commands pass

---

### Step 3: Create Step Detail Panel Component

- **What**: Create a `StepDetailPanel` component that renders inside the collapsible content area, showing the step's input data (inputText), output data (outputText), timing information, and error messages if any.
- **Why**: Users need to inspect what went into each step and what came out. This panel provides the detailed view when a step node is expanded.
- **Confidence**: High

**Files to Create:**

- `app/(app)/workflows/[id]/_components/step-detail-panel.tsx` - Step detail panel component

**Changes:**

- Create component accepting `WorkflowStep` data as props
- Display input section with `inputText` content in a scrollable, styled container
- Display output section with `outputText` content, also scrollable
- Show timing metadata: `startedAt`, `completedAt`, `durationMs`
- Display `errorMessage` with destructive styling if present (failed steps)
- Display `originalOutputText` vs `outputText` diff indicator if step was edited (`outputEditedAt` is set)
- Use Card/CardContent patterns from `components/ui/card.tsx` for section structure
- Add max-height with overflow-y-auto for long content areas

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Panel displays input and output sections with appropriate headings
- [ ] Long content is scrollable within constrained height
- [ ] Error messages display with red/destructive styling
- [ ] Edited output indicator shows when `outputEditedAt` is present
- [ ] All validation commands pass

---

### Step 4: Create Workflow Control Bar Component

- **What**: Create a `WorkflowControlBar` component with Pause, Resume, and Cancel action buttons that trigger the corresponding workflow mutations.
- **Why**: Users need prominent controls to manage workflow execution. This component encapsulates the control logic and button states based on current workflow status.
- **Confidence**: High

**Files to Create:**

- `app/(app)/workflows/[id]/_components/workflow-control-bar.tsx` - Workflow control bar component

**Changes:**

- Create component accepting workflow data and mutation handlers as props
- Implement Pause button - enabled when workflow status is `running`, calls `usePauseWorkflow` mutation
- Implement Resume button - enabled when workflow status is `paused`, calls `useResumeWorkflow` mutation
- Implement Cancel button - enabled when workflow status is `created`, `running`, or `paused`, calls `useCancelWorkflow` mutation
- Add loading states for each button during mutation (disable and show spinner/loading text)
- Use Button component with appropriate variants (outline for pause/resume, destructive for cancel)
- Include lucide icons: `Pause`, `Play`, `XCircle` or similar
- Position as sticky header bar or inline with page header

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Pause button shows and is clickable when workflow is running
- [ ] Resume button shows and is clickable when workflow is paused
- [ ] Cancel button shows for cancellable statuses
- [ ] Buttons disable and show loading state during mutations
- [ ] All validation commands pass

---

### Step 5: Create Pipeline View Container Component

- **What**: Create a `PipelineView` component that orchestrates the rendering of all step nodes in a vertical or horizontal pipeline layout with connecting visual elements.
- **Why**: This component composes `PipelineStepNode` components for each step, manages the overall pipeline layout, and handles the visual flow representation.
- **Confidence**: High

**Files to Create:**

- `app/(app)/workflows/[id]/_components/pipeline-view.tsx` - Pipeline view container component

**Changes:**

- Create component accepting array of `WorkflowStep` items and loading state
- Sort steps by `stepNumber` before rendering
- Render `PipelineStepNode` for each step in order
- Add connecting lines/borders between nodes (using CSS borders or SVG connectors)
- Implement vertical layout (default) with option for horizontal on wider screens
- Highlight current active step (status === 'running') with visual emphasis
- Add empty state if no steps exist yet
- Include loading skeleton that matches the step node structure

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Pipeline displays steps in correct order by stepNumber
- [ ] Visual connectors appear between step nodes
- [ ] Current running step has visual emphasis
- [ ] Empty state displays when no steps exist
- [ ] Loading skeleton renders during data fetch
- [ ] All validation commands pass

---

### Step 6: Create Loading Skeleton and Not Found Components

- **What**: Create `WorkflowDetailSkeleton` and `WorkflowNotFound` components for loading and error states respectively.
- **Why**: Following the pattern from `app/(app)/projects/[id]/page.tsx`, dedicated skeleton and not-found components provide consistent UX during loading and when a workflow doesn't exist.
- **Confidence**: High

**Files to Create:**

- `app/(app)/workflows/[id]/_components/workflow-detail-skeleton.tsx` - Loading skeleton
- `app/(app)/workflows/[id]/_components/workflow-not-found.tsx` - Not found state

**Changes:**

- Create skeleton mimicking the page layout: breadcrumb, header with title/badges, control bar, pipeline steps
- Use animate-pulse class on bg-muted placeholder elements
- Create not-found component with EmptyState pattern, icon (Workflow from lucide), message, and back navigation link
- Include breadcrumb showing "Workflows > Not Found"

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Skeleton structure matches actual page layout
- [ ] Skeleton elements have animate-pulse animation
- [ ] Not found state displays appropriate message and back link
- [ ] Both components follow existing patterns from projects/[id]/page.tsx
- [ ] All validation commands pass

---

### Step 7: Create Component Index File

- **What**: Create an index.ts barrel export file for the \_components directory to simplify imports in the main page file.
- **Why**: Following project conventions, barrel exports keep import statements clean and make refactoring easier.
- **Confidence**: High

**Files to Create:**

- `app/(app)/workflows/[id]/_components/index.ts` - Barrel export file

**Changes:**

- Export `StepStatusBadge` and `getStepStatusVariant` from step-status-badge.tsx
- Export `PipelineStepNode` from pipeline-step-node.tsx
- Export `StepDetailPanel` from step-detail-panel.tsx
- Export `WorkflowControlBar` from workflow-control-bar.tsx
- Export `PipelineView` from pipeline-view.tsx
- Export `WorkflowDetailSkeleton` from workflow-detail-skeleton.tsx
- Export `WorkflowNotFound` from workflow-not-found.tsx

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] All components are exported from index.ts
- [ ] Imports work correctly using `@/app/(app)/workflows/[id]/_components` path
- [ ] All validation commands pass

---

### Step 8: Implement Main Workflow Detail Page

- **What**: Rewrite the `app/(app)/workflows/[id]/page.tsx` to compose all created components, fetch workflow and steps data, handle states, and wire up mutations.
- **Why**: This is the final assembly step that brings together all components into a functional page with proper data fetching, error handling, and user interactions.
- **Confidence**: High

**Files to Modify:**

- `app/(app)/workflows/[id]/page.tsx` - Complete rewrite of page component
- `app/(app)/workflows/[id]/route-type.ts` - Verify/update route params (ID validation)

**Changes:**

- Add "use client" directive for client-side rendering with hooks
- Import `useRouteParams` from next-typesafe-url/app and use with Route.routeParams
- Import `useWorkflow`, `usePauseWorkflow`, `useResumeWorkflow`, `useCancelWorkflow` from use-workflows hook
- Import `useStepsByWorkflow` from use-steps hook
- Import `useProject` from use-projects hook to display project name in header/breadcrumb
  - Note: Fetch project conditionally using `useProject(workflow?.projectId ?? 0)` with `enabled: !!workflow?.projectId`
  - This requires workflow data to load first before fetching project details
- Implement route param validation with redirect to /workflows on invalid ID
- Render `WorkflowDetailSkeleton` during loading states
- Render `WorkflowNotFound` when workflow is not found
- Implement breadcrumb navigation: Workflows > [Feature Name]
- Display page header with workflow feature name, status badge, type badge, and progress indicator
- Render `WorkflowControlBar` in header area with mutation handlers
- Render `PipelineView` with steps data in main content area
- Wrap content areas in `QueryErrorBoundary` for error handling
- Display workflow metadata: created date, started date, duration, pause behavior setting

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Page loads workflow and steps data on mount
- [ ] Loading skeleton displays during data fetch
- [ ] Not found state displays for invalid workflow IDs
- [ ] Breadcrumb navigates back to workflows list
- [ ] Workflow status and type badges display correctly
- [ ] Control bar buttons trigger correct mutations
- [ ] Pipeline view shows all steps with correct statuses
- [ ] Step nodes expand to show detail panels
- [ ] QueryErrorBoundary catches and displays errors
- [ ] All validation commands pass

---

## Quality Gates

- **Gate 1 (after Step 2)**: Verify `PipelineStepNode` renders correctly in isolation with mock data - component should display all step statuses with correct visual treatments
- **Gate 2 (after Step 5)**: Verify `PipelineView` renders a complete pipeline with multiple mock steps - visual connectors should appear between nodes
- **Gate 3 (after Step 8)**: Full integration test - navigate to `/workflows/[id]` with a valid workflow ID and verify:
  - Data loads and displays correctly
  - Steps appear in pipeline view
  - Control buttons function (test with workflow in different statuses)
  - Step expansion shows input/output data

## Notes

- **Route Type Consideration**: The current route-type.ts uses `z.string()` for the ID param. If numeric validation is needed, update to `z.coerce.number().positive()` and adjust the useRouteParams usage accordingly. However, keeping it as string and parsing to number in the page may be simpler given the existing pattern in projects/[id]/page.tsx.

- **Polling for Real-Time Updates**: This implementation plan does not include real-time polling for step status updates. A future enhancement could add `refetchInterval` to the `useStepsByWorkflow` and `useWorkflow` queries when the workflow is in `running` status.

- **Step Output Formatting**: The `outputText` and `inputText` fields may contain structured content (JSON, code, etc.). Future enhancement could add syntax highlighting using the existing `shiki` dependency, but this is out of scope for the initial implementation.

- **Cache Invalidation**: The existing mutation hooks in `use-workflows.ts` and `use-steps.ts` already handle cache invalidation correctly. No additional cache management is needed.

- **Accessibility**: Ensure all interactive elements have appropriate ARIA labels, especially for the collapsible step nodes and control buttons. Follow patterns established in existing components.

---

## Verification Notes (2026-01-29)

Plan verified against current codebase state:

- ✅ All critical files confirmed to exist in expected locations
- ✅ Query hooks verified: `useWorkflow`, `usePauseWorkflow`, `useResumeWorkflow`, `useCancelWorkflow`, `useStepsByWorkflow` all exist and functional
- ✅ Query key factories (`stepKeys`, `workflowKeys`) verified
- ✅ `components/ui/collapsible.tsx` confirmed available
- ✅ `projects/[id]/page.tsx` pattern confirmed as valid reference (uses useRouteParams, skeleton, not-found)
- ✅ `workflows/page.tsx` and `workflow-card.tsx` added as additional reference files
- 🔄 Step 1 updated: Changed from adding new badge variants to using mapping pattern (follows existing `workflow-card.tsx` convention)
- 🔄 Step 8 updated: Clarified `useProject` usage with conditional fetching based on workflow.projectId

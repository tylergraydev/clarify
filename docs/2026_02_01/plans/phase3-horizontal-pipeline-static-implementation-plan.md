# Phase 3: Horizontal Pipeline - Static Display

## Implementation Plan

Generated: 2026-02-01
Original Request: Phase 3 of the workflow-implementation-phases.md
Refined Request: Implement the `PipelineView` component as a horizontal workflow step visualization system for the workflow detail page.

---

## Overview

**Feature**: PipelineView - Horizontal Workflow Step Visualization
**Estimated Duration**: 4-6 hours
**Complexity**: Medium
**Risk Level**: Low

## Quick Summary

Implement a horizontal pipeline visualization for the workflow detail page that displays four orchestration steps (Clarify, Refine, Discover, Plan) with visual state management. The component hierarchy includes `PipelineView` as the container, with `PipelineStep` and `PipelineConnector` subcomponents. Steps support expand/collapse interactivity with three visual states (pending, running, completed) and integrate with TanStack Query for data fetching and Zustand for UI state persistence.

## Prerequisites

- [ ] Existing `useStepsByWorkflow` hook is available in `hooks/queries/use-steps.ts`
- [ ] Step types and statuses defined in `db/schema/workflow-steps.schema.ts`
- [ ] Badge component with status variants exists in `components/ui/badge.tsx`
- [ ] Collapsible component pattern available in `components/ui/collapsible.tsx`
- [ ] Card component for containers in `components/ui/card.tsx`

## File Discovery Results

### Critical Priority
- `components/workflows/pipeline-view.tsx` - Create main component
- `components/workflows/index.ts` - Add exports
- `app/(app)/workflows/[id]/page.tsx` - Integrate PipelineView

### High Priority
- `lib/stores/pipeline-store.ts` - Create Zustand store for expand state
- `components/workflows/workflow-detail-skeleton.tsx` - Add pipeline skeleton

### Reference Files
- `hooks/queries/use-steps.ts` - useStepsByWorkflow hook
- `db/schema/workflow-steps.schema.ts` - Step types and statuses
- `components/ui/badge.tsx` - Status badge component
- `components/ui/collapsible.tsx` - Expand/collapse pattern
- `components/ui/card.tsx` - Container styling

---

## Implementation Steps

### Step 1: Create Pipeline Zustand Store

**What**: Create a Zustand store to manage pipeline UI state including which step is expanded and animation states.
**Why**: Persists expand/collapse state across re-renders and provides centralized state management for the pipeline UI, separate from server state.
**Confidence**: High

**Files**:
- `lib/stores/pipeline-store.ts` - Create

**Changes**:
1. Define `PipelineState` interface with `expandedStepId` (number | null) and step type union
2. Define `PipelineActions` interface with `setExpandedStep`, `toggleStep`, and `collapseAll` actions
3. Create `usePipelineStore` hook using Zustand `create` function following the shell-store pattern
4. Export combined `PipelineStore` type

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Store file created with proper TypeScript types
- [ ] Actions correctly update state
- [ ] All validation commands pass

---

### Step 2: Create PipelineStep Subcomponent

**What**: Create the individual step component that renders a single pipeline step with expand/collapse behavior and state-based styling.
**Why**: Encapsulates step rendering logic including icon, title, status badge, and output placeholder with CVA variants for visual states.
**Confidence**: High

**Files**:
- `components/workflows/pipeline-step.tsx` - Create

**Changes**:
1. Add `'use client'` directive and import type `ComponentPropsWithRef` from React
2. Import lucide-react icons: `CircleCheck`, `CircleDashed`, `Loader2`, `MessageSquare`, `Search`, `FileText`, `Lightbulb`
3. Create `pipelineStepVariants` CVA with state variants: `pending`, `running`, `completed`
4. Define `PipelineStepProps` interface extending CVA VariantProps with: `stepType`, `status`, `title`, `isExpanded`, `onToggle`, `output`
5. Map step types to icons: clarification -> MessageSquare, refinement -> Lightbulb, discovery -> Search, planning -> FileText
6. Render collapsed state: icon, title, status indicator (checkmark for completed, spinner for running, dashed circle for pending)
7. Render expanded state: full title, Badge with status, output placeholder container with "Output will appear here" or actual output
8. Add click handler to trigger `onToggle`
9. Include proper ARIA attributes: `aria-expanded`, `aria-label`, `role="button"`, `tabIndex={0}`

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Component renders with correct icon per step type
- [ ] Three visual states render distinctly (pending dimmed, running with spinner, completed with checkmark)
- [ ] Expanded/collapsed states toggle correctly
- [ ] All validation commands pass

---

### Step 3: Create PipelineConnector Subcomponent

**What**: Create the visual connector component that renders lines between sequential pipeline steps.
**Why**: Reinforces the pipeline flow visually and provides visual feedback for step progression.
**Confidence**: High

**Files**:
- `components/workflows/pipeline-connector.tsx` - Create

**Changes**:
1. Add `'use client'` directive and import type `ComponentPropsWithRef` from React
2. Create `pipelineConnectorVariants` CVA with state variants: `pending` (dimmed), `completed` (solid accent color)
3. Define `PipelineConnectorProps` interface with `isCompleted` boolean prop
4. Render a horizontal line element (div with appropriate height/width and border or background)
5. Apply conditional styling based on `isCompleted` state
6. Include `aria-hidden="true"` since connector is decorative

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Connector renders as a horizontal line between steps
- [ ] Visual distinction between completed and pending states
- [ ] All validation commands pass

---

### Step 4: Create Main PipelineView Component

**What**: Create the container component that orchestrates step layout, state management, and data fetching.
**Why**: Acts as the primary interface for the pipeline visualization, managing the four hardcoded steps and their interactions.
**Confidence**: High

**Files**:
- `components/workflows/pipeline-view.tsx` - Create

**Changes**:
1. Add `'use client'` directive and necessary imports
2. Import `PipelineStep` and `PipelineConnector` subcomponents
3. Import `usePipelineStore` for expand state management
4. Import `useStepsByWorkflow` query hook for fetching step data
5. Define `ORCHESTRATION_STEPS` constant array with four step configs: clarification, refinement, discovery, planning
6. Define `PipelineViewProps` interface with `workflowId: number`
7. Implement step state derivation: map fetched steps to their statuses, determine current running step
8. Create `deriveStepState` helper function that maps step status to visual state (pending, running, completed)
9. Render horizontal flex container with gap spacing
10. Map through `ORCHESTRATION_STEPS` to render `PipelineStep` components with connectors between them
11. Pass toggle handler from Zustand store to each step
12. Add responsive behavior: `overflow-x-auto` for horizontal scrolling on narrow screens
13. Include `aria-label="Workflow pipeline"` on container and `role="list"` with `role="listitem"` on steps

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Component fetches workflow steps via TanStack Query
- [ ] Four hardcoded steps render with correct icons and titles
- [ ] Step states derive correctly from fetched data
- [ ] Expand/collapse interactivity works
- [ ] Connectors render between steps
- [ ] All validation commands pass

---

### Step 5: Update Workflow Components Index

**What**: Export the new PipelineView component from the workflows components barrel file.
**Why**: Maintains consistent import patterns across the codebase and makes the component discoverable.
**Confidence**: High

**Files**:
- `components/workflows/index.ts` - Modify

**Changes**:
1. Add export statement for `PipelineView` from `./pipeline-view`
2. Add export statements for `PipelineStep` and `PipelineConnector` if they should be publicly accessible
3. Maintain alphabetical ordering of exports within categories

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] PipelineView can be imported from `@/components/workflows`
- [ ] All validation commands pass

---

### Step 6: Update WorkflowDetailSkeleton with Pipeline Skeleton

**What**: Add a skeleton representation of the pipeline to the loading state.
**Why**: Provides visual continuity during loading and prevents layout shift when the actual pipeline renders.
**Confidence**: High

**Files**:
- `components/workflows/workflow-detail-skeleton.tsx` - Modify

**Changes**:
1. Add new pipeline skeleton section between action bar and content area placeholder
2. Render four skeleton step boxes with connecting line skeletons
3. Use consistent skeleton styling (`animate-pulse bg-muted rounded-md`)
4. Match approximate dimensions of actual pipeline steps

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Skeleton includes pipeline representation
- [ ] Visual layout matches actual pipeline dimensions
- [ ] All validation commands pass

---

### Step 7: Integrate PipelineView into Workflow Detail Page

**What**: Add the PipelineView component to the workflow detail page, positioned after the header section.
**Why**: Displays the pipeline visualization to users viewing a specific workflow.
**Confidence**: High

**Files**:
- `app/(app)/workflows/[id]/page.tsx` - Modify

**Changes**:
1. Import `PipelineView` from `@/components/workflows`
2. Add `PipelineView` component after the action bar section, before the content area
3. Pass `workflowId` prop from the validated route params
4. Wrap in a section element with appropriate `aria-label="Workflow pipeline"`
5. Add appropriate spacing using existing `space-y-6` pattern

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] PipelineView renders on workflow detail page
- [ ] Pipeline receives correct workflow ID
- [ ] Pipeline displays step data from TanStack Query
- [ ] All validation commands pass

---

### Step 8: Verify Visual Rendering with Mock Data

**What**: Test the pipeline rendering with various workflow states to ensure all visual states display correctly.
**Why**: Validates that pending, running, and completed states render with correct styling before production use.
**Confidence**: Medium

**Files**:
- No file changes - manual verification step

**Changes**:
1. Navigate to an existing workflow detail page in the application
2. Verify pipeline renders four steps with correct icons
3. Verify pending steps display dimmed/grayed styling
4. Verify running steps display expanded with status badge and spinner
5. Verify completed steps display collapsed with checkmark indicator
6. Verify click interaction expands/collapses steps
7. Verify connectors display between steps
8. Verify responsive behavior on narrow viewport (horizontal scrolling)

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] All four step types render with correct icons
- [ ] Visual states match specification (pending dimmed, running expanded, completed collapsed with checkmark)
- [ ] Expand/collapse interaction works smoothly
- [ ] Responsive scrolling works on narrow viewports
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm typecheck`
- [ ] All files pass `pnpm lint`
- [ ] Pipeline renders with mock workflow data
- [ ] Expand/collapse interactivity functions correctly
- [ ] Accessibility attributes present (aria-expanded, aria-label, role)
- [ ] Visual states match specification for pending, running, completed

## Notes

- **Step type mapping**: The four orchestration steps (clarification, refinement, discovery, planning) are hardcoded in the component. Additional step types (routing, implementation, quality_gate, gemini_review) from the schema are not included in this initial implementation.
- **Status derivation**: Step statuses from the database (pending, running, paused, editing, completed, failed, skipped) should be mapped to three visual states: pending (pending), running (running, paused, editing), completed (completed, failed, skipped).
- **No Base UI primitive**: Since there is no Base UI primitive for a pipeline/stepper component, this implementation uses semantic HTML elements (div, button) with proper ARIA attributes for accessibility.
- **Animation transitions**: The expand/collapse behavior should use CSS transitions for smooth animation. Consider using the collapsible component pattern from `components/ui/collapsible.tsx` as reference.
- **Future enhancement**: Step output content will display "Output will appear here" placeholder initially. Integration with actual step output data will be implemented in subsequent phases.

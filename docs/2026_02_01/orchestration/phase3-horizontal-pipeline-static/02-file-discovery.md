# Step 2: AI-Powered File Discovery

## Step Metadata

| Field | Value |
|-------|-------|
| Status | Completed |
| Started | 2026-02-01T00:02:00Z |
| Completed | 2026-02-01T00:03:00Z |
| Duration | ~60 seconds |

## Refined Request Used

Implement the `PipelineView` component as a horizontal workflow step visualization system for the workflow detail page, where the pipeline renders four hardcoded orchestration steps (Clarify, Refine, Discover, Plan) with visual state management based on workflow execution data. The `PipelineView` should act as a container component that manages step state and layout, while individual `PipelineStep` components display each step with context-aware styling using Base UI primitives and CVA variants. Each step should support three visual states: pending (dimmed/grayed styling to indicate not yet started), completed (collapsed display showing only icon and title with a checkmark indicator), and running (expanded display showing the step title, current execution status, and placeholder text "Output will appear here"). Collapsed steps display an icon from lucide-react, the step title, and a "No data yet" placeholder, while expanded steps show the full title, execution status badge, and an output placeholder container. Implement connecting lines (visual separators or SVG paths) between sequential steps to reinforce the pipeline flow.

## File Discovery Results

### Critical Priority (Must modify/create)

| File | Reason | Action |
|------|--------|--------|
| `components/workflows/pipeline-view.tsx` | Main container component for the horizontal pipeline visualization - does not exist yet, must be created | Create |
| `components/workflows/index.ts` | Barrel export file that needs to export the new PipelineView component | Modify |
| `app/(app)/workflows/[id]/page.tsx` | Workflow detail page that will integrate the PipelineView component after the header section | Modify |

### High Priority (Likely modify)

| File | Reason | Action |
|------|--------|--------|
| `lib/stores/pipeline-store.ts` | New Zustand store for tracking expanded step state - does not exist yet, may be needed for expand/collapse state management | Create |
| `components/workflows/workflow-detail-skeleton.tsx` | May need to add skeleton states for the pipeline section | Modify |
| `lib/layout/constants.ts` | May need to add pipeline-related storage keys if persisting expanded step state | Reference/Modify |

### Medium Priority (Reference patterns)

| File | Reason | Action |
|------|--------|--------|
| `hooks/queries/use-steps.ts` | Query hooks for fetching workflow steps (`useStepsByWorkflow`) - will be used to get step data | Reference |
| `hooks/queries/use-workflows.ts` | Query hooks for workflow data including `useWorkflow` for getting current workflow state | Reference |
| `db/schema/workflow-steps.schema.ts` | Schema defining step statuses (`pending`, `running`, `completed`, etc.) and step types (`clarification`, `refinement`, `discovery`, `planning`) | Reference |
| `db/schema/workflows.schema.ts` | Schema defining workflow statuses and the `currentStepNumber` field | Reference |
| `components/ui/badge.tsx` | Badge component with CVA variants for status display - already has `pending`, `completed`, `planning` variants | Reference |
| `components/ui/card.tsx` | Card component for step containers | Reference |
| `components/ui/collapsible.tsx` | Base UI Collapsible component with CVA variants - pattern for expand/collapse functionality | Reference |
| `lib/utils.ts` | `cn()` utility for class merging | Reference |
| `components/ui/tooltip.tsx` | Tooltip component for step hover states | Reference |
| `components/ui/icon-button.tsx` | Icon button component pattern for step click interactions | Reference |
| `lib/stores/shell-store.ts` | Reference pattern for Zustand store implementation | Reference |
| `lib/stores/agent-layout-store.ts` | Reference pattern for Zustand store with electron-store persistence | Reference |

### Low Priority (Context only)

| File | Reason | Action |
|------|--------|--------|
| `types/electron.d.ts` | Type definitions for `WorkflowStep` and `Workflow` types | Reference |
| `types/component-types.ts` | Global type definitions (`Children`, `ClassName`) | Reference |
| `lib/queries/steps.ts` | Query key factory for steps | Reference |
| `lib/queries/workflows.ts` | Query key factory for workflows | Reference |
| `components/ui/button.tsx` | Button component CVA pattern reference | Reference |
| `components/ui/empty-state.tsx` | Empty state component pattern for "No data yet" placeholder | Reference |
| `components/ui/separator.tsx` | Separator component - could be used for connecting lines between steps | Reference |
| `hooks/use-electron.ts` | Hook providing access to ElectronAPI including steps operations | Reference |
| `app/(app)/workflows/[id]/route-type.ts` | Type-safe route params for workflow ID | Reference |
| `.claude/skills/component-conventions/references/Component-Conventions.md` | Component conventions documentation for Base UI + CVA patterns | Reference |

## Architecture Insights

### Key Patterns Discovered

1. **Component Structure**: Components use Base UI primitives wrapped with CVA for variants, following the pattern in `component-conventions.md`

2. **State Management**: UI state (like expanded/collapsed) is typically managed via:
   - Local React state for simple cases
   - Zustand stores for persistence (see `shell-store.ts`, `agent-layout-store.ts`)
   - TanStack Query for server state

3. **Step Data Model**: The `workflow_steps` table has:
   - `stepType`: `clarification`, `refinement`, `discovery`, `planning`, etc.
   - `status`: `pending`, `running`, `paused`, `editing`, `completed`, `failed`, `skipped`
   - `stepNumber`: Integer for ordering

4. **Query Hooks Pattern**: The `useStepsByWorkflow(workflowId)` hook fetches all steps for a workflow

5. **Styling Tokens**: Uses CSS variable tokens like `bg-muted`, `text-muted-foreground`, `border-border`

### Existing Similar Functionality

- Collapsible component provides expand/collapse pattern with smooth transitions
- Badge component already has status-specific variants (`pending`, `completed`, `failed`)
- Card component provides container styling for step cards

### Integration Points

1. **Workflow Detail Page**: The `PipelineView` should be added after the header section in `page.tsx`
2. **Step Data Query**: Use `useStepsByWorkflow(workflowId)` to fetch step data
3. **Status Mapping**: Map step `status` to visual states (pending -> dimmed, completed -> collapsed, running -> expanded)

## Summary

| Metric | Value |
|--------|-------|
| Total files discovered | 27 |
| Files to create | 2 (`pipeline-view.tsx`, optionally `pipeline-store.ts`) |
| Files to modify | 3 (`page.tsx`, `index.ts`, possibly `workflow-detail-skeleton.tsx`) |
| Reference files | 22 |

# Workflow Detail Page UI Shell - Implementation Plan

Generated: 2026-02-05
Original Request: Implement the workflow page layout and shell at `/workflows/[id]` with placeholder functions and data only - no real functionality.
Refined Request: Implement the complete UI shell and layout for the workflow detail page at `/workflows/[id]`, building out all visual structure, component hierarchy, and placeholder interactions without wiring up any real data fetching, IPC calls, AI agent streaming, or database operations. Three main zones: sticky top bar, scrollable accordion steps, collapsible bottom streaming panel. Pre-start settings form, step-specific content layouts, nuqs URL state, Zustand store for UI state.

## Analysis Summary

- Feature request refined with project context
- Discovered 40+ files across 18 directories (10 to create, 4 to modify, 26+ reference)
- Generated 15-step implementation plan

## File Discovery Results

### Files to Create (Critical)

| File | Purpose |
|------|---------|
| `lib/stores/workflow-detail-store.ts` | Zustand store for workflow detail UI state |
| `components/workflows/detail/workflow-top-bar.tsx` | Sticky top bar with workflow info and actions |
| `components/workflows/detail/workflow-step-accordion.tsx` | Main accordion with 4 workflow steps |
| `components/workflows/detail/workflow-streaming-panel.tsx` | Collapsible bottom streaming panel with tabs |
| `components/workflows/detail/workflow-pre-start-form.tsx` | Pre-start settings form |
| `components/workflows/detail/steps/clarification-step-content.tsx` | Clarification step expanded content |
| `components/workflows/detail/steps/refinement-step-content.tsx` | Refinement step expanded content |
| `components/workflows/detail/steps/file-discovery-step-content.tsx` | File Discovery step expanded content |
| `components/workflows/detail/steps/implementation-planning-step-content.tsx` | Implementation Planning step expanded content |
| `components/workflows/detail/index.ts` | Barrel exports |

### Files to Modify (High)

| File | Changes |
|------|---------|
| `app/(app)/workflows/[id]/page.tsx` | Replace placeholder with full three-zone layout |
| `app/(app)/workflows/[id]/route-type.ts` | Add searchParams with step enum |
| `components/workflows/index.ts` | Add barrel exports for detail/ |
| `lib/layout/constants.ts` | Add storage keys and defaults |

## Implementation Plan

### Overview

**Estimated Duration**: 3-4 days
**Complexity**: High
**Risk Level**: Medium

### Quick Summary

Build the complete visual shell and component hierarchy for the workflow detail page at `/workflows/[id]`, implementing three main zones (sticky top bar, scrollable accordion steps, collapsible streaming panel) with a pre-start settings form. All components use hardcoded/mock data with no-op action handlers, following existing project patterns for CVA, Base UI primitives, Zustand state management, nuqs URL state, and TanStack Form. This is a UI-only implementation with no IPC, data fetching, or AI streaming wiring.

### Prerequisites

- [ ] Verify all referenced UI primitives exist and export correctly (`AccordionRoot`, `TabsRoot`, `Badge`, `Card`, `Button`, `Collapsible`, `Separator`, `Tooltip`, `IconButton`, `EmptyState`)
- [ ] Confirm `nuqs` `NuqsAdapter` is present in root layout
- [ ] Confirm `useAppForm` hook and field components are available in `lib/forms/form-hook.ts`

### Step 1: Add Layout Constants for Workflow Detail Store

**What**: Add storage keys and default values for the workflow detail Zustand store to the shared layout constants file.
**Why**: The store pattern requires constants defined in `lib/layout/constants.ts` to avoid circular dependencies, matching the pattern established by `active-workflows-store.ts`.
**Confidence**: High

**Files to Modify:**
- `lib/layout/constants.ts` - Add workflow detail storage keys and defaults

**Changes:**
- Add `WORKFLOW_DETAIL_STREAMING_PANEL_HEIGHT_STORAGE_KEY` constant (`'app:workflow-detail-streaming-panel-height'`)
- Add `WORKFLOW_DETAIL_STREAMING_PANEL_COLLAPSED_STORAGE_KEY` constant (`'app:workflow-detail-streaming-panel-collapsed'`)
- Add `WORKFLOW_DETAIL_ACTIVE_STREAMING_TAB_STORAGE_KEY` constant (`'app:workflow-detail-active-streaming-tab'`)
- Add `WORKFLOW_DETAIL_EXPANDED_STEPS_STORAGE_KEY` constant (`'app:workflow-detail-expanded-steps'`)
- Add `DEFAULT_WORKFLOW_DETAIL_STREAMING_PANEL_HEIGHT` constant (250)
- Add `DEFAULT_WORKFLOW_DETAIL_STREAMING_PANEL_COLLAPSED` constant (false)
- Add `DEFAULT_WORKFLOW_DETAIL_ACTIVE_STREAMING_TAB` constant (`'clarification'` as const)
- Add `DEFAULT_WORKFLOW_DETAIL_EXPANDED_STEPS` constant (empty array of strings)

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] All new constants are exported and follow the naming convention of existing constants
- [ ] No import/export conflicts with existing constants
- [ ] All validation commands pass

---

### Step 2: Create Zustand Store for Workflow Detail UI State

**What**: Create a Zustand store managing workflow detail page ephemeral UI state including streaming panel dimensions, expanded accordion steps, and active streaming tab.
**Why**: Following the project pattern where each page/feature has a dedicated Zustand store for client-side UI preferences persisted via `persistToElectronStore`. This isolates workflow detail state from other stores.
**Confidence**: High

**Files to Create:**
- `lib/stores/workflow-detail-store.ts` - Zustand store with State/Actions/Store interfaces

**Changes:**
- Define `WorkflowDetailState` interface with: `streamingPanelHeight` (number), `isStreamingPanelCollapsed` (boolean), `activeStreamingTab` (step type literal union), `expandedSteps` (array of string step identifiers)
- Define `WorkflowDetailActions` interface with setter functions for each state property plus `toggleStep`, `toggleStreamingPanel`, and `reset`
- Define `WorkflowDetailStore` as combined type of State and Actions
- Define step tab type as `'clarification' | 'refinement' | 'discovery' | 'planning'`
- Create `initialState` object referencing constants from `lib/layout/constants.ts`
- Implement `persistToElectronStore` helper matching the pattern in `active-workflows-store.ts`
- Export `useWorkflowDetailStore` using `create<WorkflowDetailStore>()`

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Store follows the exact pattern from `lib/stores/active-workflows-store.ts`
- [ ] All actions properly persist to electron store using the storage key constants
- [ ] `reset` action restores initial state and persists all default values
- [ ] All validation commands pass

---

### Step 3: Update Route Type with Search Params for Step Selection

**What**: Add a `searchParams` schema to the workflow detail route type to support the `?step=` query parameter.
**Why**: The route-type needs to declare searchParams with a Zod schema so the page can use nuqs `parseAsStringLiteral` for type-safe URL state management.
**Confidence**: High

**Files to Modify:**
- `app/(app)/workflows/[id]/route-type.ts` - Add searchParams with step enum and export step values constant

**Changes:**
- Add `workflowStepValues` constant array: `['clarification', 'refinement', 'discovery', 'planning'] as const`
- Add `searchParams` property to `Route` object with `z.object({ step: z.enum(workflowStepValues).optional() })`
- Export `WorkflowStepValue` type derived from `workflowStepValues`

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Route type satisfies `DynamicRoute` with both `routeParams` and `searchParams`
- [ ] `WorkflowStepValue` type is exported for use in page and components
- [ ] All validation commands pass

---

### Step 4: Create the Workflow Top Bar Component

**What**: Build a sticky header bar displaying workflow name, status badge, elapsed time, action buttons (Pause, Cancel, Restart), and advance mode indicator using hardcoded values and no-op handlers.
**Why**: The top bar is the primary navigation/status zone, providing at-a-glance workflow state and actions. It must be sticky to remain visible while scrolling.
**Confidence**: High

**Files to Create:**
- `components/workflows/detail/workflow-top-bar.tsx` - Sticky top bar component

**Changes:**
- `'use client'` directive
- Sticky header using `h-(--workflow-header-height)` CSS variable
- Hardcoded workflow name as `h1`, `Badge` with `variant={'planning'}` and "Running" text
- Hardcoded elapsed time string (e.g., "12m 34s")
- Hardcoded advance mode indicator text (e.g., "Auto Pause")
- Three `Button` components: Pause (outline), Cancel (destructive), Restart (secondary) - all no-op
- lucide-react icons for each button (Pause, XCircle/Ban, RotateCcw)
- `Tooltip` wrapping each action button
- `Separator` at bottom
- Flexbox layout: left side name + badges, right side action buttons

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Component renders with sticky positioning
- [ ] All three action buttons visible with no-op handlers
- [ ] Badge and status indicators use existing variant system
- [ ] All validation commands pass

---

### Step 5: Create the Pre-Start Settings Form Component

**What**: Build the settings form shell shown before a workflow starts, with form fields for workflow configuration and a Start Workflow button, all bound to local state with no submission logic.
**Why**: When a workflow is in "created" state, the page shows a configuration form instead of the step accordion.
**Confidence**: High

**Files to Create:**
- `components/workflows/detail/workflow-pre-start-form.tsx` - Pre-start settings form shell

**Changes:**
- `'use client'` directive
- `useAppForm` with simple default values (no Zod validation, just local state)
- `Card` as form container with `CardHeader` ("Workflow Settings") and `CardContent`
- `TextField` for feature name, `TextareaField` for feature request
- `SelectField` for pause behavior (options from `pauseBehaviors` constant)
- `SwitchField` for skip clarification toggle
- `SelectField` for clarification agent (stub options)
- `CardFooter` with `SubmitButton` "Start Workflow" - no-op onSubmit
- Single-column form within centered Card with max-width constraint

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Form renders all fields with correct field component types
- [ ] Start Workflow button visible and clickable (no-op)
- [ ] Form follows `useAppForm` + `form.AppField` pattern
- [ ] All validation commands pass

---

### Step 6: Create Clarification Step Content Component

**What**: Build expanded content for Clarification step with placeholder question form (radio groups, checkboxes, text inputs), Submit Answers button, and action bar.
**Why**: Each workflow step has unique expanded content. Clarification focuses on answering AI-generated questions.
**Confidence**: Medium

**Files to Create:**
- `components/workflows/detail/steps/clarification-step-content.tsx`

**Changes:**
- `'use client'` directive
- 2-3 hardcoded placeholder questions with different input types (text, radio, checkbox)
- "Submit Answers" Button (default variant, no-op)
- Action bar: "Re-run" (outline, RotateCcw), "Ask More" (outline, Plus), "Skip" (ghost, SkipForward), agent dropdown placeholder
- `Separator` between question form and action bar

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Renders 2-3 placeholder questions with different input types
- [ ] All buttons visible with no-op handlers
- [ ] All validation commands pass

---

### Step 7: Create Refinement Step Content Component

**What**: Build expanded content for Refinement step with read-only markdown block, Edit toggle, file picker placeholder, and action bar.
**Why**: Refinement displays AI-refined feature request as markdown with edit toggle capability.
**Confidence**: High

**Files to Create:**
- `components/workflows/detail/steps/refinement-step-content.tsx`

**Changes:**
- `'use client'` directive
- Local `useState` for `isEditing` toggle
- Read-only markdown block (div with prose text) / textarea when editing
- "Edit"/"Done" button toggling `isEditing`
- Placeholder file picker area with "Browse" button (no-op)
- Action bar: "Re-run" (outline), "Refine More" (outline), "Skip" (ghost), agent dropdown
- `Separator` between content sections

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Edit toggle switches between read-only and textarea
- [ ] File picker placeholder visible
- [ ] All buttons present with no-op handlers
- [ ] All validation commands pass

---

### Step 8: Create File Discovery Step Content Component

**What**: Build expanded content for File Discovery step with placeholder data table, Add File and View buttons, and action bar.
**Why**: File discovery presents discovered files in tabular format with action/priority badges.
**Confidence**: Medium

**Files to Create:**
- `components/workflows/detail/steps/file-discovery-step-content.tsx`

**Changes:**
- `'use client'` directive
- Static HTML table styled to match project data table aesthetic
- Header row: "File Path", "Action", "Priority", "Relevance"
- 4-5 hardcoded rows with Badge components for action and priority columns
- "View" IconButton (Eye icon, no-op) per row
- "Add File" Button above table (outline, Plus icon, no-op)
- Summary text below table
- Action bar: "Re-run" (outline), "Discover More" (outline), "Skip" (ghost), agent dropdown

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Table renders with correct columns and hardcoded rows
- [ ] Badge variants used for action and priority
- [ ] All buttons visible with no-op handlers
- [ ] All validation commands pass

---

### Step 9: Create Implementation Planning Step Content Component

**What**: Build expanded content for Implementation Planning step with split left/right layout - step list on left, detail panel on right.
**Why**: Most complex step content requiring two-panel layout for implementation plan steps.
**Confidence**: Medium

**Files to Create:**
- `components/workflows/detail/steps/implementation-planning-step-content.tsx`

**Changes:**
- `'use client'` directive
- Local `useState` for `selectedStepIndex` (defaults to 0)
- Hardcoded array of 4-5 mock implementation steps (title, description, files, validation commands, success criteria)
- Split layout (CSS grid or flexbox):
  - Left panel (~1/3): scrollable step list, each clickable with step number + title, selected step has accent styling
  - Right panel (~2/3): detail view with title, description, files (inline code), validation commands (code blocks), success criteria (checkbox-like list)
- Action bar: "Re-run" (outline), "Refine Plan" (outline), "Skip" (ghost), agent dropdown

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Split layout renders correctly
- [ ] Clicking step in left list updates right panel via local state
- [ ] Detail panel shows all sections
- [ ] All validation commands pass

---

### Step 10: Create the Workflow Step Accordion Component

**What**: Build main accordion with four steps using AccordionRoot/Item/Trigger/Panel, each with status badges and metric text, rendering step content components.
**Why**: Central interaction pattern organizing four pipeline steps into collapsible sections.
**Confidence**: High

**Files to Create:**
- `components/workflows/detail/workflow-step-accordion.tsx`

**Changes:**
- `'use client'` directive
- Import `useWorkflowDetailStore` for expanded steps state
- `AccordionRoot` with `value` bound to store's `expandedSteps`
- Four `AccordionItem` components with status variants:
  - Clarification: status="completed", "3 questions answered"
  - Refinement: status="running", "Refining feature request..."
  - File Discovery: status="pending", "Waiting..."
  - Implementation Planning: status="pending", "Waiting..."
- Each trigger: step name + Badge + metric text + lucide-react icon
- Each panel: renders corresponding step content component with `variant="padded"`

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Four accordion items in correct order with status variants
- [ ] Expanding reveals correct step content component
- [ ] Expanded state managed via Zustand store
- [ ] All validation commands pass

---

### Step 11: Create the Workflow Streaming Panel Component

**What**: Build collapsible bottom panel with drag handle for resizing and tabs per step with placeholder log content.
**Why**: Shows real-time AI agent output. Shell needs tab structure with placeholder content and resize/collapse interaction.
**Confidence**: Medium

**Files to Create:**
- `components/workflows/detail/workflow-streaming-panel.tsx`

**Changes:**
- `'use client'` directive
- Import store for `streamingPanelHeight`, `isStreamingPanelCollapsed`, `activeStreamingTab`
- Container with drag handle bar at top (narrow strip, cursor-row-resize, pointer event handlers for resize)
- Collapse/expand toggle IconButton
- When collapsed: only drag handle and toggle visible
- When expanded: `TabsRoot` with four tabs (Clarification, Refinement, File Discovery, Planning)
  - Each `TabsPanel`: scrollable div with `font-mono text-xs`, 5-10 lines hardcoded log text
- `style={{ height: streamingPanelHeight }}` on expanded container
- `Separator` at top boundary

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Panel renders with tabs for each step
- [ ] Collapse/expand toggle works
- [ ] Drag handle allows vertical resizing
- [ ] Each tab shows placeholder log content
- [ ] All validation commands pass

---

### Step 12: Create Barrel Export File for Detail Components

**What**: Create `index.ts` barrel export for workflow detail components.
**Why**: Project convention for cleaner imports.
**Confidence**: High

**Files to Create:**
- `components/workflows/detail/index.ts`

**Changes:**
- Export all detail components and step content components

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] All detail components re-exported
- [ ] Import paths resolve correctly
- [ ] All validation commands pass

---

### Step 13: Update Workflows Barrel Export

**What**: Add detail subdirectory exports to the workflows component barrel file.
**Why**: Maintain discoverability of all workflow components via single import path.
**Confidence**: High

**Files to Modify:**
- `components/workflows/index.ts` - Add detail component exports

**Changes:**
- Add re-export of all detail components from `./detail`

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Detail components accessible via `@/components/workflows` imports
- [ ] No naming conflicts
- [ ] All validation commands pass

---

### Step 14: Compose the Workflow Detail Page

**What**: Replace placeholder with full three-zone layout, integrating nuqs, route params, and conditional pre-start/active rendering.
**Why**: Final integration wiring all components into the page.
**Confidence**: High

**Files to Modify:**
- `app/(app)/workflows/[id]/page.tsx` - Full three-zone layout composition

**Changes:**
- Keep `useRouteParams(Route.routeParams)` and `QueryErrorBoundary`
- Add `useQueryState` from nuqs with `parseAsStringLiteral` for step param
- Add local `useState` for mock `workflowStatus` (default 'running')
- Import all detail components
- Conditional rendering:
  - Status 'created': render `WorkflowPreStartForm`
  - Otherwise: three-zone layout with `WorkflowTopBar` (sticky), scrollable `WorkflowStepAccordion`, `WorkflowStreamingPanel` (bottom)
- `flex flex-col h-full` on main container
- Remove `console.log(routeParams)` debug line

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Page renders pre-start form for 'created' status
- [ ] Page renders three-zone layout for 'running' status
- [ ] Top bar sticky, accordion scrolls, streaming panel at bottom
- [ ] `?step=` query param parsed via nuqs
- [ ] All validation commands pass

---

### Step 15: Add CSS Custom Properties for Workflow Detail Layout

**What**: Add CSS custom properties for streaming panel dimensions.
**Why**: Project uses CSS custom properties for layout consistency.
**Confidence**: High

**Files to Modify:**
- `app/globals.css` - Add workflow detail CSS custom properties

**Changes:**
- Add `--workflow-streaming-panel-min-height: 120px`
- Add `--workflow-streaming-panel-max-height: 500px`
- Add `--workflow-drag-handle-height: 8px`
- Add mobile breakpoint overrides

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] New CSS custom properties defined alongside existing ones
- [ ] No conflicts with existing properties
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm typecheck`
- [ ] All files pass `pnpm lint`
- [ ] Page renders pre-start form view at `/workflows/1` with mock 'created' status
- [ ] Page renders three-zone active workflow layout with mock 'running' status
- [ ] Top bar remains sticky when scrolling accordion area
- [ ] Accordion items expand/collapse with Base UI animations
- [ ] Streaming panel collapse/expand toggle works
- [ ] Streaming panel drag resize works within min/max bounds
- [ ] Tab switching in streaming panel updates content
- [ ] `?step=clarification` URL param parsed without errors
- [ ] All no-op buttons clickable without console errors
- [ ] Edit toggle in Refinement step switches modes
- [ ] Step selection in Implementation Planning updates detail panel
- [ ] No unused imports or variables flagged by linter

## Notes

- **No data fetching**: All content hardcoded/mock. No IPC or React Query. Future step adds real data.
- **No AI streaming**: Streaming panel shows static text. Agent SDK integration out of scope.
- **Form is visual only**: Pre-start form uses `useAppForm` for styling but no real validation/submission.
- **Drag resize simplified**: Pointer-event-based drag may need refinement for edge cases.
- **Desktop-first**: Electron app targets desktop viewport. Basic responsive overrides included.
- **Step content independent**: Steps 6-9 are self-contained, allowing parallel implementation.
- **Schema constant import safe**: `pauseBehaviors` from `db/schema/workflows.schema.ts` is a plain `as const` array with no Drizzle runtime dependency.

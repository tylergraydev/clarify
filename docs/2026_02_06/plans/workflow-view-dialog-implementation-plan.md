# Implementation Plan: View Workflow Info Dialog

## Overview

**Estimated Duration**: 3-4 hours
**Complexity**: Low-Medium
**Risk Level**: Low

## Quick Summary

This plan creates a new read-only `ViewWorkflowDialog` component that displays comprehensive workflow information in a Base UI Dialog, then replaces the "View" action in both `WorkflowTable` and `WorkflowHistoryTable` to open this dialog instead of navigating to the detail page. The row-click navigation behavior remains unchanged. Four consumer components (3 pages + 1 tab content) must wire in the new dialog state and rendering.

## Prerequisites

- [ ] Existing dialog primitives in `components/ui/dialog.tsx` are functional
- [ ] `useProject`, `useAgent`, and `useWorktree` query hooks are working as expected
- [ ] Utility functions `formatDate`, `formatDateTime`, `formatDuration`, `getWorkflowStatusVariant`, and `capitalizeFirstLetter` exist in `lib/utils.ts`

## Implementation Steps

### Step 1: Create the ViewWorkflowDialog Component

**What**: Create a new `ViewWorkflowDialog` component that displays all workflow fields in a read-only, sectioned layout inside a scrollable Base UI Dialog.
**Why**: This is the core new component that all four consumer locations will render. It must resolve foreign key IDs (projectId, clarificationAgentId, worktreeId) to human-readable names using existing query hooks, and display all workflow fields organized into logical groupings.
**Confidence**: High

**Files to Create:**

- `components/workflows/view-workflow-dialog.tsx` - Read-only dialog showing comprehensive workflow information

**Changes:**

- Create a `ViewWorkflowDialogProps` interface with: `workflow: Workflow | null`, `isOpen: boolean`, `onOpenChange: (isOpen: boolean) => void`
- Use the controlled dialog pattern (`DialogRoot` with `open`/`onOpenChange`) following the pattern in `components/workflows/edit-workflow-dialog.tsx`
- Compose with `DialogPortal > DialogBackdrop + DialogPopup` using `scrollable={true}` and `size={'xl'}` since there is substantial content
- Add a `DialogHeader` with `DialogTitle` ("Workflow Details") and `DialogDescription` (the feature name)
- Add a `DialogBody` containing logically grouped sections:
  - **Core Information section**: Feature Name (as static text), Feature Request (potentially multi-line, use `whitespace-pre-wrap`), Workflow Type (Badge), Status (Badge with `getWorkflowStatusVariant`)
  - **Configuration section**: Pause Behavior (formatted label), Skip Clarification (Yes/No), Clarification Agent (resolved name via `useAgent` hook, show "None" if null)
  - **Related Entities section**: Project Name (resolved via `useProject`), Worktree Path (resolved via `useWorktree`, show "None" if null)
  - **Progress & Timing section**: Current Step / Total Steps, Started At (`formatDateTime`), Completed At (`formatDateTime`), Duration (`formatDuration`)
  - **Error section** (conditional, only when `errorMessage` is not null): Error Message displayed with destructive/red styling
  - **Metadata section**: Created At (`formatDateTime`), Updated At (`formatDateTime`), Workflow ID
- Add a `DialogFooter` with a single "Close" button using `DialogClose`
- Use a consistent layout for each field: label on the left in muted text, value on the right. Use a definition-list style layout (grid with label/value pairs)
- Handle loading states for resolved entities (show a subtle loading indicator or "Loading..." text while query hooks are fetching)
- Guard rendering: if `workflow` is null, return null (do not render the dialog internals)
- Add `'use client'` directive at the top

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Component file created at the specified path with `'use client'` directive
- [ ] Uses controlled dialog pattern matching `EditWorkflowDialog` structure
- [ ] All workflow schema fields are displayed (featureName, featureRequest, type, status, pauseBehavior, skipClarification, clarificationAgentId, currentStepNumber, totalSteps, startedAt, completedAt, durationMs, errorMessage, projectId, worktreeId, createdAt, updatedAt)
- [ ] Foreign keys resolved to human-readable names via `useProject`, `useAgent`, `useWorktree` hooks
- [ ] Dates formatted via `formatDateTime`, duration via `formatDuration`, status via Badge with `getWorkflowStatusVariant`
- [ ] Error section conditionally rendered only when `errorMessage` is present
- [ ] All validation commands pass

---

### Step 2: Export the ViewWorkflowDialog from the Barrel File

**What**: Add the new `ViewWorkflowDialog` export to the workflows barrel file.
**Why**: Maintains the established barrel export pattern so consumers can import the dialog from the barrel index.
**Confidence**: High

**Files to Modify:**

- `components/workflows/index.ts` - Add export for `ViewWorkflowDialog`

**Changes:**

- Add `export { ViewWorkflowDialog } from './view-workflow-dialog';` in the Dialog components section, alongside the existing `CreateWorkflowDialog` and `EditWorkflowDialog` exports

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] `ViewWorkflowDialog` is exported from `components/workflows/index.ts`
- [ ] Existing exports remain unchanged
- [ ] All validation commands pass

---

### Step 3: Add onViewInfo Callback to WorkflowTable

**What**: Add a new `onViewInfo` callback prop to `WorkflowTable` and change the "View" action to invoke it instead of `onViewDetails`. Keep `onViewDetails` for row click navigation.
**Why**: The "View" action in the dropdown menu must trigger the info dialog rather than navigating. Row click continues to navigate via `onViewDetails`. This separation of concerns allows the two interactions to have distinct behaviors.
**Confidence**: High

**Files to Modify:**

- `components/workflows/workflow-table.tsx` - Add `onViewInfo` prop and rewire "View" action

**Changes:**

- Add `onViewInfo?: (workflow: Workflow) => void` to `WorkflowTableProps` interface
- Add `onViewInfo?: (workflow: Workflow) => void` to `ActionsCellProps` interface
- In the `ActionsCell` component, change the "View" action's `onAction` from calling `onViewDetails` to calling `onViewInfo` with the full workflow object
- Pass `onViewInfo` through from the main component to the `ActionsCell` in the column definition
- Add `onViewInfo` to the destructured props of the main `WorkflowTable` component
- Add `onViewInfo` to the `useMemo` dependency array for `columns`
- The `handleRowClick` callback and `onRowClick` prop on `DataTable` remain unchanged (still uses `onViewDetails`)
- The feature name column `TableNameButton` `onClick` remains unchanged (still uses `onViewDetails`)

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] `onViewInfo` prop added to `WorkflowTableProps` and `ActionsCellProps`
- [ ] "View" action in dropdown calls `onViewInfo` with the full `Workflow` object
- [ ] Row click still calls `onViewDetails` for navigation
- [ ] Feature name button still calls `onViewDetails` for navigation
- [ ] All validation commands pass

---

### Step 4: Add onViewInfo Callback to WorkflowHistoryTable

**What**: Add a new `onViewInfo` callback prop to `WorkflowHistoryTable` and change the "View Details" action to invoke it instead of `onViewDetails`.
**Why**: Same pattern as Step 3, applied to the history table. The history table's "View Details" action in the dropdown must open the info dialog, while row click continues navigating.
**Confidence**: High

**Files to Modify:**

- `components/workflows/workflow-history-table.tsx` - Add `onViewInfo` prop and rewire action

**Changes:**

- Add `onViewInfo?: (workflow: Workflow) => void` to `WorkflowHistoryTableProps` interface
- Add `onViewInfo?: (workflow: Workflow) => void` to `ActionsCellProps` interface
- Change the action label from `'View Details'` to `'View'` for consistency with the main workflow table
- Change the action's `onAction` from calling `onViewDetails` to calling `onViewInfo` with the full workflow object
- Pass `onViewInfo` from the main component to `ActionsCell` in the column definition
- Add `onViewInfo` to the `useMemo` dependency array for `columns`
- Row click behavior remains unchanged (still uses `onViewDetails`)
- Feature name `TableNameButton` onClick remains unchanged (still uses `onViewDetails`)

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] `onViewInfo` prop added to `WorkflowHistoryTableProps` and `ActionsCellProps`
- [ ] Dropdown action calls `onViewInfo` with the full `Workflow` object
- [ ] Row click still navigates via `onViewDetails`
- [ ] All validation commands pass

---

### Step 5: Wire ViewWorkflowDialog into WorkflowsTabContent (Project Page)

**What**: Add dialog state management and render the `ViewWorkflowDialog` in the project workflows tab content component.
**Why**: This is one of four consumer locations that renders `WorkflowTable` and needs the dialog wired in.
**Confidence**: High

**Files to Modify:**

- `components/workflows/workflows-tab-content.tsx` - Add dialog state and render dialog

**Changes:**

- Add state: `const [viewingWorkflow, setViewingWorkflow] = useState<null | Workflow>(null);`
- Add handler: `handleViewInfo` callback that sets `viewingWorkflow` to the provided workflow
- Add handler: `handleViewInfoDialogOpenChange` callback that sets `viewingWorkflow` to null when closing
- Pass `onViewInfo={handleViewInfo}` to the `WorkflowTable` component
- Render `ViewWorkflowDialog` with `workflow={viewingWorkflow}`, `isOpen={viewingWorkflow !== null}`, `onOpenChange={handleViewInfoDialogOpenChange}`
- Place the dialog render alongside the existing `EditWorkflowDialog` render

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] `ViewWorkflowDialog` rendered in the component
- [ ] Dialog opens when "View" action is clicked in the dropdown
- [ ] Dialog closes properly via onOpenChange
- [ ] Row click still navigates to workflow detail page
- [ ] All validation commands pass

---

### Step 6: Wire ViewWorkflowDialog into Active Workflows Page

**What**: Add dialog state management and render the `ViewWorkflowDialog` in the active workflows page.
**Why**: Second consumer location that renders `WorkflowTable`.
**Confidence**: High

**Files to Modify:**

- `app/(app)/workflows/active/page.tsx` - Add dialog state and render dialog

**Changes:**

- Add state: `const [viewingWorkflow, setViewingWorkflow] = useState<null | Workflow>(null);`
- Add handler: `handleViewInfo` callback that sets `viewingWorkflow`
- Add handler: `handleViewInfoDialogOpenChange` callback that clears `viewingWorkflow` on close
- Pass `onViewInfo={handleViewInfo}` to the `WorkflowTable` component
- Render `ViewWorkflowDialog` alongside existing dialogs

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] `ViewWorkflowDialog` rendered in the content state
- [ ] Dialog opens from "View" action in dropdown
- [ ] Row click still navigates to workflow detail page
- [ ] All validation commands pass

---

### Step 7: Wire ViewWorkflowDialog into Created Workflows Page

**What**: Add dialog state management and render the `ViewWorkflowDialog` in the created workflows page.
**Why**: Third consumer location that renders `WorkflowTable`.
**Confidence**: High

**Files to Modify:**

- `app/(app)/workflows/created/page.tsx` - Add dialog state and render dialog

**Changes:**

- Add state: `const [viewingWorkflow, setViewingWorkflow] = useState<null | Workflow>(null);`
- Add handler: `handleViewInfo` callback that sets `viewingWorkflow`
- Add handler: `handleViewInfoDialogOpenChange` callback that clears `viewingWorkflow` on close
- Pass `onViewInfo={handleViewInfo}` to the `WorkflowTable` component
- Render `ViewWorkflowDialog` alongside existing dialogs

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] `ViewWorkflowDialog` rendered in the content state
- [ ] Dialog opens from "View" action in dropdown
- [ ] Row click still navigates to workflow detail page
- [ ] All validation commands pass

---

### Step 8: Wire ViewWorkflowDialog into Workflow History Page

**What**: Add dialog state management and render the `ViewWorkflowDialog` in the workflow history page.
**Why**: Fourth and final consumer location, this one renders `WorkflowHistoryTable`.
**Confidence**: High

**Files to Modify:**

- `app/(app)/workflows/history/page.tsx` - Add dialog state and render dialog

**Changes:**

- Import `ViewWorkflowDialog` from `@/components/workflows`
- Import `Workflow` type from `@/db/schema`
- Add state: `const [viewingWorkflow, setViewingWorkflow] = useState<null | Workflow>(null);`
- Add handler: `handleViewInfo` callback that sets `viewingWorkflow`
- Add handler: `handleViewInfoDialogOpenChange` callback that clears `viewingWorkflow` on close
- Pass `onViewInfo={handleViewInfo}` to the `WorkflowHistoryTable` component
- Render `ViewWorkflowDialog` alongside existing content

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] `ViewWorkflowDialog` rendered in the content state
- [ ] Dialog opens from "View" action in dropdown
- [ ] Row click still navigates to workflow detail page
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm typecheck`
- [ ] All files pass `pnpm lint`
- [ ] Manual verification: On the project workflows tab, clicking "View" in the actions dropdown opens the dialog with correct workflow data
- [ ] Manual verification: On the project workflows tab, clicking a table row still navigates to `/workflows/[id]`
- [ ] Manual verification: On the active workflows page, "View" action opens the dialog
- [ ] Manual verification: On the created workflows page, "View" action opens the dialog
- [ ] Manual verification: On the workflow history page, "View" action opens the dialog
- [ ] Manual verification: The dialog displays resolved project name, agent name, and worktree path (not raw IDs)
- [ ] Manual verification: The dialog properly shows error section only for failed workflows
- [ ] Manual verification: The dialog close button and backdrop click both close the dialog

## Notes

- **Workflow type import**: The new `ViewWorkflowDialog` should import `Workflow` from `@/db/schema/workflows.schema` since it is a shared component. Each consumer page should continue using whatever import path it already uses.
- **Query hooks for entity resolution**: The `useProject`, `useAgent`, and `useWorktree` hooks accept nullable IDs and disable themselves when the ID is null/undefined. The dialog can safely call all three hooks unconditionally.
- **No new IPC channels or database changes required**: All data needed is already available on the `Workflow` object passed to the dialog.
- **Action label consistency**: Both tables should use "View" for the info dialog action label.
- **The `onViewInfo` callback passes the full `Workflow` object** rather than just the ID, avoiding a re-fetch in the dialog.

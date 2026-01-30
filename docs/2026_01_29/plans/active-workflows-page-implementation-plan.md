# Active Workflows Page UI - Implementation Plan

Generated: 2026-01-29
Original Request: "Create active workflows page showing running/paused workflows with real-time status updates, quick actions (pause/resume/cancel), and progress indicators."

Refined Request: The Active Workflows page provides a centralized view of all running and paused workflows in the Clarify orchestration system, enabling users to monitor parallel execution across multiple features or implementations at a glance. The page displays workflow cards in a responsive grid layout, each showing the workflow type icon, descriptive title, current step progress with a visual progress bar indicating completion percentage, elapsed time tracking, and current workflow status (running, paused, failed, etc.) with color-coded badges for quick visual identification. Each workflow card includes quick-action buttons for essential workflow management: a "View" button to navigate to the full workflow details, a contextual pause/resume button that toggles based on the current state, and a cancel button for terminating workflows. The page integrates real-time status updates via TanStack Query to automatically refresh workflow states and progress indicators without manual page reload.

## Overview

**Estimated Duration**: 4-6 hours
**Complexity**: Medium
**Risk Level**: Low

## Quick Summary

This plan implements the Active Workflows page that displays a real-time grid of running, paused, and editing workflows with progress tracking, elapsed time, status badges, and quick-action controls (view, pause/resume, cancel). The implementation leverages existing patterns from the dashboard `ActiveWorkflowsWidget` and `WorkflowCard` components while adding polling-based real-time updates and enhanced workflow control actions.

## Analysis Summary

- Feature request refined with project context
- Discovered 24 files across 15+ directories
- Generated 7-step implementation plan

## File Discovery Results

### Critical Priority (Core Implementation)

- `app/(app)/workflows/active/page.tsx` - Main Active Workflows page - **MODIFY**
- `hooks/queries/use-workflows.ts` - TanStack Query hooks - add `useActiveWorkflows` with polling - **MODIFY**
- `components/workflows/workflow-card.tsx` - Existing workflow card component - **REFERENCE/MODIFY**

### High Priority (Supporting Implementation)

- `app/(app)/dashboard/_components/active-workflows-widget.tsx` - Reference implementation - **REFERENCE**
- `lib/queries/workflows.ts` - Query key factory - may need `active` key - **MODIFY**
- `app/(app)/workflows/[id]/_components/workflow-control-bar.tsx` - Control button logic - **REFERENCE**
- `db/schema/workflows.schema.ts` - Workflow status types - **REFERENCE**

### Medium Priority (Integration Points)

- `components/ui/badge.tsx` - Badge for status display - **REFERENCE**
- `components/ui/card.tsx` - Card component primitives - **REFERENCE**
- `components/ui/button.tsx` - Button for actions - **REFERENCE**
- `components/ui/empty-state.tsx` - Empty state component - **REFERENCE**

## Prerequisites

- [ ] Existing `WorkflowCard` component at `components/workflows/workflow-card.tsx` is available
- [ ] TanStack Query hooks in `hooks/queries/use-workflows.ts` provide mutation hooks for pause/resume/cancel
- [ ] Query key factory at `lib/queries/workflows.ts` has `running` key defined
- [ ] EmptyState, Badge, Button, and Card UI primitives are available

## Implementation Steps

### Step 1: Add `useActiveWorkflows` Query Hook with Polling

**What**: Create a dedicated TanStack Query hook that fetches workflows filtered by active statuses (running, paused, editing) with automatic polling for real-time updates.
**Why**: The page requires real-time status updates without manual refresh. A dedicated hook with `refetchInterval` ensures workflows automatically refresh and provides a clean API for the page component.
**Confidence**: High

**Files to Modify:**

- `hooks/queries/use-workflows.ts` - Add new `useActiveWorkflows` hook

**Changes:**

- Add `useActiveWorkflows` hook that queries all workflows and filters client-side for statuses: `running`, `paused`, `editing`
- Configure `refetchInterval` of 5000ms (5 seconds) for polling active workflows
- Use `workflowKeys.running` query key from the existing factory
- Accept optional `enabled` parameter to pause polling when not needed

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] `useActiveWorkflows` hook exports correctly
- [ ] Hook filters workflows by active statuses
- [ ] Polling interval is configured at 5 seconds
- [ ] All validation commands pass

---

### Step 2: Create Active Workflow Card Component with Quick Actions

**What**: Create an `ActiveWorkflowCard` component that extends the existing `WorkflowCard` with inline pause/resume controls and enhanced progress display.
**Why**: The Active Workflows page requires quick-action buttons directly on each card for workflow control, differing from the base `WorkflowCard` which only has View and Cancel actions.
**Confidence**: High

**Files to Create:**

- `app/(app)/workflows/active/_components/active-workflow-card.tsx` - Enhanced workflow card with pause/resume controls

**Changes:**

- Create component accepting `workflow`, `projectName`, `onView`, `onPause`, `onResume`, `onCancel`, and pending state props
- Display workflow type icon, feature name, project name, status badge
- Include progress bar with step indicator (e.g., "Step 2 of 5: File Discovery")
- Display elapsed time using `date-fns` `formatDistanceToNow`
- Add View button that navigates to workflow detail
- Add contextual Pause/Resume button based on workflow status
- Add Cancel button for cancellable statuses
- Follow existing `WorkflowCard` styling patterns with Card, CardHeader, CardContent, CardFooter
- Use `WorkflowControlBar` button logic patterns for status-based action visibility

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Component renders workflow information correctly
- [ ] Progress bar displays current step and percentage
- [ ] Pause button shows for running workflows
- [ ] Resume button shows for paused workflows
- [ ] Cancel button shows for cancellable workflows
- [ ] All validation commands pass

---

### Step 3: Create Loading Skeleton Component

**What**: Create a skeleton loading component for the active workflows grid that matches the card layout.
**Why**: Provides visual feedback during initial data loading and maintains layout stability, following the established skeleton pattern from `ActiveWorkflowsWidget`.
**Confidence**: High

**Files to Create:**

- `app/(app)/workflows/active/_components/active-workflow-card-skeleton.tsx` - Loading skeleton for workflow cards

**Changes:**

- Create skeleton matching the `ActiveWorkflowCard` structure
- Include placeholders for header (title, project name, status badge)
- Include placeholder for progress bar and step indicator
- Include placeholder for elapsed time and workflow type
- Include placeholder for action buttons
- Use `animate-pulse` and `bg-muted` for skeleton styling
- Add appropriate ARIA attributes for accessibility

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Skeleton layout matches actual card dimensions
- [ ] Animation provides loading feedback
- [ ] ARIA attributes indicate loading state
- [ ] All validation commands pass

---

### Step 4: Implement Active Workflows Page Content

**What**: Build the main page content component that renders the workflow grid, handles empty states, and manages workflow actions.
**Why**: This is the core page component that orchestrates data fetching, filtering, and user interactions for the Active Workflows page.
**Confidence**: High

**Files to Modify:**

- `app/(app)/workflows/active/page.tsx` - Replace placeholder with full implementation

**Changes:**

- Add `"use client"` directive for client-side interactivity
- Import and use `useActiveWorkflows` hook for data fetching with polling
- Import and use `useProjects` hook for project name mapping
- Import and use `usePauseWorkflow`, `useResumeWorkflow`, `useCancelWorkflow` mutation hooks
- Create project ID to name lookup map using `useMemo`
- Implement loading state rendering with skeleton grid
- Implement empty state when no active workflows exist using `EmptyState` component
- Implement responsive grid layout for workflow cards (1 column on mobile, 2 on medium, 3 on large screens)
- Add handler functions for view, pause, resume, and cancel actions
- Navigate to workflow detail page on view click using `$path` from `next-typesafe-url`
- Wrap content in `QueryErrorBoundary` for error handling
- Follow page header pattern with title and description

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Page displays active workflows in responsive grid
- [ ] Loading state shows skeleton cards
- [ ] Empty state displays when no active workflows
- [ ] View action navigates to workflow detail
- [ ] Pause action triggers pause mutation
- [ ] Resume action triggers resume mutation
- [ ] Cancel action triggers cancel mutation
- [ ] All validation commands pass

---

### Step 5: Add Step Name Display Support

**What**: Extend the active workflow card to display the current step name/description when available.
**Why**: Users need to see which specific step is executing (e.g., "File Discovery", "Plan Generation") to understand workflow progress beyond just step numbers.
**Confidence**: Medium

**Files to Modify:**

- `app/(app)/workflows/active/_components/active-workflow-card.tsx` - Add current step name display

**Changes:**

- Accept optional `currentStepName` prop derived from workflow step data
- Display step name alongside step number in progress section (e.g., "Step 2 of 5: File Discovery")
- Handle missing step name gracefully with fallback to just step numbers
- Truncate long step names with ellipsis to prevent layout overflow

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Step name displays when available
- [ ] Falls back gracefully when step name is not available
- [ ] Long step names are truncated appropriately
- [ ] All validation commands pass

---

### Step 6: Add Confirmation Dialog for Cancel Action

**What**: Implement a confirmation dialog before canceling a workflow to prevent accidental cancellation.
**Why**: Canceling a workflow is a destructive action that cannot be undone. Users should confirm this action to avoid losing workflow progress.
**Confidence**: High

**Files to Modify:**

- `app/(app)/workflows/active/page.tsx` - Add cancel confirmation logic

**Changes:**

- Add state for tracking workflow pending cancellation
- Create confirmation handler that shows alert or uses existing dialog pattern
- Only execute cancel mutation after user confirms
- Pass pending state to cards to disable cancel button during confirmation/mutation

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Cancel action prompts for confirmation
- [ ] Confirmed cancellation triggers mutation
- [ ] Declined cancellation does not affect workflow
- [ ] Cancel button shows pending state during mutation
- [ ] All validation commands pass

---

### Step 7: Integration Testing and Polish

**What**: Verify all components work together, handle edge cases, and ensure consistent styling.
**Why**: Final verification ensures the feature is production-ready with proper error handling, accessibility, and visual consistency.
**Confidence**: High

**Files to Modify:**

- `app/(app)/workflows/active/page.tsx` - Final polish and edge case handling
- `app/(app)/workflows/active/_components/active-workflow-card.tsx` - Final styling adjustments

**Changes:**

- Verify polling pauses when page is not visible (TanStack Query handles this)
- Ensure card hover and focus states match existing UI patterns
- Verify responsive grid layout at all breakpoints
- Add ARIA live region for workflow status changes
- Ensure keyboard navigation works for all interactive elements
- Test empty state action link navigation

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Polling works correctly and updates UI
- [ ] All interactive elements are keyboard accessible
- [ ] Responsive layout works at all screen sizes
- [ ] Status changes are announced to screen readers
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint`
- [ ] Page loads and displays workflow cards correctly
- [ ] Real-time polling updates workflow states without manual refresh
- [ ] All workflow actions (view, pause, resume, cancel) function correctly
- [ ] Empty state displays appropriate message and action
- [ ] Loading state shows skeleton cards
- [ ] Responsive grid adapts to screen size

## Notes

- The implementation reuses existing mutation hooks (`usePauseWorkflow`, `useResumeWorkflow`, `useCancelWorkflow`) which already handle cache invalidation including the `workflowKeys.running` query
- Polling interval of 5 seconds balances responsiveness with performance; can be adjusted based on user feedback
- The `useActiveWorkflows` hook filters client-side since the ElectronAPI does not support server-side status filtering
- Consider adding a manual refresh button in future iterations for users who want immediate updates
- The current step name may require fetching workflow steps data; initial implementation can show step numbers only if step name is not readily available on the workflow object

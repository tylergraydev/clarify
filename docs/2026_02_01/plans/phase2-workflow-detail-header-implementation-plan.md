# Phase 2: Workflow Detail - Header & Metadata Implementation Plan

Generated: 2026-02-01
Original Request: Phase 2 of the workflow-implementation-phases.md
Refined Request: Implement the workflow detail page header and metadata section for the Clarify Electron desktop application by extending the existing `app/(app)/workflows/[id]/page.tsx` page shell to display real workflow data fetched via the `useWorkflow(id)` hook. The header should prominently display the workflow feature name in a large, visually prominent typography size, followed by a status badge indicating the current workflow state (created, running, paused, editing, completed, failed, or cancelled) using the existing Badge component with workflow status variants, and a workflow type badge (planning or implementation) positioned adjacent to the status. Include a linked project name that navigates to the associated project detail page using the `useProject(projectId)` hook, along with created and started timestamps formatted using date-fns, displayed in a way that provides quick temporal context (e.g., "Created 2 hours ago, Started 1 hour ago"). Below the metadata section, implement an action bar containing placeholder buttons for workflow control actions (Pause, Cancel, Resume, etc.) that are visually arranged but not yet functional, establishing the layout and accessibility structure for future interaction. The implementation must handle loading states by displaying skeleton loaders or placeholder content while the workflow data is being fetched, and error states by showing appropriate error messaging or fallback UI components from the existing error boundary patterns.

## Analysis Summary

- Feature request refined with project context
- Discovered 22 files across 10+ directories
- Generated 7-step implementation plan

## File Discovery Results

### Critical Priority (Must Modify)

| File | Relevance |
|------|-----------|
| `app/(app)/workflows/[id]/page.tsx` | Main page to extend with header, metadata, badges, timestamps, action bar |
| `components/workflows/workflow-detail-skeleton.tsx` | Loading skeleton needs to match new header/metadata layout |

### High Priority (Key Dependencies)

| File | Relevance |
|------|-----------|
| `hooks/queries/use-workflows.ts` | Contains useWorkflow hook and mutation hooks |
| `hooks/queries/use-projects.ts` | Contains useProject hook |
| `db/schema/workflows.schema.ts` | Defines workflow status and type values |
| `components/ui/badge.tsx` | Badge component with workflow status variants |
| `components/ui/button.tsx` | Button component for action bar |

### Pattern References

| File | Relevance |
|------|-----------|
| `components/dashboard/active-workflows-widget.tsx` | Status badge mapping, action buttons, elapsed time |
| `components/workflows/workflow-table.tsx` | getStatusVariant, formatStatusLabel, formatTypeLabel |
| `app/(app)/projects/[id]/page.tsx` | Detail page pattern |

---

## Overview

**Complexity**: Medium
**Risk Level**: Low

## Quick Summary

Extend the existing workflow detail page (`app/(app)/workflows/[id]/page.tsx`) to display a comprehensive header section with workflow metadata, status badges, timestamps, linked project navigation, and an action bar with placeholder control buttons. The implementation follows established patterns from `active-workflows-widget.tsx` and `workflow-table.tsx` for status badge mapping and date formatting, while using `projects/[id]/page.tsx` as the structural reference for detail page layout.

## Prerequisites

- [ ] Verify `useWorkflow` hook returns all required fields (`status`, `type`, `createdAt`, `startedAt`, `projectId`)
- [ ] Confirm `useProject` hook is already imported and working in the existing page
- [ ] Confirm `date-fns` is installed (already in dependencies)

---

## Implementation Steps

### Step 1: Create Helper Functions for Status and Date Formatting

**What**: Extract reusable helper functions for status badge variants, status labels, type labels, and relative date formatting into the page file's Helpers section.

**Why**: Following existing patterns from `active-workflows-widget.tsx` and `workflow-table.tsx`, these helpers centralize display logic and ensure consistent formatting across the page.

**Confidence**: High

**Files to Modify:**
- `app/(app)/workflows/[id]/page.tsx` - Add helper functions in the Helpers section

**Changes:**
- Import `formatDistanceToNow` and `parseISO` from `date-fns`
- Add `getStatusVariant` function mapping workflow status to badge variant:
  - created -> default
  - running -> planning (blue)
  - paused -> clarifying (yellow)
  - editing -> clarifying (yellow)
  - completed -> completed (green)
  - failed -> failed (red)
  - cancelled -> stale (amber)
- Add `formatStatusLabel` function to capitalize status string
- Add `formatTypeLabel` function to capitalize type string
- Add `formatRelativeTime` function using `formatDistanceToNow` with `{ addSuffix: true }`
- Define status arrays: `PAUSABLE_STATUSES`, `RESUMABLE_STATUSES`, `CANCELLABLE_STATUSES`

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Helper functions are defined in the Helpers section
- [ ] All date-fns imports resolve correctly
- [ ] Type definitions match workflow schema status/type values
- [ ] All validation commands pass

---

### Step 2: Update WorkflowDetailSkeleton with Full Header Layout

**What**: Extend the skeleton component to include placeholders for status badges, type badge, project link, timestamps, and action bar buttons.

**Why**: The loading state should match the final content structure to prevent layout shift when data loads.

**Confidence**: High

**Files to Modify:**
- `components/workflows/workflow-detail-skeleton.tsx` - Extend skeleton structure

**Changes:**
- Add skeleton elements for status badge (rounded pill shape)
- Add skeleton element for type badge (rounded pill shape)
- Add skeleton element for project name link
- Add skeleton elements for created and started timestamps
- Add skeleton action bar section with 3-4 button-sized placeholders
- Maintain proper spacing with `space-y-*` classes

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Skeleton visually matches the planned header layout structure
- [ ] Skeleton uses consistent `animate-pulse` and `bg-muted` classes
- [ ] Layout dimensions approximate the final content
- [ ] All validation commands pass

---

### Step 3: Implement Header Section with Feature Name and Badges

**What**: Replace the minimal header with a comprehensive header displaying the workflow feature name prominently, status badge, and type badge.

**Why**: The feature name is the primary identifier for users and the badges provide immediate status context.

**Confidence**: High

**Files to Modify:**
- `app/(app)/workflows/[id]/page.tsx` - Update the header section JSX

**Changes:**
- Import `Badge` component from `@/components/ui/badge`
- Update h1 to display only `workflow.featureName` with larger typography (`text-3xl`)
- Add flex container for badges adjacent to the title
- Render status badge using `getStatusVariant(workflow.status)` for variant
- Render type badge with `default` variant displaying capitalized workflow type
- Ensure proper spacing between title and badges with `gap-3`

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Feature name displays prominently in large typography
- [ ] Status badge renders with correct variant color based on status
- [ ] Type badge displays "Planning" or "Implementation"
- [ ] All validation commands pass

---

### Step 4: Add Metadata Section with Project Link and Timestamps

**What**: Create a metadata subsection below the header showing linked project name and formatted timestamps.

**Why**: Users need quick access to project context and temporal information to understand the workflow's lifecycle stage.

**Confidence**: High

**Files to Modify:**
- `app/(app)/workflows/[id]/page.tsx` - Add metadata section below header

**Changes:**
- Import `Calendar` and `Clock` icons from `lucide-react`
- Create metadata div with flex layout containing project link, created time, and started time
- Add linked project name using `Link` component with `$path` to `/projects/[id]` route
- Display "Created X ago" using `formatRelativeTime(workflow.createdAt)` with Calendar icon
- Display "Started X ago" using `formatRelativeTime(workflow.startedAt)` with Clock icon (conditionally render only if `startedAt` exists)
- Style project link with hover color transition
- Use `text-sm text-muted-foreground` for metadata text

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Project name links to correct project detail page
- [ ] Created timestamp displays relative time with "Created" prefix
- [ ] Started timestamp conditionally renders when workflow has been started
- [ ] All validation commands pass

---

### Step 5: Implement Action Bar with Placeholder Buttons

**What**: Add an action bar section with visually arranged placeholder buttons for Pause, Resume, Cancel workflow control actions.

**Why**: Establishes the layout and accessibility structure for future interaction implementation while providing visual consistency.

**Confidence**: High

**Files to Modify:**
- `app/(app)/workflows/[id]/page.tsx` - Add action bar section

**Changes:**
- Import `Button` component from `@/components/ui/button`
- Import action icons: `Pause`, `Play`, `X` from `lucide-react`
- Create action bar div with flex layout and gap spacing
- Add Pause button (visible when status in `PAUSABLE_STATUSES`) with `variant="outline"`
- Add Resume button (visible when status in `RESUMABLE_STATUSES`) with `variant="outline"`
- Add Cancel button (visible when status in `CANCELLABLE_STATUSES`) with `variant="destructive"` styling
- All buttons disabled with `aria-disabled` and visual disabled state
- Include proper `aria-label` attributes for each button
- Buttons show icon + text label pattern

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Action buttons render based on workflow status conditions
- [ ] Buttons are visually disabled but present
- [ ] Each button has appropriate ARIA labeling
- [ ] Button layout follows the design pattern from active-workflows-widget
- [ ] All validation commands pass

---

### Step 6: Handle Edge Cases and Conditional Rendering

**What**: Add defensive handling for null/undefined values and ensure graceful degradation for missing data scenarios.

**Why**: Robust error handling prevents UI crashes when workflow data is incomplete or project lookup fails.

**Confidence**: High

**Files to Modify:**
- `app/(app)/workflows/[id]/page.tsx` - Add conditional rendering logic

**Changes:**
- Add null check for `workflow.startedAt` before formatting started time
- Add conditional rendering for project link when `project` is undefined/loading
- Display "No Project" fallback text when project cannot be loaded
- Ensure status and type use fallback to 'default' variant if unrecognized status
- Add type guard for workflow status to ensure valid badge variant selection

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Page handles null `startedAt` gracefully
- [ ] Page handles missing project data with fallback UI
- [ ] No TypeScript errors for potentially undefined values
- [ ] All validation commands pass

---

### Step 7: Update Barrel Export and Verify Integration

**What**: Verify the skeleton component is properly exported and test the full page integration.

**Why**: Ensures the component is accessible through the standard import pattern and the full feature works end-to-end.

**Confidence**: High

**Files to Modify:**
- `components/workflows/index.ts` - Verify export (already exported)

**Changes:**
- Verify `WorkflowDetailSkeleton` export is present
- No changes needed if export exists

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] `WorkflowDetailSkeleton` is exported from barrel file
- [ ] Import in page file resolves correctly via `@/components/workflows`
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm typecheck`
- [ ] All files pass `pnpm lint`
- [ ] Loading state displays skeleton matching content layout
- [ ] Error state redirects to active workflows as per existing behavior
- [ ] Status badges use correct color variants for all 7 workflow statuses
- [ ] Type badge displays correctly for both "planning" and "implementation"
- [ ] Project link navigates to correct detail page
- [ ] Relative timestamps display correctly with "ago" suffix
- [ ] Action buttons render conditionally based on workflow status
- [ ] All buttons have appropriate ARIA attributes for accessibility

---

## Notes

**Pattern Alignment**: This implementation closely follows patterns from:
- `components/dashboard/active-workflows-widget.tsx` for status badge mapping, action button visibility logic, and elapsed time formatting
- `components/workflows/workflow-table.tsx` for `getStatusVariant` mapping
- `app/(app)/projects/[id]/page.tsx` for detail page structure, breadcrumb pattern, and metadata card layout

**Status Badge Variant Mapping**:

| Workflow Status | Badge Variant | Color |
|-----------------|---------------|-------|
| created | default | gray |
| running | planning | blue |
| paused | clarifying | yellow |
| editing | clarifying | yellow |
| completed | completed | green |
| failed | failed | red |
| cancelled | stale | amber |

**Action Button Visibility Logic**:

| Action | Visible When Status |
|--------|---------------------|
| Pause | `running` |
| Resume | `paused` |
| Cancel | `created`, `paused`, `running` |

**Future Integration**: The action buttons are placeholder-only in this phase. Actual functionality will connect to `usePauseWorkflow`, `useResumeWorkflow`, and `useCancelWorkflow` mutation hooks in a subsequent implementation phase (Phase 10: Pause & Resume).

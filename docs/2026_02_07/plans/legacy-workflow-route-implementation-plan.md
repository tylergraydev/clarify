# Legacy Workflow Route - Implementation Plan

**Generated**: 2026-02-07
**Original Request**: Move the existing workflow detail page to a legacy route and create a new blank-slate page
**Refined Request**: Move the existing workflow detail page located at `app/(app)/workflows/[id]/page.tsx` to a new legacy route at `app/(app)/workflows/old/[id]/page.tsx`, preserving all its current functionality including the four-step accordion component, the streaming panel, the top bar, breadcrumb navigation, and the clarification-stream-provider wrapper. Replace the current page with a minimal blank-slate placeholder retaining only breadcrumbs and ClarificationStreamProvider. Add a "Legacy View" sidebar navigation item.

## Analysis Summary

- Feature request refined with project context
- Discovered 24+ files across 12 directories
- Generated 7-step implementation plan

## File Discovery Results

### Critical (Modify/Replace)
- `app/(app)/workflows/[id]/page.tsx` - Replace with blank-slate
- `app/(app)/workflows/[id]/route-type.ts` - Simplify (remove searchParams)
- `components/shell/app-sidebar.tsx` - Add "Legacy View" nav item

### High (Create New)
- `app/(app)/workflows/old/[id]/page.tsx` - Copy of current page
- `app/(app)/workflows/old/[id]/route-type.ts` - Copy of current route-type
- `app/(app)/workflows/old/page.tsx` - Redirect page to history
- `_next-typesafe-url_.d.ts` - Regenerate

### Medium (Update)
- `components/workflows/workflow-attention-notifier.tsx` - Update regex

### Reference Only (No Changes)
- `components/workflows/detail/*` - All detail components unchanged
- `hooks/queries/use-workflows.ts` - useWorkflow hook unchanged
- `lib/stores/workflow-detail-store.ts` - Zustand store unchanged
- All IPC handlers, services, and database schemas unchanged

---

## Implementation Plan

## Overview

**Estimated Duration**: 2-3 hours
**Complexity**: Low
**Risk Level**: Low

## Quick Summary

Move the current workflow detail page (`workflows/[id]/page.tsx`) to a new legacy route at `workflows/old/[id]/page.tsx`, preserving all functionality unchanged. Replace the original page with a minimal blank-slate placeholder that retains only the breadcrumb navigation and ClarificationStreamProvider wrapper. Add a "Legacy View" navigation sub-item under the Workflows collapsible section in the sidebar. Update the workflow attention notifier regex to also match the legacy route path.

## Prerequisites

- [ ] Confirm the current `workflows/[id]/page.tsx` builds and runs correctly before beginning changes
- [ ] Ensure `pnpm next-typesafe-url` command is functional and generates `_next-typesafe-url_.d.ts`

## Implementation Steps

### Step 1: Create the Legacy Route Directory and Page

**What**: Create `app/(app)/workflows/old/[id]/page.tsx` as an exact copy of the current `app/(app)/workflows/[id]/page.tsx`, and create the corresponding `route-type.ts` file.
**Why**: This preserves the full workflow detail functionality (accordion, streaming panel, top bar, pre-start summary, breadcrumbs, ClarificationStreamProvider) at the new legacy URL path so it remains accessible.
**Confidence**: High

**Files to Create:**
- `app/(app)/workflows/old/[id]/page.tsx` - Exact copy of current workflow detail page with all imports, the `withParamValidation` HOC, and all UI sections intact
- `app/(app)/workflows/old/[id]/route-type.ts` - Exact copy of the current `route-type.ts` with the same Zod schema

**Changes:**
- Copy the entire contents of `app/(app)/workflows/[id]/page.tsx` to the new legacy path
- Copy the entire contents of `app/(app)/workflows/[id]/route-type.ts` to the new legacy path
- No changes to import paths needed since all component imports use `@/` aliases

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] `app/(app)/workflows/old/[id]/page.tsx` exists with identical content to the original page
- [ ] `app/(app)/workflows/old/[id]/route-type.ts` exists with identical schema definitions
- [ ] All `@/` aliased imports resolve correctly from the new location

---

### Step 2: Regenerate Type-Safe Route Definitions

**What**: Run `pnpm next-typesafe-url` to regenerate the `_next-typesafe-url_.d.ts` file so it discovers the new `workflows/old/[id]` route.
**Why**: Without regeneration, the new route would not appear in the type system and `$path()` calls for the legacy route would fail type checking.
**Confidence**: High

**Files to Modify:**
- `_next-typesafe-url_.d.ts` - Regenerated automatically; should include new `"/workflows/old/[id]"` in `DynamicRouter`

**Changes:**
- Run `pnpm next-typesafe-url` to regenerate the declaration file
- Verify the output includes `"/workflows/old/[id]"` in the `DynamicRouter` interface

**Validation Commands:**
```bash
pnpm next-typesafe-url && pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] `_next-typesafe-url_.d.ts` contains `"/workflows/old/[id]"` in `DynamicRouter`
- [ ] The existing `"/workflows/[id]"` entry remains unchanged

---

### Step 3: Replace the Original Workflow Detail Page with Blank-Slate Content

**What**: Replace the contents of `app/(app)/workflows/[id]/page.tsx` with a minimal page that retains only the breadcrumb navigation chain and ClarificationStreamProvider wrapper, removing the accordion, streaming panel, top bar, and pre-start summary.
**Why**: This creates a clean starting point for the new workflow detail UI while preserving navigation context.
**Confidence**: High

**Files to Modify:**
- `app/(app)/workflows/[id]/page.tsx` - Major rewrite; replace full page content with blank-slate placeholder

**Changes:**
- Keep the `'use client'` directive
- Keep imports for: `ChevronRight` (lucide-react), `$path` (next-typesafe-url), `useRouteParams`, `withParamValidation`, `Link`, `redirect`
- Keep imports for: `QueryErrorBoundary`, `ClarificationStreamProvider`, `useProject`, `useWorkflow`
- Remove imports for: `WorkflowPreStartSummary`, `WorkflowStepAccordion`, `WorkflowStreamingPanel`, `WorkflowTopBar`
- Remove `parseAsStringLiteral`, `useQueryState`, `workflowStepValues` imports (no longer needed)
- Keep the `Route` import from `./route-type`
- Keep full breadcrumb navigation block (Home > Project Name > Workflows > Feature Name) using real data
- Wrap with `ClarificationStreamProvider` (same `isEnabled` logic)
- Replace three-zone layout with simple centered placeholder
- Remove `isPreStart` conditional branch
- Keep `withParamValidation` HOC in the export

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Page renders breadcrumb chain with real workflow data
- [ ] Page wraps content with `ClarificationStreamProvider` and `QueryErrorBoundary`
- [ ] Page shows a placeholder message
- [ ] No references to removed components remain

---

### Step 4: Simplify the Route Type File for the New Page

**What**: Remove the `searchParams` schema and `workflowStepValues` constant from `app/(app)/workflows/[id]/route-type.ts`.
**Why**: The `step` search param and `workflowStepValues` were solely used by the step accordion and nuqs, both removed from the new page.
**Confidence**: High

**Files to Modify:**
- `app/(app)/workflows/[id]/route-type.ts` - Remove `searchParams` and `workflowStepValues`

**Changes:**
- Remove the `workflowStepValues` constant
- Remove the `searchParams` property from the `Route` object
- Remove the `WorkflowStepValue` type export
- Keep `routeParams` with `z.coerce.number().int().positive()`

**Validation Commands:**
```bash
pnpm next-typesafe-url && pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] `route-type.ts` exports `Route` with only `routeParams`
- [ ] `workflowStepValues` and `WorkflowStepValue` no longer exist
- [ ] No other files import these removed exports

---

### Step 5: Add "Legacy View" Navigation Item to the Sidebar

**What**: Add a fourth navigation sub-item called "Legacy View" under the Workflows collapsible section in both the expanded and collapsed sidebar.
**Why**: Users need a way to discover and navigate to the legacy workflow detail functionality.
**Confidence**: High

**Files to Modify:**
- `components/shell/app-sidebar.tsx` - Add "Legacy View" nav item in both expanded and collapsed sections

**Changes:**
- Import an appropriate icon from `lucide-react` (e.g., `ArchiveRestore` or similar)
- In expanded sidebar: Add a `NavItem` after "History" with `href` to `/workflows/old`, icon, label "Legacy View", and `isActive` checking `pathname.startsWith('/workflows/old')`
- In collapsed sidebar: Add matching entry in the `CollapsedNavMenu` items array

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] "Legacy View" appears as fourth item in expanded Workflows section
- [ ] "Legacy View" appears as fourth item in collapsed Workflows popover
- [ ] Active state detection works for `/workflows/old/*` paths

---

### Step 6: Create Legacy Workflows Index Page with Redirect

**What**: Create a minimal page at `app/(app)/workflows/old/page.tsx` that redirects to `/workflows/history`.
**Why**: The sidebar "Legacy View" nav item needs a valid `href` target. Since there is no listing page for legacy workflows, redirecting to history is the most practical approach.
**Confidence**: High

**Files to Create:**
- `app/(app)/workflows/old/page.tsx` - Redirect page

**Changes:**
- Create a page that calls `redirect()` to `/workflows/history` using `$path`

**Validation Commands:**
```bash
pnpm next-typesafe-url && pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Navigating to `/workflows/old` redirects to `/workflows/history`

---

### Step 7: Update Workflow Attention Notifier Regex

**What**: Update the `getViewedWorkflowId` function regex to match both `/workflows/{id}` and `/workflows/old/{id}`.
**Why**: Without this, users viewing a legacy workflow detail page would still receive toast notifications for the workflow they are already viewing.
**Confidence**: High

**Files to Modify:**
- `components/workflows/workflow-attention-notifier.tsx` - Update regex on line 41

**Changes:**
- Change regex from `/^\/workflows\/(\d+)$/` to `/^\/workflows\/(?:old\/)?(\d+)$/`

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Regex matches both `/workflows/123` and `/workflows/old/123`
- [ ] Regex does NOT match `/workflows/active` or `/workflows/old`

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm typecheck`
- [ ] All files pass `pnpm lint`
- [ ] `pnpm next-typesafe-url` generates valid route declarations including both `/workflows/[id]` and `/workflows/old/[id]`
- [ ] Legacy page at `/workflows/old/[id]` renders identical UI to the original page
- [ ] New blank-slate page at `/workflows/[id]` renders only breadcrumbs, ClarificationStreamProvider, and placeholder
- [ ] Sidebar "Legacy View" item appears in both expanded and collapsed states
- [ ] All existing `$path({ route: '/workflows/[id]' })` references continue working
- [ ] Workflow attention notifier correctly suppresses toasts on both route patterns

## Notes

- **No component modifications**: All existing workflow detail components remain untouched
- **No database or IPC changes**: Schema, repositories, IPC handlers, and services are unaffected
- **Eight files reference `/workflows/[id]`**: These continue linking to the new blank-slate page (intended behavior)
- **Legacy route access**: Users access legacy workflow detail pages through direct links or navigation from workflow tables

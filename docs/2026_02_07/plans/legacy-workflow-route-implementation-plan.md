# Legacy Workflow Route - Implementation Plan

**Generated**: 2026-02-07
**Original Request**: Move workflow detail page to legacy route and create placeholder

## Overview

**Estimated Duration**: 2-3 hours
**Complexity**: Low
**Risk Level**: Low

## Quick Summary

Move the existing full workflow detail page from `/workflows/[id]` to a new `/workflows/old/[id]` legacy route, then create a minimal placeholder page at the original `/workflows/[id]` path that displays only the workflow name and a "coming soon" message. A new "Legacy" nav item will be added to the Workflows section of the sidebar to provide navigation to the relocated interface.

## Prerequisites

- [ ] Confirm that no directory `app/(app)/workflows/old/` currently exists
- [ ] Confirm `pnpm lint && pnpm typecheck` passes on the current codebase before starting

## Implementation Steps

### Step 1: Create the Legacy Route Directory and Move the Existing Workflow Detail Page

**What**: Create `app/(app)/workflows/old/[id]/` directory with `route-type.ts` and `page.tsx` containing the full existing workflow detail implementation.
**Why**: This preserves the current complex workflow detail UI at a new legacy URL path so it remains accessible while the new UI is developed.
**Confidence**: High

**Files to Create:**

- `app/(app)/workflows/old/[id]/route-type.ts` - Identical copy of the current `app/(app)/workflows/[id]/route-type.ts`, containing the `workflowStepValues` constant, the `Route` object with `routeParams` (numeric coerced `id`) and `searchParams` (optional `step` enum), `RouteType` export, and `WorkflowStepValue` type
- `app/(app)/workflows/old/[id]/page.tsx` - The full existing workflow detail page implementation currently at `app/(app)/workflows/[id]/page.tsx`, with relative import of `Route` and `workflowStepValues` from `./route-type`

**Changes:**

- Copy the entire contents of `app/(app)/workflows/[id]/route-type.ts` to the new `route-type.ts` file with no modifications
- Copy the entire contents of `app/(app)/workflows/[id]/page.tsx` to the new `page.tsx` file
- All component imports (`WorkflowTopBar`, `WorkflowStepAccordion`, `WorkflowStreamingPanel`, `ClarificationStreamProvider`, `WorkflowDetailSkeleton`, `WorkflowPreStartSummary`, `QueryErrorBoundary`) remain identical using their `@/components/` aliased paths
- All hook imports (`useProject`, `useWorkflow`) remain identical using `@/hooks/queries`

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] `app/(app)/workflows/old/[id]/route-type.ts` exists with the same Zod schema as the original
- [ ] `app/(app)/workflows/old/[id]/page.tsx` exists with the full workflow detail UI
- [ ] File uses `'use client'` directive
- [ ] File uses `withParamValidation` HOC wrapping the page component
- [ ] All validation commands pass

---

### Step 2: Replace the Original Workflow Detail Page with a Minimal Placeholder

**What**: Replace the contents of `app/(app)/workflows/[id]/page.tsx` with a minimal placeholder that shows the workflow name and a "coming soon" empty state.
**Why**: The original `/workflows/[id]` URL must continue to work for all existing navigation links (workflow tables, dashboard widgets) but should now render a simplified placeholder indicating the new interface is under development.
**Confidence**: High

**Files to Modify:**

- `app/(app)/workflows/[id]/page.tsx` - Replace entire contents with a minimal placeholder page

**Files to Keep Unchanged:**

- `app/(app)/workflows/[id]/route-type.ts` - Keep the exact same Zod validation schema

**Changes:**

- Remove all imports related to the complex workflow detail components (`WorkflowTopBar`, `WorkflowStepAccordion`, `WorkflowStreamingPanel`, `ClarificationStreamProvider`, `WorkflowPreStartSummary`, `WorkflowDetailSkeleton`) and related utilities (`parseAsStringLiteral`, `useQueryState` from `nuqs`, `ChevronRight`, `Link`)
- Keep `'use client'` directive
- Keep imports: `$path` from `next-typesafe-url`, `useRouteParams` from `next-typesafe-url/app`, `withParamValidation` from `next-typesafe-url/app/hoc`, `redirect` from `next/navigation`
- Keep import of `Route` from `./route-type`
- Add import of `useWorkflow` from `@/hooks/queries`
- Add import of `QueryErrorBoundary` from `@/components/data/query-error-boundary`
- Add an appropriate icon import from `lucide-react` (such as `Construction` or `Hammer`) for the empty state visual
- Create a new `WorkflowDetailPlaceholder` component that:
  - Uses `useRouteParams(Route.routeParams)` to extract the validated `id`
  - Handles route param loading state with a simple `animate-pulse` skeleton
  - Redirects to `/workflows/history` on route param error
  - Calls `useWorkflow(workflowId)` to fetch the workflow data
  - Handles workflow loading state with a simple skeleton
  - Redirects to `/workflows/history` if workflow is not found or errors
  - Renders a centered container with the workflow name as a heading and a styled "coming soon" message
  - Wrap the content render in `QueryErrorBoundary`
- Export the component via `withParamValidation(WorkflowDetailPlaceholder, Route)`

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] `app/(app)/workflows/[id]/page.tsx` renders the workflow name and a "coming soon" message
- [ ] Page uses `withParamValidation` HOC
- [ ] Page uses `useWorkflow` hook for data fetching
- [ ] Page handles loading, error, and not-found states with redirects
- [ ] No references to the complex detail components
- [ ] All validation commands pass

---

### Step 3: Regenerate Type-Safe Route Definitions

**What**: Run `pnpm next-typesafe-url` to regenerate `_next-typesafe-url_.d.ts` so the new `/workflows/old/[id]` route is included in the type-safe router.
**Why**: The `$path()` helper and route type inference rely on the auto-generated declaration file. Without regeneration, the new legacy route will not be available for type-safe navigation.
**Confidence**: High

**Files Modified (auto-generated):**

- `_next-typesafe-url_.d.ts` - Will be regenerated to include `/workflows/old/[id]` in the `DynamicRouter` interface

**Changes:**

- Execute the `pnpm next-typesafe-url` command
- Verify the generated file contains a new entry in `DynamicRouter` for `"/workflows/old/[id]"`
- The existing `"/workflows/[id]"` entry must remain unchanged

**Validation Commands:**

```bash
pnpm next-typesafe-url
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] `_next-typesafe-url_.d.ts` contains `"/workflows/old/[id]"` in the `DynamicRouter` interface
- [ ] `_next-typesafe-url_.d.ts` still contains `"/workflows/[id]"` in the `DynamicRouter` interface
- [ ] All validation commands pass

---

### Step 4: Add Legacy Nav Item to the Sidebar Workflows Section

**What**: Add a fourth "Legacy" nav item to the collapsible Workflows section in the app sidebar, linking to the legacy workflow detail entry point.
**Why**: Users need an intuitive way to access the relocated legacy workflow detail interface from the main navigation.
**Confidence**: High

**Files to Modify:**

- `components/shell/app-sidebar.tsx` - Add "Legacy" nav item to both the collapsed and expanded Workflows sections

**Changes:**

- Add `FolderArchive` to the existing `lucide-react` icon imports (alphabetically)
- In the **collapsed sidebar** branch (the `CollapsedNavMenu` for Workflows): add a fourth item to the `items` array after the History entry, with `href` set to `/workflows/old/active`, `FolderArchive` icon, and `isActive` checking if `pathname` starts with `/workflows/old`. Label: `'Legacy'`
- In the **expanded sidebar** branch (the `Collapsible` for Workflows): add a fourth `NavItem` after the History `NavItem`, with `href` of `/workflows/old/active`, `icon` of `FolderArchive`, `isActive` checking `pathname.startsWith('/workflows/old')`, `isCollapsed` set to `false`, `isNested` set to `true`, and `label` of `'Legacy'`
- Note: `isWorkflowsActive` already covers `/workflows/old` paths since `WORKFLOWS_BASE_PATH` is `/workflows` and the check uses `startsWith`

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] "Legacy" nav item appears below "History" in the expanded Workflows section
- [ ] "Legacy" nav item appears in the `CollapsedNavMenu` items array for collapsed sidebar
- [ ] `FolderArchive` icon is used for the Legacy nav item
- [ ] Active state detection correctly highlights when on a `/workflows/old` path
- [ ] All validation commands pass

---

### Step 5: Verify End-to-End Navigation Integrity

**What**: Review all existing workflow navigation links to confirm they still target `/workflows/[id]` (the placeholder) and have not been inadvertently changed.
**Why**: This verification confirms no navigation references were broken.
**Confidence**: High

**Files to Review (no modifications):**

- `app/(app)/workflows/active/page.tsx` - Confirm navigation to `/workflows/[id]` unchanged
- `app/(app)/workflows/created/page.tsx` - Confirm navigation to `/workflows/[id]` unchanged
- `app/(app)/workflows/history/page.tsx` - Confirm navigation to `/workflows/[id]` unchanged
- `components/workflows/workflows-tab-content.tsx` - Confirm navigation targets unchanged
- `components/dashboard/active-workflows-widget.tsx` - Confirm navigation targets unchanged
- `components/dashboard/recent-workflows-widget.tsx` - Confirm navigation targets unchanged

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] All workflow list pages still navigate to `/workflows/[id]` (the placeholder)
- [ ] No file references `/workflows/old/[id]` except the sidebar Legacy nav item
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm typecheck`
- [ ] All files pass `pnpm lint`
- [ ] `_next-typesafe-url_.d.ts` includes both `/workflows/[id]` and `/workflows/old/[id]` routes
- [ ] Legacy page at `/workflows/old/[id]` renders full workflow detail UI with step accordion, streaming panel, and clarification support
- [ ] Placeholder page at `/workflows/[id]` renders workflow name and "coming soon" message only
- [ ] Sidebar shows four items under Workflows: Active, Created, History, Legacy
- [ ] Existing navigation from workflow tables and dashboard widgets continues to target `/workflows/[id]`

## Notes

- **No list page at `/workflows/old/`**: The Legacy sidebar nav item links to `/workflows/old/active` which does not have a corresponding page. This is acceptable as a forward-compatible placeholder href. Consider creating a minimal redirect page later if needed.
- **Route type duplication**: The `route-type.ts` file is duplicated between `/workflows/[id]/` and `/workflows/old/[id]/`. Both are identical. If the schema needs to change, consider extracting to a shared location.
- **No modifications to workflow components**: All components in `components/workflows/detail/` remain untouched. They are imported by the legacy page with the same aliased imports.
- **`$path` type safety for legacy nav**: Since `/workflows/old/active` is not a registered static route, the sidebar nav item uses a hardcoded string path rather than `$path()`. Once a list page is created at that path, the link can be updated to use `$path()`.

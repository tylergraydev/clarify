# Phase 1: Page Shell & Navigation - Implementation Plan

Generated: 2026-02-01
Original Request: Phase 1 from workflow-implementation-phases.md
Refined Request: Implement foundational workflow navigation structure with placeholder pages and breadcrumb navigation

## Analysis Summary

- Feature request refined with project context
- Discovered 36 files across 15+ directories
- Generated 8-step implementation plan

## File Discovery Results

### Files to Create (7)

| File | Purpose |
|------|---------|
| `app/(app)/workflows/[id]/page.tsx` | Workflow detail page with breadcrumb |
| `app/(app)/workflows/[id]/route-type.ts` | Route type with Zod ID validation |
| `app/(app)/workflows/active/page.tsx` | Active workflows placeholder page |
| `app/(app)/workflows/history/page.tsx` | Workflow history placeholder page |
| `app/(app)/workflows/history/route-type.ts` | Route type for future search params |

### Files to Modify (2)

| File | Purpose |
|------|---------|
| `components/shell/app-sidebar.tsx` | Add Workflows section with collapsible nav |
| `components/workflows/workflows-tab-content.tsx` | Verify navigation integration |

### Key Pattern Files

| File | Pattern |
|------|---------|
| `app/(app)/projects/[id]/page.tsx` | Breadcrumb navigation pattern |
| `app/(app)/projects/[id]/route-type.ts` | Zod route validation pattern |
| `components/shell/nav-item.tsx` | Sidebar navigation item pattern |
| `components/ui/collapsible.tsx` | Collapsible section pattern |

---

## Implementation Plan

### Overview

**Estimated Duration**: 3-4 hours
**Complexity**: Low
**Risk Level**: Low

### Quick Summary

This plan implements the foundational workflow navigation structure for Clarify by creating three new route pages (`/workflows/[id]`, `/workflows/active`, `/workflows/history`), adding a collapsible Workflows section to the sidebar with Active and History links, and integrating breadcrumb navigation on the workflow detail page that displays "Projects > [Project Name] > Workflows > [Workflow Name]".

### Prerequisites

- [ ] Ensure development environment is running (`pnpm dev` or `pnpm electron:dev`)
- [ ] Verify `next-typesafe-url` CLI is available (`pnpm next-typesafe-url`)
- [ ] Confirm existing query hooks (`useWorkflow`, `useProject`) are functional

---

### Step 1: Create Workflow Detail Page Route Type

**What**: Create the route-type.ts file for the `/workflows/[id]` dynamic route with numeric ID validation.
**Why**: Required for type-safe route parameters following project conventions. The ID must use `z.coerce.number().int().positive()` for proper validation.
**Confidence**: High

**Files to Create:**

- `app/(app)/workflows/[id]/route-type.ts` - Route type with Zod schema for workflow ID validation

**Changes:**

- Define `Route` object with `routeParams` containing numeric ID validation using `z.coerce.number().int().positive()`
- Use `satisfies DynamicRoute` type constraint
- Export `RouteType` type alias

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] File exists at correct path
- [ ] Uses `z.coerce.number().int().positive()` for ID validation
- [ ] Includes `satisfies DynamicRoute` type constraint
- [ ] All validation commands pass

---

### Step 2: Create Workflow Detail Placeholder Page

**What**: Create the placeholder page for `/workflows/[id]` with breadcrumb navigation displaying "Projects > [Project Name] > Workflows > [Workflow Name]".
**Why**: This page serves as the landing destination when users click a workflow row from the project detail page. The breadcrumb provides navigation context.
**Confidence**: High

**Files to Create:**

- `app/(app)/workflows/[id]/page.tsx` - Workflow detail page with breadcrumb and h1 placeholder

**Changes:**

- Add `'use client'` directive (required for Electron IPC)
- Import routing utilities: `$path`, `useRouteParams`, `withParamValidation`
- Import hooks: `useWorkflow`, `useProject`
- Import Link, redirect, ChevronRight icon
- Implement breadcrumb navigation following project detail page pattern (nav with aria-label="Breadcrumb", text-sm text-muted-foreground styling, ChevronRight dividers)
- Fetch workflow data using `useWorkflow(id)` to get workflow name and projectId
- Fetch project data using `useProject(projectId)` to get project name for breadcrumb
- Add placeholder h1 heading "Workflow: [Workflow Name]"
- Handle loading and error states
- Wrap with `withParamValidation` HOC

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Page renders at `/workflows/[id]` route
- [ ] Breadcrumb displays "Projects > [Project Name] > Workflows > [Workflow Name]"
- [ ] Projects link navigates to `/projects`
- [ ] Project name link navigates to `/projects/[id]`
- [ ] "Workflows" text is static (no link - stays on current context)
- [ ] Current workflow name is displayed without link
- [ ] Loading and error states handled
- [ ] All validation commands pass

---

### Step 3: Create Active Workflows Placeholder Page

**What**: Create the placeholder page for `/workflows/active` displaying an h1 heading.
**Why**: Serves as the sidebar navigation destination for viewing active workflows.
**Confidence**: High

**Files to Create:**

- `app/(app)/workflows/active/page.tsx` - Active workflows placeholder page

**Changes:**

- Add `'use client'` directive
- Create simple page component with main element and h1 "Active Workflows"
- Follow existing page structure patterns (main with aria-label, space-y-6 class)

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Page renders at `/workflows/active` route
- [ ] Displays h1 heading "Active Workflows"
- [ ] Follows existing page structure patterns
- [ ] All validation commands pass

---

### Step 4: Create Workflow History Placeholder Page and Route Type

**What**: Create the placeholder page and route type for `/workflows/history` with potential for future search params.
**Why**: Serves as the sidebar navigation destination for viewing workflow history. Route type prepares for future filtering capabilities.
**Confidence**: High

**Files to Create:**

- `app/(app)/workflows/history/page.tsx` - History placeholder page
- `app/(app)/workflows/history/route-type.ts` - Route type for future search params

**Changes:**

- Create route-type.ts with empty searchParams schema (prepares for future filters)
- Add `'use client'` directive to page
- Create simple page component with main element and h1 "Workflow History"
- Follow existing page structure patterns

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Page renders at `/workflows/history` route
- [ ] Displays h1 heading "Workflow History"
- [ ] Route type file exists with `satisfies DynamicRoute`
- [ ] All validation commands pass

---

### Step 5: Regenerate Type-Safe URL Types

**What**: Run the next-typesafe-url CLI to regenerate route types after creating new route-type.ts files.
**Why**: Required to ensure TypeScript recognizes the new routes for type-safe `$path()` calls.
**Confidence**: High

**Files to Modify:**

- Auto-generated type files updated by CLI

**Changes:**

- Run `pnpm next-typesafe-url` to regenerate types
- Verify new routes appear in generated types

**Validation Commands:**

```bash
pnpm next-typesafe-url
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] CLI completes without errors
- [ ] New routes recognized in type system
- [ ] `$path({ route: '/workflows/[id]', routeParams: { id: number } })` compiles
- [ ] `$path({ route: '/workflows/active' })` compiles
- [ ] `$path({ route: '/workflows/history' })` compiles
- [ ] All validation commands pass

---

### Step 6: Add Workflows Section to App Sidebar

**What**: Extend app-sidebar.tsx to include a collapsible Workflows section with Active and History navigation items.
**Why**: Provides primary navigation access to workflow pages from the sidebar, positioned after Projects and before the Agents separator.
**Confidence**: High

**Files to Modify:**

- `components/shell/app-sidebar.tsx` - Add Workflows section with collapsible navigation

**Changes:**

- Import Collapsible components: `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`
- Import workflow-related icons from lucide-react: `Workflow`, `Play`, `History`
- Add new collapsible Workflows section between Projects NavItem and the Separator before Agents
- Add CollapsibleTrigger with Workflow icon and "Workflows" label
- Add CollapsibleContent containing two NavItems:
  - "Active" linking to `/workflows/active` with Play icon
  - "History" linking to `/workflows/history` with History icon
- Use `isNested` prop on nested NavItems for proper indentation styling
- Handle collapsed sidebar state for collapsible section display

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Workflows section appears after Projects in sidebar
- [ ] Section is collapsible with chevron indicator
- [ ] Active link navigates to `/workflows/active`
- [ ] History link navigates to `/workflows/history`
- [ ] Active states work correctly for nested items
- [ ] Collapsed sidebar shows tooltip on hover
- [ ] All validation commands pass

---

### Step 7: Verify Workflow Row Navigation Integration

**What**: Verify that the existing `WorkflowsTabContent` component correctly routes to `/workflows/[id]` when clicking workflow rows.
**Why**: The component already has `handleViewDetails` implemented. This step confirms the integration works with the new route.
**Confidence**: High

**Files to Modify:**

- `components/workflows/workflows-tab-content.tsx` - Verify and potentially fix the routeParams type

**Changes:**

- Review existing `handleViewDetails` callback implementation
- Verify the `$path` call uses correct routeParams format (id should be number, not string - current code uses `String(workflowId)` which may need adjustment based on route-type definition)
- If route-type uses `z.coerce.number()`, the string conversion is unnecessary and can be removed for consistency

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Clicking workflow row navigates to `/workflows/[id]` with correct ID
- [ ] No TypeScript errors with $path usage
- [ ] Navigation works bidirectionally (can return via breadcrumb)
- [ ] All validation commands pass

---

### Step 8: Manual Navigation Testing

**What**: Perform manual end-to-end testing of all navigation paths.
**Why**: Ensures all navigation flows work correctly before considering the feature complete.
**Confidence**: High

**Files to Modify:**

- None (manual testing only)

**Changes:**

- Test sidebar navigation to /workflows/active
- Test sidebar navigation to /workflows/history
- Test workflow row click from project detail page to /workflows/[id]
- Test breadcrumb navigation from workflow detail page back to project
- Test breadcrumb navigation from workflow detail page back to projects list

**Validation Commands:**

```bash
pnpm electron:dev
```

**Success Criteria:**

- [ ] Sidebar > Workflows > Active navigates correctly
- [ ] Sidebar > Workflows > History navigates correctly
- [ ] Project > Workflows tab > Row click navigates to workflow detail
- [ ] Workflow detail breadcrumb "Projects" links to /projects
- [ ] Workflow detail breadcrumb "[Project Name]" links to /projects/[id]
- [ ] All pages display their placeholder h1 headings

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm typecheck`
- [ ] All files pass `pnpm lint`
- [ ] Route types generated successfully via `pnpm next-typesafe-url`
- [ ] All navigation paths verified manually in Electron dev mode

## Notes

- The `WorkflowsTabContent` component at line 87 uses `String(workflowId)` in routeParams. Since the route-type uses `z.coerce.number()`, this string coercion is acceptable (Zod will coerce it back), but for consistency the implementer may choose to pass the number directly.
- The collapsible sidebar section may need special handling when the sidebar is collapsed - consider whether to show the nested items in a tooltip/popover or hide them entirely.
- The workflow detail page needs to handle the case where the workflow has no associated project (projectId could be null).
- Future enhancements may add route-type search params to `/workflows/history` for filtering by date range, status, etc.

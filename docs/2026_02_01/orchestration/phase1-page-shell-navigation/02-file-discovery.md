# Step 2: AI-Powered File Discovery

## Step Metadata

| Field | Value |
|-------|-------|
| Started | 2026-02-01T00:03:00.000Z |
| Completed | 2026-02-01T00:04:30.000Z |
| Duration | ~90s |
| Status | Completed |

## Refined Request Used

Implement the foundational workflow navigation structure for Clarify by creating three new route pages in the app/(app)/ route group: /workflows/[id]/page.tsx for workflow detail views, /workflows/active/page.tsx for active workflows listing, and /workflows/history/page.tsx for workflow history, each as placeholder pages displaying their respective titles via h1 headings with no functional content yet. Add a breadcrumb navigation component to the workflow detail page following the existing pattern from the project detail page (using ChevronRight dividers with semantic nav aria-label, styled with text-sm text-muted-foreground, and linking back through the navigation chain), displaying "Projects > [Project Name] > Workflows > [Workflow Name]" with the appropriate type-safe routes via next-typesafe-url's $path helper. Extend the app-sidebar.tsx component to include two new NavItem links under a collapsible Workflows section: "Active" (linking to /workflows/active) and "History" (linking to /workflows/history), positioned after the Projects section and before the Agents separator. Integrate workflow row navigation into the existing WorkflowsTabContent component on the project detail page by connecting the onViewDetails callback to route to /workflows/[id] with type-safe route parameters, allowing users to click any workflow row and navigate to its detail page. Ensure all route type files use next-typesafe-url conventions with proper Zod validation schemas, maintain consistent styling with existing pages using the project's Base UI + Tailwind design system, and validate that navigation works bidirectionally—from project workflows tab to workflow detail, from sidebar to active/history pages, and breadcrumbs link back to parent pages—without adding any functional features, data displays, or UI beyond basic placeholder content.

## Discovery Summary

Total files discovered: 36
- Critical: 9 files (7 CREATE, 2 MODIFY)
- High: 10 files
- Medium: 10 files
- Low: 7 files

## Critical Priority (Must Create/Modify)

| File | Action | Reason |
|------|--------|--------|
| `app/(app)/workflows/[id]/page.tsx` | CREATE | Workflow detail page - the main destination for viewing individual workflows. Must display placeholder h1 heading and breadcrumb navigation. |
| `app/(app)/workflows/[id]/route-type.ts` | CREATE | Route type definition for dynamic workflow ID parameter with Zod validation for type-safe routing. |
| `app/(app)/workflows/active/page.tsx` | CREATE | Active workflows page - displays h1 heading placeholder for the active workflows list. Static route, no route-type needed. |
| `app/(app)/workflows/history/page.tsx` | CREATE | Workflow history page - displays h1 heading placeholder for workflow history. |
| `app/(app)/workflows/history/route-type.ts` | CREATE | Route type definition for workflow history page - already referenced in generated types file. |
| `components/shell/app-sidebar.tsx` | MODIFY | Must add Workflows section with collapsible navigation containing "Active" and "History" NavItem links. |
| `components/workflows/workflows-tab-content.tsx` | MODIFY | onViewDetails callback already implemented - verify and ensure integration works. |
| `_next-typesafe-url_.d.ts` | REFERENCE | Generated types file showing existing workflow route definitions. Need to regenerate after creating route-type files. |
| `next-typesafe-url.config.ts` | REFERENCE | Configuration file showing filename convention `route-type` is used for route type files. |

## High Priority (Essential Patterns)

| File | Action | Reason |
|------|--------|--------|
| `app/(app)/projects/[id]/page.tsx` | REFERENCE | **Primary pattern file** - Contains exact breadcrumb pattern with ChevronRight, nav aria-label, text-sm text-muted-foreground, Link components with $path() helper. |
| `app/(app)/projects/[id]/route-type.ts` | REFERENCE | Pattern for dynamic route ID validation - uses z.coerce.number().int().positive() for ID parameter. |
| `components/shell/nav-item.tsx` | REFERENCE | NavItem component used in sidebar. Supports href, icon, isActive, isCollapsed, label, isNested props. |
| `components/ui/collapsible.tsx` | REFERENCE | Collapsible component for creating expandable Workflows section in sidebar. |
| `app/(app)/dashboard/page.tsx` | REFERENCE | Simple page structure pattern for static pages (active/history). |
| `app/(app)/settings/page.tsx` | REFERENCE | Simple placeholder page pattern with minimal content. |
| `hooks/queries/use-workflows.ts` | REFERENCE | Workflow data hooks including useWorkflow(id) for fetching single workflow data. |
| `hooks/queries/use-projects.ts` | REFERENCE | Project data hooks including useProject(id) for fetching project name for breadcrumb. |
| `.claude/skills/nextjs-routing-conventions/references/NextJS-Routing-Conventions.md` | REFERENCE | Comprehensive routing conventions document. |
| `components/projects/project-not-found.tsx` | REFERENCE | Error state pattern with breadcrumb navigation. |

## Medium Priority (Secondary)

| File | Action | Reason |
|------|--------|--------|
| `app/(app)/layout.tsx` | REFERENCE | App shell layout showing sidebar integration and main content area structure. |
| `components/workflows/workflow-table.tsx` | REFERENCE | WorkflowTable component showing onViewDetails callback pattern. |
| `lib/queries/workflows.ts` | REFERENCE | Query key factory for workflows. |
| `lib/stores/shell-store.ts` | REFERENCE | Shell state store for sidebar collapse state. |
| `components/ui/separator.tsx` | REFERENCE | Separator component used between navigation sections. |
| `types/electron.d.ts` | REFERENCE | Type definitions including Workflow type. |
| `db/schema/workflows.schema.ts` | REFERENCE | Workflow schema definition showing available fields. |
| `app/(app)/projects/page.tsx` | REFERENCE | Projects list page pattern. |
| `components/dashboard/active-workflows-widget.tsx` | REFERENCE | Shows workflow navigation pattern using $path(). |
| `app/(app)/projects/route-type.ts` | REFERENCE | Pattern for search params definition. |

## Low Priority (Context)

| File | Action | Reason |
|------|--------|--------|
| `app/(app)/agents/page.tsx` | REFERENCE | Full page implementation example. |
| `components/shell/status-bar.tsx` | REFERENCE | Status bar context. |
| `components/shell/app-header.tsx` | REFERENCE | App header component context. |
| `lib/utils.ts` | REFERENCE | Utility functions including cn(). |
| `components/ui/empty-state.tsx` | REFERENCE | EmptyState component if needed. |
| `app/page.tsx` | REFERENCE | Root redirect pattern. |
| `components/workflows/index.ts` | REFERENCE | Barrel export file. |

## Architecture Insights

### Key Patterns Discovered

1. **Breadcrumb Navigation Pattern** (from `projects/[id]/page.tsx` lines 139-148):
```tsx
<nav aria-label={'Breadcrumb'} className={'flex items-center gap-2'}>
  <Link
    className={'text-sm text-muted-foreground transition-colors hover:text-foreground'}
    href={$path({ route: '/projects' })}
  >
    {'Projects'}
  </Link>
  <ChevronRight aria-hidden={'true'} className={'size-4 text-muted-foreground'} />
  <span className={'text-sm text-foreground'}>{project.name}</span>
</nav>
```

2. **Route Type Pattern** (from `projects/[id]/route-type.ts`):
```tsx
import type { DynamicRoute } from 'next-typesafe-url';
import { z } from 'zod';

export const Route = {
  routeParams: z.object({
    id: z.coerce.number().int().positive(),
  }),
} satisfies DynamicRoute;
```

3. **Sidebar Navigation Pattern** (from `app-sidebar.tsx`):
- Uses `NavItem` components with `$path()` for type-safe routing
- Uses `Separator` between navigation groups
- `isPathActive()` helper for determining active state
- Support for `isSidebarCollapsed` state

4. **Existing Route Navigation** (from `workflows-tab-content.tsx` line 82-91):
- Already routes to `/workflows/[id]` with proper type-safe params
- Uses `String()` conversion for ID param

### Integration Points

1. **WorkflowsTabContent to Workflow Detail**: Already implemented via `handleViewDetails` callback
2. **Sidebar to Active/History Pages**: Need to add NavItem links in new Workflows section
3. **Workflow Detail Breadcrumb**: Needs to fetch both workflow and project data for breadcrumb chain

### Potential Challenges

1. **Breadcrumb Data Fetching**: Workflow detail page needs to fetch both workflow data (for name) and project data (for project name in breadcrumb chain).

2. **Collapsible Sidebar Section**: The current sidebar doesn't use collapsible sections - this will be a new pattern.

3. **Route Type ID Coercion**: The `workflows-tab-content.tsx` passes `String(workflowId)` while the route-type should use `z.coerce.number()`. This should work correctly as Zod coercion handles string-to-number conversion.

## File Path Validation

All discovered file paths were validated against the existing codebase structure. Files marked as CREATE do not currently exist. Files marked as MODIFY or REFERENCE exist and are accessible.

## Discovery Statistics

- Directories scanned: 15+
- Pattern files identified: 10
- Integration points: 3
- Potential challenges: 3

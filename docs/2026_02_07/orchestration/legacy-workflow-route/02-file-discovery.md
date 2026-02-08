# Step 2: File Discovery

**Status**: Completed
**Files Discovered**: 24 files across 8 directories

## Critical (Directly Modified/Created)

- `app/(app)/workflows/[id]/page.tsx` - Current full workflow detail page (to be moved to legacy)
- `app/(app)/workflows/[id]/route-type.ts` - Route type definition with Zod validation (to be copied)
- `components/shell/app-sidebar.tsx` - Sidebar navigation (add Legacy nav item)

## High Priority (Reference for Patterns)

- `components/shell/nav-item.tsx` - NavItem component with CVA variants
- `components/shell/collapsed-nav-menu.tsx` - CollapsedNavMenu for collapsed sidebar
- `app/(app)/workflows/history/route-type.ts` - Example route-type pattern

## Medium Priority (Context, Not Modified)

- `components/workflows/detail/index.ts` - Barrel exports for detail components
- `_next-typesafe-url_.d.ts` - Auto-generated type-safe URL definitions (regenerated)
- `hooks/queries/use-workflows.ts` - Workflow query hooks
- `lib/stores/workflow-detail-store.ts` - Zustand store for workflow detail UI state

## Low Priority (Reference Only)

- `app/(app)/workflows/active/page.tsx` - Links to /workflows/[id], unchanged
- `app/(app)/workflows/created/page.tsx` - Links to /workflows/[id], unchanged
- `app/(app)/workflows/history/page.tsx` - Links to /workflows/[id], unchanged
- `components/workflows/workflows-tab-content.tsx` - Links to /workflows/[id], unchanged
- `components/dashboard/active-workflows-widget.tsx` - Links to /workflows/[id], unchanged
- `components/dashboard/recent-workflows-widget.tsx` - Links to /workflows/[id], unchanged
- `components/projects/overview/project-activity-card.tsx` - Links to /workflows/[id], unchanged
- 14 files in `components/workflows/detail/` - All workflow detail components (unchanged)

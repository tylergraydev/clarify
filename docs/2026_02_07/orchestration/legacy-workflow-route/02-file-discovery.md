# Step 2: File Discovery

**Status**: Completed
**Timestamp**: 2026-02-07
**Duration**: ~179s
**Files Discovered**: 24+ files across 12 directories

## Discovery Summary

### Critical Priority (Must Create or Modify)

| File | Action | Reason |
|------|--------|--------|
| `app/(app)/workflows/[id]/page.tsx` | Replace | Replace with blank-slate page keeping only breadcrumbs + ClarificationStreamProvider |
| `app/(app)/workflows/[id]/route-type.ts` | Keep/Review | Type-safe route definition - may simplify if `step` search param not needed |
| `components/shell/app-sidebar.tsx` | Modify | Add "Legacy View" nav item under Workflows collapsible section |

### High Priority (Must Create - New Files)

| File | Action | Reason |
|------|--------|--------|
| `app/(app)/workflows/old/[id]/page.tsx` | Create | Copy of current workflow detail page with all functionality |
| `app/(app)/workflows/old/[id]/route-type.ts` | Create | Route type definition for legacy route (same params schema) |
| `_next-typesafe-url_.d.ts` | Regenerate | Auto-generated after `bun next-typesafe-url` |

### Medium Priority (May Need Modification)

| File | Action | Reason |
|------|--------|--------|
| `components/shell/collapsed-nav-menu.tsx` | Review | Legacy View item may need to appear in collapsed sidebar menu |
| `components/workflows/workflow-attention-notifier.tsx` | Update | Regex `/^\/workflows\/(\d+)$/` won't match legacy route `/workflows/old/123` |
| `components/workflows/detail/clarification-stream-provider.tsx` | Reference | Must be imported in new blank-slate page (no changes to component) |
| `components/workflows/detail/index.ts` | Reference | Barrel export used by legacy page (no changes) |

### Low Priority (Reference Only)

| File | Reason |
|------|--------|
| `hooks/queries/use-workflows.ts` | Contains `useWorkflow` hook - no changes |
| `hooks/queries/index.ts` | Barrel export for query hooks - no changes |
| `hooks/use-clarification-stream.ts` | Underlying hook for ClarificationStreamProvider - no changes |
| `lib/stores/workflow-detail-store.ts` | Zustand store for workflow detail - no changes |
| `lib/stores/clarification-slice.ts` | Clarification slice - no changes |
| `lib/stores/shell-store.ts` | Shell store - no changes |
| `components/data/query-error-boundary.tsx` | Error boundary - no changes |
| `app/globals.css` | CSS variable for workflow layout - no changes |
| `lib/layout/constants.ts` | Layout constants - no changes |
| `next-typesafe-url.config.ts` | Config for route type generation - no changes |
| `app/(app)/layout.tsx` | App shell layout - no changes |
| `components/workflows/detail/workflow-detail-skeleton.tsx` | Loading skeleton - no changes |
| `components/workflows/detail/workflow-top-bar.tsx` | Top bar component - no changes |

## Architecture Insights

- **Type-Safe Routing**: `next-typesafe-url` generates `route-type.ts` files for each dynamic route. After adding `old/[id]/`, `bun next-typesafe-url` regenerates the type declarations.
- **Sidebar Pattern**: Both expanded (`NavItem` in `CollapsibleContent`) and collapsed (`CollapsedNavMenu` items array) must be updated.
- **Attention Notifier**: The regex at line 41 of `workflow-attention-notifier.tsx` should be updated to match both `/workflows/{id}` and `/workflows/old/{id}`.
- **Eight files** reference `/workflows/[id]` via `$path()` - none need changes since they should link to the new blank-slate page.

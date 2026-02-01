# Phase 1: Page Shell & Navigation - Routing Table

**Date**: 2026-02-01

## Routing Table

| Step | Title | Specialist | Files |
|------|-------|------------|-------|
| 1 | Create Workflow Detail Page Route Type | `page-route` | `app/(app)/workflows/[id]/route-type.ts` |
| 2 | Create Workflow Detail Placeholder Page | `page-route` | `app/(app)/workflows/[id]/page.tsx` |
| 3 | Create Active Workflows Placeholder Page | `page-route` | `app/(app)/workflows/active/page.tsx` |
| 4 | Create Workflow History Placeholder Page and Route Type | `page-route` | `app/(app)/workflows/history/page.tsx`, `app/(app)/workflows/history/route-type.ts` |
| 5 | Regenerate Type-Safe URL Types | `general-purpose` | Auto-generated type files |
| 6 | Add Workflows Section to App Sidebar | `frontend-component` | `components/shell/app-sidebar.tsx` |
| 7 | Verify Workflow Row Navigation Integration | `frontend-component` | `components/workflows/workflows-tab-content.tsx` |
| 8 | Manual Navigation Testing | `general-purpose` | None (manual testing) |

## Agent Assignment Rationale

- **Steps 1-4**: `page-route` agent handles Next.js App Router pages, layouts, and route types
- **Step 5**: `general-purpose` for CLI execution (pnpm next-typesafe-url)
- **Steps 6-7**: `frontend-component` agent handles React component modifications
- **Step 8**: `general-purpose` for manual testing guidance

## Milestone

`MILESTONE:PHASE_2_COMPLETE`

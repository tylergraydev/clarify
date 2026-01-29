# Setup and Routing Table

## Routing Table

| Step | Title | Specialist Agent | Files |
|------|-------|------------------|-------|
| 1 | Create Active Workflows Widget | `frontend-component` | `app/(app)/dashboard/_components/active-workflows-widget.tsx` |
| 2 | Create Recent Workflows Widget | `frontend-component` | `app/(app)/dashboard/_components/recent-workflows-widget.tsx` |
| 3 | Create Statistics Widget | `frontend-component` | `app/(app)/dashboard/_components/statistics-widget.tsx` |
| 4 | Create Quick Actions Widget | `frontend-component` | `app/(app)/dashboard/_components/quick-actions-widget.tsx` |
| 5 | Compose Dashboard Page | `general-purpose` | `app/(app)/dashboard/page.tsx` |
| 6 | Implement Shared Types and Utilities | `general-purpose` | `app/(app)/dashboard/_types/index.ts`, `app/(app)/dashboard/_utils/index.ts` |
| 7 | Add Navigation Integration | `frontend-component` | `app/(app)/dashboard/_components/active-workflows-widget.tsx`, `app/(app)/dashboard/_components/recent-workflows-widget.tsx` |
| 8 | Implement Loading and Error States | `frontend-component` | `app/(app)/dashboard/_components/active-workflows-widget.tsx`, `app/(app)/dashboard/_components/recent-workflows-widget.tsx`, `app/(app)/dashboard/_components/statistics-widget.tsx` |

## Specialist Assignment Rationale

- **Steps 1-4**: Widget components are UI feature components → `frontend-component`
- **Step 5**: Page composition involves Next.js page routing → `general-purpose`
- **Step 6**: Types and utilities are non-component code → `general-purpose`
- **Steps 7-8**: Modifying existing widget components → `frontend-component`

## Execution Order

Steps 6 (types/utilities) should logically come before Steps 1-4, but the plan order will be preserved. The specialist agents can create inline types as needed and refactor in Step 6.

## Working Directory

All implementation will occur in: `C:\Users\jasonpaff\dev\clarify\.worktrees\dashboard-ui`

## Phase 2 Status: COMPLETE

**MILESTONE:PHASE_2_COMPLETE**

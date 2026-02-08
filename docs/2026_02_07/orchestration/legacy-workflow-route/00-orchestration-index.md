# Legacy Workflow Route - Orchestration Index

**Feature**: Move workflow detail page to legacy route and create new blank-slate page
**Started**: 2026-02-07
**Status**: In Progress

## Workflow Steps

1. [Clarification](./00a-clarification.md) - Skipped (request scored 5/5)
2. [Feature Refinement](./01-feature-refinement.md) - Pending
3. [File Discovery](./02-file-discovery.md) - Pending
4. [Implementation Planning](./03-implementation-planning.md) - Pending

## Original Request

Move the existing workflow detail page at app/(app)/workflows/[id]/page.tsx to a new legacy route at app/(app)/workflows/old/[id]/page.tsx, preserving all its current functionality. Replace the current page with a new blank-slate page retaining only breadcrumbs and the clarification-stream-provider wrapper. Add a "Legacy View" navigation item to the sidebar.

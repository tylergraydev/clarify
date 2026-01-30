# Active Workflows Page UI - Orchestration Index

## Workflow Overview

**Feature**: Active Workflows Page UI
**Date**: 2026-01-29
**Status**: Completed

## Original Request

Create active workflows page showing running/paused workflows with real-time status updates, quick actions (pause/resume/cancel), and progress indicators.

## Orchestration Steps

| Step | Name                    | Status        | Output File                                                      |
| ---- | ----------------------- | ------------- | ---------------------------------------------------------------- |
| 0a   | Clarification           | Skipped (5/5) | [00a-clarification.md](./00a-clarification.md)                   |
| 1    | Feature Refinement      | Completed     | [01-feature-refinement.md](./01-feature-refinement.md)           |
| 2    | File Discovery          | Completed     | [02-file-discovery.md](./02-file-discovery.md)                   |
| 3    | Implementation Planning | Completed     | [03-implementation-planning.md](./03-implementation-planning.md) |

## Summary

- **Clarification**: Skipped - request was sufficiently detailed (Score 5/5) with existing design document and reference implementation
- **Refinement**: Enhanced to ~320 words with TanStack Query polling, responsive grid, and empty state details
- **Discovery**: Found 24 relevant files across Critical/High/Medium/Low priorities
- **Planning**: Generated 7-step implementation plan with 4-6 hour estimated duration

## Navigation

- [Clarification](./00a-clarification.md)
- [Feature Refinement](./01-feature-refinement.md)
- [File Discovery](./02-file-discovery.md)
- [Implementation Planning](./03-implementation-planning.md)

## Final Output

- **Implementation Plan**: [`docs/2026_01_29/plans/active-workflows-page-implementation-plan.md`](../plans/active-workflows-page-implementation-plan.md)

## Key Decisions

1. **Real-time Updates**: Use TanStack Query `refetchInterval` (5 seconds) for polling
2. **Active Statuses**: Filter by `running`, `paused`, `editing`
3. **Component Structure**: Create dedicated `ActiveWorkflowCard` with pause/resume controls
4. **Reuse Patterns**: Leverage existing `WorkflowCard`, mutation hooks, and dashboard widget patterns

## Files to Create

1. `app/(app)/workflows/active/_components/active-workflow-card.tsx`
2. `app/(app)/workflows/active/_components/active-workflow-card-skeleton.tsx`

## Files to Modify

1. `app/(app)/workflows/active/page.tsx` - Main page implementation
2. `hooks/queries/use-workflows.ts` - Add `useActiveWorkflows` hook
3. `lib/queries/workflows.ts` - Query key factory (if needed)

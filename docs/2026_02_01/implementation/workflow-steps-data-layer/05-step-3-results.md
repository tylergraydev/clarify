# Step 3 Results: Enhance useStartWorkflow Hook with Step Cache Invalidation

**Specialist**: tanstack-query
**Status**: ✅ Success

## Changes Made

**Files Modified**:
- `hooks/queries/use-workflows.ts` - Added `stepKeys` import and step cache invalidation to `useStartWorkflow` mutation

## Implementation Details

When `useStartWorkflow` succeeds, two invalidation calls are made:
1. `stepKeys.byWorkflow(workflow.id)` - Invalidates the specific workflow's steps query
2. `stepKeys.list._def` - Invalidates any general step list queries

This ensures the pipeline view component (which uses `useStepsByWorkflow`) will automatically refetch and display the 4 planning steps created when a workflow starts.

**TanStack Query conventions enforced**:
- Imported `stepKeys` from `@/lib/queries/steps` following project import ordering
- Used `void` prefix for invalidation promises
- Used `_def` property for base key invalidation
- Used `.queryKey` accessor for specific workflow step invalidation

## Validation Results

- ✅ pnpm lint: PASS
- ✅ pnpm typecheck: PASS

## Success Criteria

- [x] `useStartWorkflow` invalidates step queries on success
- [x] Pipeline view will automatically refresh to show newly created steps
- [x] All validation commands pass

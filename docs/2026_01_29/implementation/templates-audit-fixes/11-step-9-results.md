# Step 9: Parallelize Bulk Operations

**Status**: SUCCESS
**Specialist**: frontend-component

## Changes Made

**File**: `app/(app)/templates/page.tsx`

- Added `countSettledResults` helper function to count fulfilled and rejected results from `Promise.allSettled()`
- Updated `handleBulkActivate` to use `Promise.allSettled()` for parallel template activation
- Updated `handleBulkDeactivate` to use `Promise.allSettled()` for parallel template deactivation
- Updated `handleConfirmBulkDelete` to use `Promise.allSettled()` for parallel template deletion

## Implementation Details

The `countSettledResults` helper function:

```typescript
function countSettledResults(results: PromiseSettledResult<unknown>[]) {
  return results.reduce(
    (acc, result) => {
      if (result.status === "fulfilled") acc.fulfilled++;
      else acc.rejected++;
      return acc;
    },
    { fulfilled: 0, rejected: 0 }
  );
}
```

Each bulk operation now:

1. Creates an array of promises for all operations
2. Executes them in parallel with `Promise.allSettled()`
3. Counts results using the helper
4. Shows appropriate toast messages based on counts

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] Bulk operations execute in parallel
- [x] Success/failure counting remains accurate
- [x] User feedback messages correctly report results
- [x] All validation commands pass

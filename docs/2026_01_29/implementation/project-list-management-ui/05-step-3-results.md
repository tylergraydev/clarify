# Step 3 Results: Add Archive/Unarchive Mutation Hooks

**Status**: SUCCESS
**Specialist**: tanstack-query
**Completed**: 2026-01-29

## Files Modified

- `hooks/queries/use-projects.ts` - Added `useArchiveProject` and `useUnarchiveProject` mutation hooks

## Changes Made

1. Added `useArchiveProject` hook that:
   - Accepts project `id: number` parameter
   - Calls `api.project.update` with `archivedAt` set to `new Date().toISOString()`
   - Updates detail cache immediately via `setQueryData`
   - Invalidates list queries via `projectKeys.list._def`

2. Added `useUnarchiveProject` hook that:
   - Accepts project `id: number` parameter
   - Calls `api.project.update` with `archivedAt` set to `null`
   - Updates detail cache immediately via `setQueryData`
   - Invalidates list queries via `projectKeys.list._def`

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] useArchiveProject sets archivedAt to current timestamp
- [x] useUnarchiveProject clears archivedAt to null
- [x] Both hooks follow existing mutation patterns with proper cache invalidation
- [x] All validation commands pass

## Notes

The hooks are now available for use in components. Both follow existing mutation patterns using `useQueryClient`, `useElectron`, and proper cache management.

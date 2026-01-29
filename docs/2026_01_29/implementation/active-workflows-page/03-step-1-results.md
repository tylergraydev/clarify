# Step 1 Results: Add useActiveWorkflows Query Hook with Polling

**Status**: SUCCESS
**Specialist**: tanstack-query

## Files Modified

- `hooks/queries/use-workflows.ts` - Added `useActiveWorkflows` hook with polling and `ACTIVE_STATUSES` constant

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] `useActiveWorkflows` hook exports correctly
- [x] Hook filters workflows by active statuses (`running`, `paused`, `editing`)
- [x] Polling interval is configured at 5 seconds (`refetchInterval: 5000`)
- [x] All validation commands pass

## Implementation Notes

- Used `workflowKeys.running` query key from existing factory
- Mutations that change workflow status already invalidate this key
- `enabled` option allows pausing polling when page is not visible
- Follows existing TanStack Query patterns in the codebase

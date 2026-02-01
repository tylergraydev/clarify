# Step 3: Add Electron Hook Method and Query Mutation

**Status**: ✅ Success
**Specialist**: tanstack-query

## Files Modified

- `hooks/use-electron.ts` - Added `update` method to steps object using `throwIfNoApi` pattern
- `hooks/queries/use-steps.ts` - Added `useUpdateStep` mutation hook with cache invalidation

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] update method added to useElectronDb steps object
- [x] useUpdateStep mutation hook created with proper cache invalidation
- [x] All validation commands pass

## Mutation Hook Details

**useUpdateStep**:
- Input: `{ id: number; data: Partial<NewWorkflowStep> }`
- Returns: Updated step or undefined
- Cache invalidation:
  - Step detail query
  - Step list query base key
  - Steps byWorkflow query
  - Workflow detail query

## Notes

The hook follows the same patterns as `useCompleteStep` and `useSkipStep` for consistency.

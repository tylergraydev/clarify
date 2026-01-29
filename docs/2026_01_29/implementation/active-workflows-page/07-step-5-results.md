# Step 5 Results: Add Step Name Display Support

**Status**: SUCCESS
**Specialist**: frontend-component

## Files Modified

- `app/(app)/workflows/active/_components/active-workflow-card.tsx` - Added `currentStepName` prop and updated step display

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] Step name displays when available (currentStepName prop)
- [x] Falls back gracefully when step name is not available (uses getStepLabel())
- [x] Long step names are truncated appropriately (truncate class, title attribute)
- [x] All validation commands pass

## Implementation Notes

- Added `currentStepName?: null | string` to props interface
- Uses truncate class with min-w-0 flex-1 for proper truncation
- Shows full text on hover via title attribute
- Parent component can pass step name when available

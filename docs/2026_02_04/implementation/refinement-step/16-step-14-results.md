# Step 14 Results: Wire Up Stale Discovery Indicator

**Status**: SUCCESS
**Agent**: frontend-component
**Duration**: ~30s

## Files Modified

- `components/workflows/pipeline-view.tsx` - Added `discoveryStartedAt` prop
- `components/workflows/discovery-workspace.tsx` - Added `discoveryStartedAt` prop threading
- `components/workflows/stale-discovery-indicator.tsx` - Enhanced stale detection logic

## Changes

### Enhanced Stale Detection Logic

The indicator now uses `completedAt` when available but falls back to `startedAt` when discovery is in progress:

```typescript
const discoveryDate = discoveryCompletedAt ?? discoveryStartedAt
isStale = refinementDate > discoveryDate
```

### Prop Threading

- `pipeline-view.tsx` extracts `discoveryStep?.startedAt`
- Passes to `DiscoveryWorkspace` as `discoveryStartedAt`
- Passes through to `StaleDiscoveryIndicator`

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Notes

- Editing refinement automatically updates step's `updatedAt` via mutation
- Discovery workspace already had most infrastructure in place
- Added fallback logic for in-progress discovery detection

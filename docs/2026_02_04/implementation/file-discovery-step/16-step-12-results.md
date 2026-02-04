# Step 12: Integrate Discovery Workspace into Pipeline View

**Status**: SUCCESS
**Specialist**: frontend-component
**Duration**: Completed

## Files Modified

- `components/workflows/pipeline-view.tsx` - Integrated DiscoveryWorkspace into pipeline view

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] Discovery step renders correctly in pipeline
- [x] Step metrics show included file count (already supported)
- [x] Step transitions work with existing pipeline flow
- [x] DiscoveryWorkspace receives correct props

## Changes Made

### Added Imports
```typescript
import { DiscoveryWorkspace } from './discovery-workspace';
```

### Added Detection Logic
- `activeDiscoveryStep` - Finds discovery step with 'running' state
- `activeDiscoveryStepId` - Extracts ID for filtering
- `isDiscoveryWorkspaceActive` - Boolean for workspace visibility

### Updated Step Filtering
- `visibleSteps` now filters out both clarification and discovery active steps

### Added Discovery Completion Handler
```typescript
const handleDiscoveryComplete = useCallback(async () => {
  if (!activeDiscoveryStepId) return;
  await completeStep.mutateAsync({ id: activeDiscoveryStepId });
}, [activeDiscoveryStepId, completeStep]);
```

### Added Workspace Rendering
```typescript
{isDiscoveryWorkspaceActive && activeDiscoveryStep && (
  <DiscoveryWorkspace
    discoveryCompletedAt={activeDiscoveryStep.completedAt}
    onComplete={handleDiscoveryComplete}
    stepId={activeDiscoveryStep.id}
    workflowId={workflowId}
  />
)}
```

### Updated Empty State Logic
- Now considers `isAnyWorkspaceActive` (clarification OR discovery)

## Existing Support Found

- `pipeline-step.tsx` already has 'discovery' in PipelineStepType union
- `pipeline-step.tsx` already has FolderSearch icon mapped for discovery
- `pipeline-step-metrics.tsx` already has discovery metrics support

## Notes

- `computeStepMetrics` returns placeholder discovery metrics
- `refinementUpdatedAt` not passed (not on WorkflowStep type) - StaleDiscoveryIndicator may need additional work

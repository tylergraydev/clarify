# Step 4 Results: Update PipelineView to Render Steps from Database

**Specialist**: frontend-component
**Status**: ✅ Success

## Changes Made

**Files Modified**:
- `components/workflows/pipeline-view.tsx` - Refactored to render steps from database instead of hardcoded `ORCHESTRATION_STEPS` array

## Implementation Details

Key changes made:
1. **Removed hardcoded `ORCHESTRATION_STEPS` array** - No longer iterating over static config
2. **Added `useWorkflow` hook** - Fetches workflow data to determine status for empty state handling
3. **Added `sortStepsByNumber` helper** - Ensures steps are rendered in correct order by `stepNumber`
4. **Empty state handling** - Shows contextual message based on whether workflow is in `created` status or has no steps for other reasons
5. **Uses actual `step.id`** - For expansion tracking instead of config-based IDs
6. **Uses actual step data** - `step.title` for title, `step.status` for derived visual state, `step.outputText` for output
7. **Removed unused icon mapping** - The `PipelineStep` component already has its own internal icon mapping based on `stepType`
8. **Retained existing helper functions** - `deriveStepState` continues to map database statuses to visual states

The pipeline view is now fully data-driven from the database, allowing for future extensibility with different step types while maintaining the existing visual behavior.

## Validation Results

- ✅ pnpm lint: PASS
- ✅ pnpm typecheck: PASS

## Success Criteria

- [x] Pipeline renders steps from database when available
- [x] Steps are rendered in correct order by `stepNumber`
- [x] Empty state is handled gracefully for `created` workflows
- [x] Step expansion still works correctly with database step IDs
- [x] All validation commands pass

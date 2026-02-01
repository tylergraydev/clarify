# Step 6: Update PipelineView to Handle Clarification Submissions

**Status**: ✅ Success
**Specialist**: frontend-component

## Files Modified

- `components/workflows/pipeline-view.tsx` - Added clarification handlers and state management

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] Clarification submission updates outputStructured with answers
- [x] Step transitions to completed after submission
- [x] Skip functionality calls skip mutation
- [x] Loading states properly tracked and passed to form
- [x] All validation commands pass

## Changes Made

**Imports Added**:
- `useCallback`, `useState` from React
- `ClarificationAnswers`, `ClarificationStepOutput` types
- `useCompleteStep`, `useSkipStep`, `useUpdateStep` hooks

**State Added**:
- `submittingStepId` - Tracks which step is being submitted

**Handlers Created**:
- `handleSubmitClarification(stepId, currentOutput, answers)`:
  - Merges answers into outputStructured
  - Updates step via `updateStep.mutateAsync`
  - Completes step via `completeStep.mutateAsync`

- `handleSkipClarification(stepId)`:
  - Calls `skipStep.mutateAsync`

**Props Passed to PipelineStep**:
- `outputStructured` (cast from unknown)
- `onSubmitClarification`
- `onSkipStep`
- `isSubmitting`

## Data Flow Complete

User submits form → answers merged → step updated → step completed → cache invalidated → UI refreshes

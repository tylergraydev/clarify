# Step 3: Update Workflow Creation Validation Schema

**Date**: 2026-02-02
**Specialist Agent**: tanstack-form
**Status**: SUCCESS

## Changes Made

### Files Modified
- `lib/validations/workflow.ts` - Added `clarificationAgentId` field to workflow schemas

## Schema Changes

Added `clarificationAgentId: z.number().nullable().optional()` to:

1. **createWorkflowSchema** - For new workflow creation
2. **updateWorkflowSchema** - For partial workflow updates
3. **editWorkflowFormSchema** - For the edit workflow form

## Field Type Semantics

- `optional()` - Field doesn't need to be provided (backwards compatible)
- `nullable()` - Value can be `null` (allows no agent selection)
- `number()` - When provided and not null, must be a valid agent ID

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] Schema accepts clarificationAgentId field
- [x] Field is optional for backwards compatibility
- [x] All validation commands pass

## Notes

- Types `CreateWorkflowFormValues`, `CreateWorkflowOutput`, etc. are automatically updated via `z.infer`
- Field placed in alphabetical order (before `featureName`)

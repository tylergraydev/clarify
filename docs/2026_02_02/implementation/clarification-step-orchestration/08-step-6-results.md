# Step 6: Update Workflow Step Creation to Include Agent ID

**Date**: 2026-02-02
**Specialist Agent**: database-schema
**Status**: SUCCESS

## Changes Made

### Files Modified
- `db/repositories/workflow-steps.repository.ts` - Added `clarificationAgentId` parameter to `createPlanningSteps`
- `electron/ipc/workflow.handlers.ts` - Added fallback logic for agent resolution in `workflow:start`
- `electron/ipc/index.ts` - Moved settings repo creation earlier, passed to workflow handlers

## Implementation Details

### createPlanningSteps Update
- Now accepts optional `clarificationAgentId` parameter
- Sets agentId on clarification step (stepType === 'clarification')

### Three-Tier Fallback Logic
```typescript
1. Workflow's clarificationAgentId (user selection)
2. Default clarification agent from settings
3. First active planning agent in database
4. Warning logged if no agent available
```

### Fallback Verification
- Default agent from settings is verified to exist and be active
- Non-existent or deactivated agents are skipped

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] Clarification step created with correct agentId
- [x] Fallback logic works when no explicit selection
- [x] All validation commands pass

## Notes

- Step with no agent (all fallbacks failed) will have `agentId: null`
- Execution layer needs to handle null agentId appropriately
- Handler is now async due to settings/agents repo calls

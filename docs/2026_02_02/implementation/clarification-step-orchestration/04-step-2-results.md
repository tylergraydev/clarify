# Step 2: Extend Clarification Validation Types

**Date**: 2026-02-02
**Specialist Agent**: tanstack-form
**Status**: SUCCESS

## Changes Made

### Files Modified
- `lib/validations/clarification.ts` - Added service-level types for clarification orchestration

## Types Added

1. **ClarificationServiceOptions** - Configuration for starting clarification
   - workflowId, stepId, agentId, repositoryPath, featureRequest, timeoutSeconds

2. **ClarificationAgentConfig** - Loaded agent configuration
   - id, name, systemPrompt, model, permissionMode, tools, skills, hooks

3. **ClarificationOutcome** - Discriminated union with 5 variants:
   - SKIP_CLARIFICATION
   - QUESTIONS_FOR_USER
   - TIMEOUT
   - ERROR
   - CANCELLED

4. **ClarificationServicePhase** - Granular phase tracking

5. **ClarificationServiceState** - Service state machine state

6. **ClarificationRefinementInput** - User answer submission type

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] All new types are properly exported
- [x] `ClarificationServiceOptions` includes `agentId` field
- [x] `ClarificationAgentConfig` captures full agent configuration
- [x] All validation commands pass

## Notes

- Linter auto-reordered types alphabetically and changed union type formatting
- These types define the contract between UI and service layers

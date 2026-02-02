# Step 4: Create Default Clarification Agent Hook

**Date**: 2026-02-02
**Specialist Agent**: tanstack-query
**Status**: SUCCESS

## Changes Made

### Files Created
- `hooks/queries/use-default-clarification-agent.ts` - Query and mutation hooks for default clarification agent

### Files Modified
- `hooks/queries/index.ts` - Added exports for new hooks

## Hooks Implemented

### useDefaultClarificationAgent()
```typescript
const { agentId, isLoading, error } = useDefaultClarificationAgent();
```
- Queries `defaultClarificationAgentId` setting via settings IPC
- Returns `{ agentId: number | null, isLoading, error }`

### useSetDefaultClarificationAgent()
```typescript
const setDefaultAgent = useSetDefaultClarificationAgent();
setDefaultAgent.mutate(someAgentId);
setDefaultAgent.mutate(null); // Clear default
```
- Updates setting via settings IPC
- Uses `setQueryData` for immediate cache update
- Uses `invalidateQueries` for list consistency

## Conventions Followed

- `'use client'` directive
- Spread query key definition: `...settingKeys.byKey(key)`
- `enabled: isElectron` condition
- `void` prefix for invalidation promises
- Naming: `use{Entity}` for query, `useSet{Entity}` for mutation

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] Hook returns current default agent ID
- [x] Mutation updates the setting correctly
- [x] Query invalidation works on update
- [x] All validation commands pass

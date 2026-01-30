# Step 3 Results: Add useDuplicateAgent Mutation Hook

## Status: SUCCESS

## Summary

Created a TanStack Query mutation hook for duplicating agents with proper cache invalidation and toast notifications.

## Files Modified

- `hooks/queries/use-agents.ts` - Added `useDuplicateAgent` mutation hook following existing patterns

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] `useDuplicateAgent` hook exports from the file
- [x] Hook follows existing mutation patterns for error handling and cache invalidation
- [x] All validation commands pass

## Implementation Details

### TanStack Query Conventions Followed

- Used `useQueryClient` for cache operations
- Used `void` prefix for invalidation promise
- Used `agentKeys._def` for base key invalidation
- Followed naming convention: `useDuplicate{Entity}`
- Included `onError` handler with toast notification
- Included `onSuccess` handler with result validation, cache invalidation, and toast notification

### Result Shape

Hook expects result from `api.agent.duplicate(id)` to return:

```typescript
{ success: boolean; error?: string; agent?: Agent }
```

## Notes for Next Steps

Hook is ready for UI component integration.

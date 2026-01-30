# Step 4 Results: Add Query Key Factories

**Status**: SUCCESS
**Specialist**: tanstack-query

## Files Modified

| File | Changes |
|------|---------|
| `lib/queries/agents.ts` | Added `global` and `projectScoped` query key definitions |

## Changes Made

1. **`global`** - For querying global agents (not project-scoped):
   - Accepts optional filters for `includeDeactivated` and `type`
   - Does NOT include `projectId` since these are global agents

2. **`projectScoped`** - For querying agents scoped to a specific project:
   - Requires `projectId` as first parameter for proper cache isolation
   - Accepts optional filters for `includeDeactivated` and `type`
   - Key structure `[projectId, { filters }]` enables granular invalidation

## Cache Invalidation Patterns

- `agentKeys.global._def` - Invalidate all global agent queries
- `agentKeys.projectScoped._def` - Invalidate all project-scoped agent queries
- `agentKeys.projectScoped(projectId)._def` - Invalidate queries for a specific project
- `agentKeys._def` - Invalidate all agent queries (global and project-scoped)

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] New query keys are exported and typed correctly
- [x] Keys follow existing factory pattern from `@lukemorales/query-key-factory`
- [x] All validation commands pass

## Notes

Query keys ready for use in hooks. Step 5 will create corresponding hooks.

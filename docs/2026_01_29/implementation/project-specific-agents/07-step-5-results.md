# Step 5 Results: Create Query Hooks

**Status**: SUCCESS
**Specialist**: tanstack-query

## Files Modified

| File | Changes |
|------|---------|
| `hooks/queries/use-agents.ts` | Added `useGlobalAgents` and `useProjectAgents` query hooks, updated `useCreateAgent` mutation with scope-aware cache invalidation |

## Query Hooks Created

### `useGlobalAgents(filters?)`
- Uses `agentKeys.global(filters)` query key
- Calls `api.agent.list({ scope: "global", ... })`
- Returns only agents with `projectId IS NULL`
- Supports optional `includeDeactivated` and `type` filters

### `useProjectAgents(projectId, filters?)`
- Uses `agentKeys.projectScoped(projectId, filters)` query key
- Requires `projectId` parameter
- Calls `api.agent.list({ scope: "project", projectId, ... })`
- Returns only agents for the specified project
- Has `enabled: isElectron && projectId > 0` guard
- Supports optional `includeDeactivated` and `type` filters

### `useCreateAgent` mutation updated
- Now performs scope-aware cache invalidation
- If created agent has `projectId`: invalidates `agentKeys.projectScoped._def` and `agentKeys.byProject(projectId)`
- If created agent has no `projectId` (global): invalidates `agentKeys.global._def`
- Always invalidates `agentKeys.list._def` and `agentKeys.active._def`

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] New hooks are exported and usable in components
- [x] `useGlobalAgents` returns only agents where projectId is null
- [x] `useProjectAgents` returns only agents for the specified project
- [x] All validation commands pass

## Notes

Hooks are ready for use in UI components. Step 12 will update remaining mutations with scope-aware invalidation.

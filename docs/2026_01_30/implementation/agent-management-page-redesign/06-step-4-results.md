# Step 4: Update Query Key Factory and Add Unified Query Hook

**Status**: SUCCESS

## Files Modified

- `lib/queries/agents.ts` - Added `all` query key with optional `includeBuiltIn` and `includeDeactivated` filters
- `hooks/queries/use-agents.ts` - Added `useAllAgents`, `useMoveAgent`, and `useCopyAgentToProject` hooks; updated all existing mutation hooks to invalidate the new `all` query key

## New Hooks

### useAllAgents
- Fetches all agents without scope filtering
- Accepts optional `includeBuiltIn` and `includeDeactivated` filters
- Uses `api.agent.list()` internally

### useMoveAgent
- Accepts `agentId: number` and `targetProjectId: number | null`
- `null` makes the agent global
- Invalidates all agent-related query keys

### useCopyAgentToProject
- Accepts `agentId: number` and `targetProjectId: number`
- Creates a project-scoped copy of an existing agent
- Invalidates all agent-related query keys

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] Query key factory includes `all` key for unified queries
- [x] `useAllAgents` returns all agents regardless of project scope
- [x] Mutation hooks properly invalidate caches including `list`, `all`, `global`, `projectScoped`, and `byProject` keys
- [x] All validation commands pass

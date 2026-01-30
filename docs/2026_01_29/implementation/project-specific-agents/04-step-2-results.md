# Step 2 Results: Update Repository for Scope Queries

**Status**: SUCCESS
**Specialist**: database-schema

## Files Modified

| File                                   | Changes                                                                                                                                            |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `db/repositories/agents.repository.ts` | Added `AgentListFilters` interface, `findGlobal()` method, `findByProjectWithParents()` method, and updated `findAll()` to support scope filtering |

## Changes Summary

1. **Added `AgentListFilters` interface**:
   - `scope?: "global" | "project"` - Filter by scope
   - `excludeProjectAgents?: boolean` - Exclude project-scoped agents in global view
   - Plus existing: `includeDeactivated`, `projectId`, `type`

2. **Added `findGlobal()` method**:
   - Filters for agents where `projectId IS NULL`
   - Supports optional `includeDeactivated` and `type` filters
   - Excludes deactivated agents by default

3. **Added `findByProjectWithParents()` method**:
   - Returns both project-specific agents AND global agents for parent resolution
   - Useful for the tabbed interface that needs to show project overrides with their parent context

4. **Updated `findAll()` method**:
   - Added `scope` parameter handling:
     - `"global"`: only agents where `projectId IS NULL`
     - `"project"`: only agents for the specified `projectId`
   - Added `excludeProjectAgents` flag support
   - Maintains backward compatibility with existing `projectId` filter

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] New repository methods are callable and typed correctly
- [x] `findAll` respects `scope` parameter when provided
- [x] All validation commands pass

## Notes

Repository now provides methods needed by IPC handlers (Step 3) and React Query hooks (Step 4).

# Step 12 Results: Update Cache Invalidation

**Status**: SUCCESS
**Specialist**: tanstack-query

## Files Modified

| File                                                  | Changes                                                      |
| ----------------------------------------------------- | ------------------------------------------------------------ |
| `hooks/queries/use-agents.ts`                         | Updated all mutation hooks with dual-tier cache invalidation |
| `components/agents/project-agents-tab-content.tsx`    | Updated delete/reset calls with object signature             |
| `components/agents/global-agents-tab-content.tsx`     | Updated delete/reset calls with object signature             |
| `components/agents/agent-editor-dialog.tsx`           | Updated reset call with object signature                     |
| `components/projects/settings-tab-content.tsx`        | Updated reset call with object signature                     |
| `components/projects/project-agent-editor-dialog.tsx` | Updated reset call with object signature                     |

## Mutations Updated

| Hook                 | Cache Invalidation                                                            |
| -------------------- | ----------------------------------------------------------------------------- |
| `useActivateAgent`   | `global._def` or `projectScoped._def` based on agent's `projectId`            |
| `useDeactivateAgent` | `global._def` or `projectScoped._def` based on agent's `projectId`            |
| `useDeleteAgent`     | Scope-specific caches + removes agent from detail cache                       |
| `useDuplicateAgent`  | `global._def` or `projectScoped._def` based on duplicated agent's `projectId` |
| `useResetAgent`      | Both global and project caches for override deletion                          |
| `useUpdateAgent`     | `global._def` or `projectScoped._def` based on agent's `projectId`            |

## API Changes

- `useDeleteAgent`: Now accepts `{ id, projectId? }` object instead of plain `id`
- `useResetAgent`: Now accepts `{ id, projectId? }` object instead of plain `id`

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] All mutations properly invalidate relevant caches
- [x] Global agent operations don't unnecessarily invalidate project caches
- [x] Project agent operations invalidate the specific project cache
- [x] All validation commands pass

## Notes

Cache invalidation pattern ensures UI consistency across global and project tiers.

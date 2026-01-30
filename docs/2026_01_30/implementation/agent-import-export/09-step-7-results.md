# Step 7: Create Import/Export Mutation Hooks

**Status**: ✅ Success

## Summary

Created TanStack Query mutation hooks for agent import and export operations.

## Files Modified

- `hooks/queries/use-agents.ts` - Added three mutation hooks

## Hooks Created

| Hook | Description | Cache Invalidation |
|------|-------------|-------------------|
| `useImportAgent()` | Imports agent from parsed markdown | Invalidates all agent queries |
| `useExportAgent()` | Exports single agent by ID | None (read-only) |
| `useExportAgentsBatch()` | Exports multiple agents | None (read-only) |

## Key Implementation Details

- Used `useQueryClient` for cache operations
- Toast notifications on success and error states
- Validation error handling with field-specific messages
- Proper cache invalidation patterns with `_def` for base keys

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [✓] Import mutation properly invalidates agent query caches on success
- [✓] Export mutations return markdown content
- [✓] Toast notifications display on success and error
- [✓] All validation commands pass

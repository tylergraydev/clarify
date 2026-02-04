# Step 6: Create Validation Schemas and Query Infrastructure

**Status**: SUCCESS
**Specialist**: tanstack-query
**Duration**: Completed

## Files Created/Modified

### Created
- `lib/validations/discovered-file.ts` - Zod validation schemas for discovered file operations

### Modified
- `hooks/queries/use-discovered-files.ts` - Added mutation and streaming hooks
- `hooks/queries/index.ts` - Updated exports

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] Schemas validate all required metadata fields
- [x] Mutation hooks properly invalidate affected queries
- [x] Streaming hook handles cleanup on unmount
- [x] Query key factory follows existing patterns

## New Schemas

| Schema | Purpose |
|--------|---------|
| `fileMetadataSchema` | Shared schema for action, priority, role, relevanceExplanation |
| `addDiscoveredFileSchema` | Adding files manually with path validation |
| `editDiscoveredFileSchema` | Editing existing file metadata (all fields optional) |

## New Hooks

| Hook | Purpose |
|------|---------|
| `useDeleteDiscoveredFile` | Delete a discovered file |
| `useToggleDiscoveredFile` | Toggle file inclusion state |
| `useStartDiscovery` | Start a discovery session |
| `useCancelDiscovery` | Cancel an active discovery session |
| `useRediscover` | Re-discovery with mode ('additive' \| 'replace') |
| `useDiscoveryStream` | Streaming subscription with cleanup |

## Notes

- Query key factory already existed in `lib/queries/discovered-files.ts`
- Streaming hook follows `useAgentStream` pattern
- All mutations properly invalidate affected queries

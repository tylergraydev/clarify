# Step 2: Extend Repository for Re-Discovery and Bulk Operations

**Status**: SUCCESS
**Specialist**: database-schema
**Duration**: Completed

## Files Modified

- `db/repositories/discovered-files.repository.ts` - Added 5 new repository methods for re-discovery and bulk operations

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] All new methods follow existing repository patterns
- [x] Proper transaction handling for bulk operations
- [x] Methods return expected types
- [x] `clearByWorkflowStep` properly deletes by stepId
- [x] `toggleInclude` flips the boolean value atomically

## New Methods Added

| Method | Signature | Purpose |
|--------|-----------|---------|
| `clearByWorkflowStep` | `(stepId: number): number` | Deletes all discovered files for a workflow step (replace mode re-discovery). Returns count of deleted rows. |
| `findByPath` | `(stepId: number, filePath: string): DiscoveredFile \| undefined` | Finds a file by its path within a step (duplicate detection for additive mode). |
| `upsertMany` | `(files: Array<NewDiscoveredFile>): Array<DiscoveredFile>` | Insert or update files (additive mode). Detects duplicates by stepId + filePath, updates if exists, inserts if new. |
| `toggleInclude` | `(id: number): DiscoveredFile \| undefined` | Toggles the includedAt field atomically - sets to timestamp if null, clears to null if set. |
| `deleteMany` | `(ids: Array<number>): number` | Bulk delete by array of IDs. Returns count of deleted rows. |

## Notes

- The schema uses `includedAt` as a nullable timestamp rather than a boolean `included` field
- `upsertMany` updates key content fields but preserves user modifications (includedAt, userAddedAt, userModifiedAt) on existing records

# Step 2 Results: Extend Project Query Keys for Archived Filtering

**Status**: SUCCESS
**Specialist**: tanstack-query
**Completed**: 2026-01-29

## Files Modified

- `lib/queries/projects.ts` - Added JSDoc documentation and `archived` query key

## Changes Made

1. Added JSDoc documentation to the query key factory
2. Added `archived` query key for dedicated archived projects views

## Cache Key Structure

The query key factory now supports three distinct views:

1. **Active Projects**: `projectKeys.list()` generates `["projects", "list", { filters: undefined }]`
2. **All Projects**: `projectKeys.list({ includeArchived: true })` generates `["projects", "list", { filters: { includeArchived: true } }]`
3. **Archived Only**: `projectKeys.archived()` generates `["projects", "archived"]`

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] Query keys differentiate between active-only and all-projects views
- [x] All validation commands pass

## Notes

The preload API currently calls `list()` without options. Query hooks implementation may need to update the preload API to accept `options?: { includeArchived?: boolean }` to pass through the filter.

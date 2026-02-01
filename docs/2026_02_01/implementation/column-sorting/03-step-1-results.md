# Step 1: Update DEFAULT_PERSISTED_KEYS

**Status**: ✅ SUCCESS

## Changes Made

**File**: `hooks/use-table-persistence.ts`
- Added 'sorting' to DEFAULT_PERSISTED_KEYS array
- Updated JSDoc comment to reflect new default value

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] DEFAULT_PERSISTED_KEYS contains ['columnOrder', 'columnVisibility', 'columnSizing', 'sorting']
- [x] All validation commands pass
- [x] No TypeScript errors

## Notes

- PersistableStateKey type already includes 'sorting'
- Tables using persistence without explicit persistedKeys will now auto-persist sorting

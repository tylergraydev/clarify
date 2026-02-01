# Step 3: Update Agent Table Persistence Configuration

**Status**: ✅ SUCCESS

## Changes Made

**File**: `components/agents/agent-table.tsx`
- Added 'sorting' to the persistedKeys array in DataTable persistence configuration

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] persistedKeys array contains ['columnOrder', 'columnVisibility', 'columnSizing', 'sorting']
- [x] All validation commands pass

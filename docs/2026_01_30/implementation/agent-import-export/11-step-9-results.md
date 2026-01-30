# Step 9: Add Import/Export Buttons to Toolbar

**Status**: ✅ Success

## Summary

Added Import and Export Selected buttons to the agent table toolbar.

## Files Modified

- `components/agents/agent-table-toolbar.tsx` - Added buttons and props

## Changes Made

### Props Added
- `onExportSelected?: () => void` - Callback for export selected
- `onImport?: () => void` - Callback for import
- `selectedCount?: number` - Number of selected rows

### Buttons Added
- Import button with Upload icon (renders when onImport provided)
- Export Selected button with Download icon and count badge (renders when onExportSelected provided)

## UI Details

- Buttons use `outline` variant and `sm` size
- Export Selected disabled when no rows selected
- Shows count badge when rows are selected
- Conditional separator between toggles and action buttons

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [✓] Import button renders in toolbar
- [✓] Export Selected button renders with selection count
- [✓] Export Selected button disabled when selectedCount is 0
- [✓] Buttons follow existing toolbar styling
- [✓] All validation commands pass

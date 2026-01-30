# Step 12: Integrate Import/Export in Agents Page

**Status**: ✅ Success

## Summary

Wired up all import/export functionality in the agents page component.

## Files Modified

- `app/(app)/agents/page.tsx` - Added complete import/export integration

## Changes Made

### New Imports
- `RowSelectionState` from TanStack React Table
- `ParsedAgentMarkdown` type
- `AgentImportValidationResult` type
- `ImportAgentDialog` component
- `useExportAgent`, `useExportAgentsBatch`, `useImportAgent` hooks
- `useElectron`, `useToast` hooks
- `parseAgentMarkdown`, `prepareAgentImportData`, `validateAgentImport` utilities

### New State
- `rowSelection` - Row selection state for batch operations
- `isImportDialogOpen` - Import dialog visibility
- `parsedImportData` - Parsed markdown data for preview
- `importValidationResult` - Validation result for import

### New Handlers
- `handleImportClick` - Opens file dialog, parses markdown, validates, shows preview
- `handleImportConfirm` - Calls import mutation, clears state
- `handleImportDialogOpenChange` - Manages dialog state
- `handleExportSingle` - Exports single agent via save dialog
- `handleExportSelected` - Exports selected agents to directory
- `handleRowSelectionChange` - Updates selection state

### Component Integration
- AgentTable receives: isExporting, isRowSelectionEnabled, onExport, onRowSelectionChange, rowSelection
- AgentTableToolbar receives: onExportSelected, onImport, selectedCount
- ImportAgentDialog rendered with all props

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [✓] Import button opens file picker for markdown files
- [✓] Import dialog shows preview of parsed agent data
- [✓] Import confirm creates agent and closes dialog
- [✓] Single export saves markdown file to user-selected location
- [✓] Batch export saves multiple files to user-selected directory
- [✓] Row selection enables batch export button
- [✓] All validation commands pass

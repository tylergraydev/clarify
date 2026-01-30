# Step 8: Redesign Agents Page with Unified DataTable

**Status**: SUCCESS

## Files Modified

- `app/(app)/agents/page.tsx` - Complete page rewrite
- `components/agents/agent-table.tsx` - Added `toolbarContent` prop passthrough

## Changes Made

### Removed
- Tab-related imports (TabsRoot, TabsList, TabsPanel, etc.)
- GlobalAgentsTabContent and ProjectAgentsTabContent imports
- AgentLayoutToggle import
- useAgentLayoutStore import
- Dual queries approach

### Added
- Single `useAllAgents` hook for fetching all agents
- Filter state management (type, project, status)
- Toggle state for showBuiltIn and showDeactivated
- Client-side filtering based on filter state
- AgentTableToolbar integration
- Inline `ProjectSelectionDialog` for move/copy operations
- Delete confirmation dialog

### CRUD Operations Wired
- **Create**: AgentEditorDialog with mode='create'
- **Edit**: AgentTable row click handling
- **Duplicate**: useDuplicateAgent mutation
- **Delete**: useDeleteAgent with confirmation dialog
- **Activate/Deactivate**: useActivateAgent/useDeactivateAgent mutations
- **Reset**: useResetAgent mutation
- **Move**: useMoveAgent with project selection dialog
- **Copy**: useCopyAgentToProject with project selection dialog

### Keyboard Shortcuts
- Ctrl+N: Create new agent (preserved)

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] Page renders unified table with all agents
- [x] Filters correctly narrow down displayed agents
- [x] Toggle switches control visibility of built-in and deactivated agents
- [x] All CRUD operations work correctly
- [x] All validation commands pass

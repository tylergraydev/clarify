# Step 6: Update AgentEditorDialog with Project Assignment Field

**Status**: SUCCESS

## Files Modified

- `components/agents/agent-editor-dialog.tsx` - Added project assignment dropdown for both create and edit modes

## Changes Made

### Imports Added
- `useMoveAgent` from `@/hooks/queries/use-agents`
- `useProjects` from `@/hooks/queries/use-projects`
- Select components from `@/components/ui/select`
- Field styling utilities from `@/components/ui/form/field-wrapper`

### State and Hooks
- `selectedProjectId` state to track selected project
- `moveAgentMutation` using `useMoveAgent()` hook
- `projectOptions` memo for dropdown options

### UI Component
- Project assignment `<SelectRoot>` with full dropdown
- "Global (all projects)" as first option
- Active projects listed as subsequent options
- Disabled during submission, reset, or move operations

### Behavior
- **Create mode**: Selection updates local state, used during agent creation
- **Edit mode**: Selection immediately triggers `useMoveAgent` mutation
- Built-in agents: Dropdown disabled (view mode only)

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] Project dropdown appears in both create and edit modes
- [x] "Global (all projects)" is the first option
- [x] Projects list populates from useProjects query
- [x] Changing project in edit mode calls move mutation
- [x] All validation commands pass

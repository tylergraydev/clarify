# Step 5: Create Unified Agent Table Columns Definition

**Status**: SUCCESS

## Files Modified

- `components/agents/agent-table.tsx` - Complete refactoring with new unified column definitions
- `components/agents/agent-layout-renderer.tsx` - Removed `selectedProjectId` prop from AgentTable usage

## New Columns Added

| Column | Description |
|--------|-------------|
| Name | Includes color indicator using `getAgentColorClass` |
| Type | Badge variants for planning/specialist/review |
| Project/Scope | Displays "Global" or project name |
| Tools | Count of agent tools |
| Skills | Count of agent skills |
| Status | Toggle for active/inactive with switch |
| Created | Date formatting |
| Updated | Date formatting |
| Actions | Contextual row actions |

## Row Actions

- **Create Project Copy** - Only for global agents
- **Move to Project / Change Project** - For all agents when callback provided
- **Copy to Project** - Only for project-scoped agents
- **Reset to Default** - Only for customized agents
- **Delete** - Only for custom agents

## New Interface

```typescript
export interface AgentWithRelations extends AgentSelect {
  tools?: AgentToolSelect[];
  skills?: AgentSkillSelect[];
}
```

## New Props

- `projects` - For resolving project names
- `onMoveToProject` - Callback for move action
- `onCopyToProject` - Callback for copy action
- `isMovingToProject` - Loading state for move
- `isCopyingToProject` - Loading state for copy

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] All specified columns render correctly
- [x] Project name displays correctly for project-scoped agents
- [x] Built-in agents have subtle distinct styling (`bg-muted/30`)
- [x] New row actions appear conditionally based on agent type
- [x] All validation commands pass

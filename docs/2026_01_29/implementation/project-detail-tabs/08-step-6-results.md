# Step 6: Create Project Agent Editor Dialog Component

**Specialist**: tanstack-form
**Status**: SUCCESS

## Files Created

- `components/projects/project-agent-editor-dialog.tsx` - Dialog component for editing project-specific agent configurations

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] Dialog displays agent information with project context
- [x] Form allows editing display name, description, and system prompt
- [x] Submit saves changes with project scope via mutation
- [x] Reset option restores to global agent defaults
- [x] Cache invalidation for agent and project queries
- [x] All validation commands pass

## Component Features

**Props**:

- `agent` - Agent data to edit
- `projectId` - Project ID for scoping changes
- `trigger` - Trigger element for dialog
- `onSuccess` - Callback on successful update

**Features**:

- Displays base agent info (name, type, color) as read-only reference
- Shows project-level override indicator banner
- Distinguishes between existing overrides and creating new ones
- Reset to Global Defaults button for overrides
- Uses `useAppForm` with agent validation schema
- Form fields: displayName (TextField), description (TextareaField), systemPrompt (TextareaField)

## Notes

- Uses existing `useUpdateAgent` mutation with `projectId` for project scoping
- Cache invalidation handled by mutation hooks

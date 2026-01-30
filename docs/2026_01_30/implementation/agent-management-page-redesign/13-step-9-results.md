# Step 9: Implement Project Selection Dialog for Move/Copy Actions

**Status**: SUCCESS

## Files Created/Modified

- `components/agents/select-project-dialog.tsx` (NEW) - Reusable dialog component
- `app/(app)/agents/page.tsx` - Updated to use extracted component

## Component Features

- Displays list of available (non-archived) projects
- Shows "Global (all projects)" option for move operations (when agent is project-scoped)
- Excludes current project from list for move operations
- Loading state during mutation operations
- Confirm and cancel buttons
- Selected agent name displayed in dialog description for context
- Accessible with proper ARIA attributes

## Props Interface

```typescript
interface SelectProjectDialogProps {
  agentName: string;
  currentProjectId: null | number;
  isLoading: boolean;
  isMoveMode: boolean;
  onCancel: () => void;
  onConfirm: (projectId: null | number) => void;
  open: boolean;
  projects: ProjectSelect[];
}
```

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] Dialog displays list of available projects
- [x] Global option is available for move action
- [x] Selection triggers appropriate callback with project ID
- [x] All validation commands pass

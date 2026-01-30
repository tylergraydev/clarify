# Step 5 Results: Extend AgentEditorDialog to Support Create Mode

## Status: SUCCESS

## Summary

Modified the `AgentEditorDialog` component to support both "create" and "edit" modes, following the TemplateEditorDialog pattern.

## Files Modified

- `components/agents/agent-editor-dialog.tsx` - Extended to support both modes
- `app/(app)/agents/page.tsx` - Updated existing usage to include `mode="edit"` prop

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] Dialog supports both "create" and "edit" modes via prop
- [x] Create mode shows name and type fields
- [x] Edit mode hides name field (internal name displayed in read-only info box)
- [x] Correct mutation called based on mode
- [x] Validation uses appropriate schema per mode
- [x] All validation commands pass

## Implementation Details

### New Props Added

- `mode: EditorMode` - Required prop to specify mode
- `agent?: Agent` - Now optional (only required for edit mode)
- `initialData?: AgentInitialData` - For pre-filling form when duplicating

### New Types Added

- `EditorMode = "create" | "edit"`
- `AgentInitialData` interface for duplicate mode

### Mode-Specific Behavior

| Feature      | Create Mode             | Edit Mode                   |
| ------------ | ----------------------- | --------------------------- |
| Name field   | Shown, editable         | Hidden (read-only display)  |
| Type field   | Shown, editable         | Hidden                      |
| Schema       | `createAgentFormSchema` | `updateAgentSchema`         |
| Mutation     | `useCreateAgent`        | `useUpdateAgent`            |
| Tools/Skills | Hidden                  | Shown                       |
| Reset button | Hidden                  | Shown for customized agents |

## Notes for Next Steps

Component is ready for use in create agent button (Step 6) and duplicate functionality.

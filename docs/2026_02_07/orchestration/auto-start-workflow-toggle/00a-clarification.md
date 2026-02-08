# Step 0a: Feature Request Clarification

## Step Metadata

- **Status**: Skipped
- **Duration**: ~29s
- **Ambiguity Score**: 5/5
- **Decision**: SKIP_CLARIFICATION

## Original Request

Add an "Auto-start" toggle (SwitchField) to the create workflow dialog in components/workflows/create-workflow-dialog.tsx. The toggle should be a new form field autoStart (boolean, default false) added to the CreateWorkflowFormValues type in lib/validations/workflow.ts and the createWorkflowSchema. The toggle should always be visible for planning workflows, positioned after the existing "Skip Clarification" toggle. When autoStart is true and the user clicks "Create Workflow", the dialog should use useCreateWorkflow({ autoStart: true }) which already exists in hooks/queries/use-workflows.ts:112. After successful creation with auto-start, the dialog's onSuccess callback should receive the created workflow object so the parent component can navigate to /workflows/[id]. The autoStart field is UI-only and does NOT need to be persisted to the database schema. The submit button text should change to "Create & Start Workflow" when auto-start is toggled on.

## Skip Reasoning

The request is exceptionally detailed and ready for implementation. It explicitly specifies:
- Exact file paths to modify
- The exact form field component to add (SwitchField)
- Type definitions needed (autoStart boolean, default false)
- Positioning in the UI (after Skip Clarification toggle)
- Conditional rendering logic (always visible for planning workflows)
- Integration with existing hook (useCreateWorkflow({ autoStart: true }) at line 112)
- Navigation behavior (onSuccess callback modification)
- Database schema clarification (NOT persisted, UI-only)
- UX details (submit button text change, toggle description)
- Technical implementation detail (autoStart controls post-creation behavior)

No clarification questions needed.

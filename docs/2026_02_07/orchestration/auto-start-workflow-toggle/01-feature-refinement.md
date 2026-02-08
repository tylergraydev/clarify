# Step 1: Feature Request Refinement

## Step Metadata

- **Status**: Completed
- **Duration**: ~14s

## Original Request

Add an "Auto-start" toggle (SwitchField) to the create workflow dialog in components/workflows/create-workflow-dialog.tsx. The toggle should be a new form field autoStart (boolean, default false) added to the CreateWorkflowFormValues type in lib/validations/workflow.ts and the createWorkflowSchema. [Full request as provided by user]

## Refined Feature Request

Add an "Auto-start" toggle to the create workflow dialog component located at components/workflows/create-workflow-dialog.tsx using the SwitchField component from the project's Base UI-based form system. This new form field named autoStart should be defined as a boolean type with a default value of false, requiring updates to both the CreateWorkflowFormValues TypeScript interface and the createWorkflowSchema Zod validation schema in lib/validations/workflow.ts. The toggle should be rendered conditionally based on the workflow type, appearing only for planning workflows (workflowType === 'planning'), and should be positioned directly after the existing skipClarification SwitchField in the form layout to maintain consistency with the current UI structure. The toggle's description text should read "Automatically start the workflow immediately after creation" to clearly communicate its purpose to users. When the autoStart field is set to true and the user submits the form via the "Create Workflow" button, the dialog component should invoke the useCreateWorkflow hook with the autoStart option enabled by passing { autoStart: true } as an argument, which will utilize the existing implementation at hooks/queries/use-workflows.ts line 112 that already contains the complete create-then-start orchestration logic including automatic workflow.start() invocation after successful creation. The submit button text should dynamically change from "Create Workflow" to "Create & Start Workflow" when the autoStart toggle is enabled to provide clear user feedback about the action being performed. Importantly, the autoStart field is purely a UI control flag and should NOT be included in the IPC channel payload sent to the Electron main process or persisted to the workflows database table schema -- it only controls the post-creation behavior within the React Query mutation flow. To enable navigation after successful auto-start workflow creation, the dialog's onSuccess callback function signature must be modified to receive the newly created workflow object as an argument (currently it receives no parameters), allowing the parent component in components/workflows/workflows-tab-content.tsx to programmatically navigate the user to the workflow detail page at /workflows/[id] using Next.js's useRouter hook, where they will immediately see their workflow already in the running state with real-time progress updates displayed in the pipeline visualization.

## Validation

- **Word Count**: ~300 words (original ~200 words, ~1.5x expansion)
- **Format**: Single paragraph
- **Intent Preserved**: Yes - core feature unchanged
- **Scope**: No feature creep detected

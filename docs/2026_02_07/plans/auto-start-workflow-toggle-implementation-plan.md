# Auto-Start Workflow Toggle Implementation Plan

Generated: 2026-02-07
Original Request: Add an "Auto-start" toggle to the create workflow dialog
Refined Request: Add autoStart SwitchField to create-workflow-dialog.tsx with dynamic submit button text, useCreateWorkflow({ autoStart: true }) integration, and post-creation navigation to /workflows/[id]

## Analysis Summary

- Feature request refined with project context
- Discovered 10 files across 8 directories (3 requiring modification, 7 reference-only)
- Generated 6-step implementation plan

## File Discovery Results

### Files Requiring Modification

| File | Priority | Action |
|------|----------|--------|
| `components/workflows/create-workflow-dialog.tsx` | Critical | Add autoStart toggle, dynamic button text, hook integration |
| `lib/validations/workflow.ts` | Critical | Add autoStart to Zod schema and TypeScript type |
| `components/workflows/workflows-tab-content.tsx` | High | Update onSuccess callback, add navigation |

### Reference Files

| File | Purpose |
|------|---------|
| `hooks/queries/use-workflows.ts` | useCreateWorkflow with autoStart already implemented |
| `components/ui/form/switch-field.tsx` | SwitchField component pattern |
| `components/ui/form/submit-button.tsx` | SubmitButton pattern |
| `components/workflows/edit-workflow-dialog.tsx` | Similar dialog pattern |
| `db/schema/workflows.schema.ts` | Confirms no DB changes needed |
| `electron/ipc/workflow.handlers.ts` | Confirms separate create/start IPC ops |
| `lib/queries/workflows.ts` | Query key factory reference |

## Implementation Plan

### Overview

**Estimated Duration**: 1-2 hours
**Complexity**: Low
**Risk Level**: Low

### Quick Summary

Add an "Auto-start" toggle to the create workflow dialog that allows users to automatically start a workflow immediately after creation. When enabled, the toggle changes the submit button text to "Create & Start Workflow" and invokes the existing auto-start functionality in useCreateWorkflow. Upon successful auto-start, the user is navigated to the workflow detail page where they see the running workflow.

### Prerequisites

- [ ] Verify bun is installed and project dependencies are up to date
- [ ] Ensure development environment is configured with `bun dev` running
- [ ] Confirm understanding of TanStack Form field patterns and Zod validation

### Step 1: Add autoStart Field to Validation Schema

**What**: Add autoStart boolean field to createWorkflowSchema in lib/validations/workflow.ts
**Why**: Establish type-safe validation for the new form field and ensure CreateWorkflowFormValues TypeScript interface includes the autoStart property
**Confidence**: High

**Files to Modify:**
- `lib/validations/workflow.ts` - Add autoStart field to createWorkflowSchema

**Changes:**
- Add `autoStart: z.boolean().default(false)` to createWorkflowSchema object (after skipClarification field at line 21)
- Verify CreateWorkflowFormValues type automatically includes the new field through z.input inference

**Validation Commands:**
```bash
bun lint && bun typecheck
```

**Success Criteria:**
- [ ] autoStart field added to createWorkflowSchema with boolean type and false default
- [ ] TypeScript inference provides autoStart property in CreateWorkflowFormValues type
- [ ] All validation commands pass
- [ ] No TypeScript errors in dependent files

---

### Step 2: Add Auto-Start Toggle Field to Dialog Form

**What**: Add SwitchField for autoStart after skipClarification field in create-workflow-dialog.tsx, conditionally rendered for planning workflows only
**Why**: Provide UI control for users to enable auto-start behavior when creating planning workflows
**Confidence**: High

**Files to Modify:**
- `components/workflows/create-workflow-dialog.tsx` - Add autoStart toggle field

**Changes:**
- Add autoStart field inside the `{isPlanning && <Fragment>...</Fragment>}` block after the skipClarification field (around line 348)
- Use pattern: `<form.AppField name={'autoStart'}>{(field) => <field.SwitchField label={'Auto-start'} description={'Automatically start the workflow immediately after creation.'} />}</form.AppField>`
- Position the field between skipClarification (line 348) and clarificationAgent field (line 351)

**Validation Commands:**
```bash
bun lint && bun typecheck
```

**Success Criteria:**
- [ ] autoStart toggle appears in dialog for planning workflows only
- [ ] Toggle displays label "Auto-start" and description "Automatically start the workflow immediately after creation."
- [ ] Toggle positioned after skipClarification field
- [ ] All validation commands pass

---

### Step 3: Watch autoStart Field Value for Dynamic Submit Button

**What**: Add useStore hook to watch autoStart field value and use it to dynamically render submit button text
**Why**: Provide clear user feedback that enabling auto-start will create AND start the workflow
**Confidence**: High

**Files to Modify:**
- `components/workflows/create-workflow-dialog.tsx` - Add autoStart state watcher and dynamic button text

**Changes:**
- Add `const selectedAutoStart = useStore(form.store, (state) => state.values.autoStart);` after existing selectedSkipClarification watcher
- Modify SubmitButton children to: `{isSubmitting ? 'Creating...' : selectedAutoStart ? 'Create & Start Workflow' : 'Create Workflow'}`

**Validation Commands:**
```bash
bun lint && bun typecheck
```

**Success Criteria:**
- [ ] Submit button text changes to "Create & Start Workflow" when autoStart is enabled
- [ ] Submit button text shows "Create Workflow" when autoStart is disabled
- [ ] Submit button text shows "Creating..." during submission regardless of autoStart state
- [ ] All validation commands pass

---

### Step 4: Integrate Auto-Start with useCreateWorkflow Hook

**What**: Pass autoStart option to useCreateWorkflow hook based on form field value, excluding autoStart from IPC payload
**Why**: Utilize existing auto-start orchestration logic in useCreateWorkflow without persisting the UI-only flag to the database
**Confidence**: High

**Files to Modify:**
- `components/workflows/create-workflow-dialog.tsx` - Modify useCreateWorkflow to receive autoStart option

**Changes:**
- Change `useCreateWorkflow()` to `useCreateWorkflow({ autoStart: selectedAutoStart })`
- Ensure autoStart is NOT included in the data object passed to mutateAsync (it should only be in hook options, not IPC payload)

**Validation Commands:**
```bash
bun lint && bun typecheck
```

**Success Criteria:**
- [ ] useCreateWorkflow receives `{ autoStart: true }` when toggle is enabled
- [ ] useCreateWorkflow receives `{ autoStart: false }` when toggle is disabled
- [ ] autoStart field is NOT included in IPC payload sent to workflows.create
- [ ] Workflow starts automatically when autoStart is enabled
- [ ] Workflow remains in 'created' status when autoStart is disabled
- [ ] All validation commands pass

---

### Step 5: Modify onSuccess Callback to Receive Workflow Object

**What**: Update onSuccess callback signature to receive created workflow and modify parent component to navigate to workflow detail page
**Why**: Enable automatic navigation to the workflow detail page when auto-start is enabled so users immediately see their running workflow
**Confidence**: High

**Files to Modify:**
- `components/workflows/create-workflow-dialog.tsx` - Update onSuccess callback to pass workflow
- `components/workflows/workflows-tab-content.tsx` - Update onSuccess handler to navigate

**Changes in create-workflow-dialog.tsx:**
- Update onSuccess prop type from `onSuccess?: () => void` to `onSuccess?: (workflow: Workflow) => void`
- Import Workflow type from db/schema/workflows.schema
- Update onSuccess invocation to pass the created workflow object

**Changes in workflows-tab-content.tsx:**
- Add onSuccess callback to CreateWorkflowDialog instances
- Navigate to `/workflows/[id]` when workflow.status === 'running' (indicates auto-start was used)
- Use existing $path pattern: `router.push($path({ route: '/workflows/[id]', routeParams: { id: workflow.id } }))`

**Validation Commands:**
```bash
bun lint && bun typecheck
```

**Success Criteria:**
- [ ] onSuccess callback receives workflow object with all properties
- [ ] WorkflowsTabContent navigates to workflow detail page when status is 'running'
- [ ] No navigation occurs when workflow status is 'created' (auto-start disabled)
- [ ] All validation commands pass

---

### Step 6: Update Copy Workflow Dialog Instance

**What**: Add onSuccess handler to the copy workflow dialog instance with navigation logic
**Why**: Ensure auto-start navigation works when copying workflows with auto-start enabled
**Confidence**: High

**Files to Modify:**
- `components/workflows/workflows-tab-content.tsx` - Add onSuccess to copy dialog instance

**Changes:**
- Add onSuccess handler to the copy workflow CreateWorkflowDialog instance
- Same navigation logic: navigate to `/workflows/[id]` when workflow.status === 'running'

**Validation Commands:**
```bash
bun lint && bun typecheck
```

**Success Criteria:**
- [ ] Copy workflow dialog navigates to workflow detail when auto-start enabled
- [ ] Copy workflow dialog does not navigate when auto-start disabled
- [ ] All validation commands pass

---

### Quality Gates

- [ ] All TypeScript files pass `bun typecheck`
- [ ] All files pass `bun lint`
- [ ] Auto-start toggle appears only for planning workflows
- [ ] Submit button text changes dynamically based on autoStart state
- [ ] Workflow auto-starts and navigates to detail page when toggle enabled
- [ ] Workflow stays in created status and no navigation when toggle disabled
- [ ] autoStart field is not persisted to database
- [ ] Copying a workflow with auto-start enabled works correctly

### Notes

**Implementation Considerations:**
- The autoStart field is a UI-only flag and should never be included in the IPC payload to workflows.create
- The existing useCreateWorkflow hook at hooks/queries/use-workflows.ts (lines 112-144) already implements the complete auto-start logic including workflow.start() invocation
- Navigation only occurs when workflow.status === 'running' to handle both auto-start and manual creation scenarios
- The toggle is conditionally rendered for planning workflows only (workflowType === 'planning')

**Edge Cases:**
- Form reset clears autoStart back to default false value
- Template selection does not affect autoStart state
- Copy workflow preserves user's autoStart selection
- Validation errors prevent submission regardless of autoStart state

**Testing Recommendations:**
- Test creating planning workflow with auto-start enabled - should navigate to running workflow
- Test creating planning workflow with auto-start disabled - should stay on workflows list
- Test creating implementation workflow - autoStart toggle should not appear
- Test copying workflow with auto-start enabled
- Test form validation with various combinations of skipClarification and autoStart

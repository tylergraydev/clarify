# Implementation Plan: Create New Custom Agent Feature

## Overview

**Estimated Duration**: 4-5 days
**Complexity**: Medium-High
**Risk Level**: Medium

## Quick Summary

- Add "Create Agent" button to the agents page with a comprehensive creation dialog
- Extend the existing `AgentEditorDialog` to support both create and edit modes (following the template-editor-dialog pattern)
- Add duplicate and delete functionality to agent cards with appropriate confirmation dialogs
- Add visual distinction between built-in and custom agents throughout the UI
- Ensure backend handlers properly support custom agent creation with all required fields

## Prerequisites

- [ ] Verify the existing `useCreateAgent` mutation hook works correctly with the `agent:create` IPC handler
- [ ] Confirm the agents repository `create` method properly handles all fields including `allowedTools` (managed via `agentTool` handlers)
- [ ] Review the `createAgentSchema` in `lib/validations/agent.ts` for completeness

## Implementation Steps

### Step 1: Verify and Enhance Backend Agent Creation Handler

**What**: Audit the existing `agent:create` IPC handler to ensure it properly handles custom agent creation with all required fields and defaults.
**Why**: The backend must correctly set `isBuiltIn: false` (via `builtInAt: null`), `version: 1`, and `isActive: true` (via `deactivatedAt: null`) for user-created agents.
**Confidence**: High

**Files to Modify:**
- `electron/ipc/agent.handlers.ts` - Verify create handler sets proper defaults

**Changes:**
- Verify the `create` handler in `agent.handlers.ts` does not set `builtInAt` for user-created agents (defaults to null)
- Confirm that new agents are created with `deactivatedAt: null` (active by default)
- Verify version defaults to 1 in the repository layer (already in schema default)

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] Create handler does not set `builtInAt` for new agents
- [ ] New agents are active by default (`deactivatedAt` is null)
- [ ] All validation commands pass

---

### Step 2: Add Duplicate IPC Handler for Agents

**What**: Add a new `agent:duplicate` IPC handler that creates a copy of an existing agent with a modified name.
**Why**: Users need the ability to duplicate existing agents (built-in or custom) as a starting point for new custom agents.
**Confidence**: High

**Files to Modify:**
- `electron/ipc/channels.ts` - Add `duplicate` channel to agent namespace
- `electron/preload.ts` - Add duplicate method to agent API
- `types/electron.d.ts` - Add type definition for duplicate method
- `electron/ipc/agent.handlers.ts` - Implement duplicate handler

**Changes:**
- Add `duplicate: "agent:duplicate"` to `IpcChannels.agent` object in both channels.ts and preload.ts
- Add `duplicate(id: number): Promise<AgentOperationResult>` method to the agent API interface
- Implement handler that:
  - Fetches the source agent by ID
  - Creates a new agent with copied data but modified name (append " (Copy)")
  - Sets `builtInAt: null`, `parentAgentId: null`, `version: 1`
  - Returns the newly created agent

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] `agent:duplicate` channel exists in both channel files
- [ ] Duplicate method available on ElectronAPI interface
- [ ] Handler implementation creates proper copy with unique name
- [ ] All validation commands pass

---

### Step 3: Add useDuplicateAgent Mutation Hook

**What**: Create a TanStack Query mutation hook for duplicating agents.
**Why**: The UI needs a reactive way to trigger agent duplication and handle cache invalidation.
**Confidence**: High

**Files to Modify:**
- `hooks/queries/use-agents.ts` - Add `useDuplicateAgent` mutation hook

**Changes:**
- Add `useDuplicateAgent` function following the existing mutation patterns
- Call `api.agent.duplicate(id)` in the mutation function
- Handle success with toast notification and cache invalidation
- Handle error with appropriate toast error message

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] `useDuplicateAgent` hook exports from the file
- [ ] Hook follows existing mutation patterns for error handling and cache invalidation
- [ ] All validation commands pass

---

### Step 4: Create createAgentFormSchema for Form Validation

**What**: Add a Zod schema specifically for the create agent form that includes all required fields with proper validation.
**Why**: The create form needs comprehensive validation including name uniqueness check pattern and type selection.
**Confidence**: High

**Files to Modify:**
- `lib/validations/agent.ts` - Add `createAgentFormSchema`

**Changes:**
- Add `createAgentFormSchema` that extends/mirrors `createAgentSchema` but designed for form input
- Include fields: `name`, `displayName`, `description`, `type`, `systemPrompt`, `color`
- Ensure proper validation messages for each field
- Export the schema and its inferred type

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] `createAgentFormSchema` is exported
- [ ] All required fields have proper validation rules
- [ ] Type inference works correctly
- [ ] All validation commands pass

---

### Step 5: Extend AgentEditorDialog to Support Create Mode

**What**: Modify the `AgentEditorDialog` component to support both "create" and "edit" modes, similar to `TemplateEditorDialog`.
**Why**: This follows the established pattern and allows reusing the same dialog for both creating new agents and editing existing ones.
**Confidence**: Medium

**Files to Modify:**
- `components/agents/agent-editor-dialog.tsx` - Add create mode support

**Changes:**
- Add `mode: "create" | "edit"` prop to the component interface
- Add optional `initialData` prop for duplicating agents
- Make `agent` prop optional (only required for edit mode)
- Add form fields for `name` and `type` (only shown in create mode)
- Conditionally render title/description based on mode ("Create Agent" vs "Edit Agent")
- Use `createAgentFormSchema` for create mode, `updateAgentSchema` for edit mode
- Call `useCreateAgent` mutation for create mode, `useUpdateAgent` for edit mode
- Disable name field in edit mode (agent internal name cannot be changed)
- Add type selector using the `agentTypes` from schema

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] Dialog supports both "create" and "edit" modes via prop
- [ ] Create mode shows name and type fields
- [ ] Edit mode hides/disables name field
- [ ] Correct mutation is called based on mode
- [ ] Form validation uses appropriate schema per mode
- [ ] All validation commands pass

---

### Step 6: Add Create Agent Button to Agents Page

**What**: Add a prominent "Create Agent" button to the agents page header that opens the AgentEditorDialog in create mode.
**Why**: Users need an obvious entry point to create new custom agents.
**Confidence**: High

**Files to Modify:**
- `app/(app)/agents/page.tsx` - Add Create Agent button

**Changes:**
- Add a header section similar to templates page with title, description, and button
- Include `TemplateEditorDialog` replacement with `AgentEditorDialog` in create mode
- Add "Create Agent" button with Plus icon as the dialog trigger
- Add keyboard shortcut hint (Ctrl+N) to button similar to templates page
- Wire up keyboard shortcut handler for Ctrl+N

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] Create Agent button appears in page header
- [ ] Clicking button opens AgentEditorDialog in create mode
- [ ] Button styling matches the templates page pattern
- [ ] Keyboard shortcut works
- [ ] All validation commands pass

---

### Step 7: Create ConfirmDeleteAgentDialog Component

**What**: Create a confirmation dialog for deleting custom agents, following the pattern of `ConfirmDeleteDialog` for templates.
**Why**: Deleting agents is a destructive action that requires user confirmation.
**Confidence**: High

**Files to Create:**
- `components/agents/confirm-delete-agent-dialog.tsx` - New confirmation dialog

**Changes:**
- Create dialog component following `ConfirmDeleteDialog` pattern
- Accept props: `agentName`, `isOpen`, `isLoading`, `onConfirm`, `onOpenChange`
- Add warning message about permanent deletion
- Include Cancel and Delete buttons with appropriate styling
- Use `alertdialog` role for accessibility

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] Dialog component is created and exported
- [ ] Props interface matches the pattern from templates
- [ ] Accessibility attributes are properly set
- [ ] All validation commands pass

---

### Step 8: Add Duplicate and Delete Buttons to AgentCard

**What**: Extend the `AgentCard` component to include Duplicate and Delete action buttons for custom agents.
**Why**: Users need to be able to duplicate any agent and delete custom agents directly from the card.
**Confidence**: Medium

**Files to Modify:**
- `components/agents/agent-card.tsx` - Add Duplicate and Delete buttons

**Changes:**
- Add `onDuplicate?: (agent: Agent) => void` prop to the component interface
- Add `onDelete?: (agentId: number) => void` prop to the component interface
- Add Duplicate button (Copy icon) that calls `onDuplicate` - shown for all agents
- Add Delete button (Trash2 icon) that calls `onDelete` - only shown for custom agents (`builtInAt === null`)
- Determine if agent is custom by checking `builtInAt === null`
- Add visual indicator badge for "Custom" agents (similar to "Customized" badge but different)

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] Duplicate button appears on all agent cards
- [ ] Delete button only appears on custom agent cards
- [ ] Visual distinction between built-in and custom agents is clear
- [ ] Callbacks are properly wired
- [ ] All validation commands pass

---

### Step 9: Integrate Delete and Duplicate Functionality in Agents Page

**What**: Wire up the delete and duplicate functionality in the agents page, including the duplicate dialog and delete confirmation.
**Why**: The page needs to handle the user interactions and state management for these new features.
**Confidence**: Medium

**Files to Modify:**
- `app/(app)/agents/page.tsx` - Add delete/duplicate state and handlers

**Changes:**
- Add `useDeleteAgent` and `useDuplicateAgent` mutation imports
- Add state for delete confirmation dialog (`agentToDelete`, `isDeleteDialogOpen`)
- Add state for duplicate dialog data (`duplicateAgentData`, `duplicateDialogTriggerRef`)
- Create `handleDeleteClick` handler that opens delete confirmation dialog
- Create `handleConfirmDelete` handler that calls delete mutation
- Create `handleDuplicateClick` handler that opens duplicate dialog with pre-filled data
- Update `AgentGridItem` to pass new handlers to `AgentCard`
- Add `ConfirmDeleteAgentDialog` component with proper state binding
- Add hidden duplicate trigger button with `AgentEditorDialog` in create mode with initialData

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] Delete confirmation dialog opens when Delete button is clicked
- [ ] Agent is deleted after confirmation
- [ ] Duplicate dialog opens with pre-filled data when Duplicate button is clicked
- [ ] New agent is created after duplicate form submission
- [ ] Toast notifications appear for success/error states
- [ ] All validation commands pass

---

### Step 10: Add Visual Distinction for Custom vs Built-in Agents

**What**: Add clear visual indicators throughout the agents UI to distinguish custom agents from built-in agents.
**Why**: Users need to easily identify which agents they created vs. which are system defaults.
**Confidence**: High

**Files to Modify:**
- `components/agents/agent-card.tsx` - Add "Custom" badge
- `components/agents/agent-editor-dialog.tsx` - Show "Custom Agent" badge in header for custom agents

**Changes:**
- In AgentCard: Add a "Custom" badge when `builtInAt === null` (different styling from "Customized")
- Consider using a different color or icon to distinguish from "Built-in"
- In AgentEditorDialog: Show "Custom Agent" badge instead of "Built-in Agent" when editing a custom agent
- Ensure consistent visual language across all agent-related components

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] Custom agents display a "Custom" badge
- [ ] Built-in agents display a "Built-in Agent" badge in dialogs
- [ ] Visual distinction is clear and consistent
- [ ] All validation commands pass

---

### Step 11: Add Result Count Badge and Empty State Enhancements

**What**: Add a result count badge to the page header and improve empty states to encourage agent creation.
**Why**: Provides helpful context about the number of agents and guides users to create their first agent.
**Confidence**: High

**Files to Modify:**
- `app/(app)/agents/page.tsx` - Add result count and enhance empty state

**Changes:**
- Add Badge component showing agent count in the page header (matching templates pattern)
- Update the "No agents yet" empty state to include a "Create your first agent" action button
- Add skip link for keyboard navigation accessibility

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] Agent count badge appears in page header
- [ ] Empty state includes create action button
- [ ] Skip link for accessibility is present
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint`
- [ ] Manual testing: Create a new custom agent with all fields filled
- [ ] Manual testing: Duplicate a built-in agent and verify copy is created
- [ ] Manual testing: Duplicate a custom agent and verify copy is created
- [ ] Manual testing: Delete a custom agent with confirmation
- [ ] Manual testing: Verify built-in agents cannot be deleted
- [ ] Manual testing: Verify visual distinction between custom and built-in agents
- [ ] Manual testing: Verify form validation messages appear correctly
- [ ] Manual testing: Verify keyboard shortcuts work (Ctrl+N for create)

## Notes

- The existing `useCreateAgent` hook and `agent:create` IPC handler already exist and may only need minor verification rather than implementation
- The `agent:duplicate` handler is new and will need to be implemented from scratch
- The `AgentEditorDialog` refactor to support create mode is the most complex change and follows the `TemplateEditorDialog` pattern closely
- Built-in agents are identified by `builtInAt !== null`, while custom agents have `builtInAt === null`
- Customized built-in agents have `parentAgentId !== null` - this is different from fully custom agents
- The tools management (`AgentToolsManager`) and skills management (`AgentSkillsManager`) are already implemented and can be reused in create mode after the agent is created (or managed separately post-creation)
- Consider whether tools and skills should be configurable during create or only after creation - current implementation suggests they are managed separately via the collapsible sections after the agent exists

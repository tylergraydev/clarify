# Step 2: AI-Powered File Discovery

**Started**: 2026-01-29T00:02:00Z
**Completed**: 2026-01-29T00:03:00Z
**Status**: Completed
**Duration**: ~60 seconds

## Refined Request Input

The Clarify application requires implementation of a complete "Create New Custom Agent" feature that enables users to define entirely new specialist agents from scratch, distinct from the existing functionality that only allows customization of built-in agents...

## Discovery Statistics

- Directories explored: 12
- Candidate files examined: 45+
- Relevant files discovered: 26
- Files organized by priority: 4 categories

## Discovered Files by Priority

### Critical Priority (Core Implementation - MUST be modified)

| File                                        | Relevance                | Required Modifications                                                                       |
| ------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------- |
| `app/(app)/agents/page.tsx`                 | Main agents page         | Add "Create Agent" button, integrate create dialog, add visual distinction for custom agents |
| `components/agents/agent-editor-dialog.tsx` | Editor dialog for agents | Add create mode support, add name/type fields, handle creation validation                    |
| `components/agents/agent-card.tsx`          | Agent display card       | Add Duplicate/Delete buttons, add custom vs built-in visual indicator                        |
| `hooks/queries/use-agents.ts`               | TanStack Query hooks     | Verify useCreateAgent cache invalidation, add useDuplicateAgent if needed                    |
| `lib/validations/agent.ts`                  | Zod validation schemas   | Add createAgentFormSchema for creation form                                                  |

### High Priority (Supporting Implementation)

| File                                   | Relevance               | Required Modifications                                                                 |
| -------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------- |
| `electron/ipc/agent.handlers.ts`       | Backend IPC handlers    | Verify version starts at 1, confirm isActive defaults, add duplicate handler if needed |
| `db/repositories/agents.repository.ts` | Database access layer   | Verify create method handles all fields                                                |
| `db/schema/agents.schema.ts`           | Database schema         | None expected - already supports custom agents                                         |
| `electron/ipc/channels.ts`             | IPC channel definitions | Add agent:duplicate channel if needed                                                  |
| `electron/preload.ts`                  | Electron preload script | Add duplicate method if needed                                                         |
| `types/electron.d.ts`                  | TypeScript definitions  | Add duplicate method signature if needed                                               |

### Medium Priority (Reference/Pattern Files)

| File                                               | Relevance                              | Pattern to Follow                                              |
| -------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------- |
| `components/templates/template-editor-dialog.tsx`  | Reference for create/edit mode         | Uses `EditorMode = "create" \| "edit"` with `initialData` prop |
| `components/templates/template-card.tsx`           | Reference for Duplicate/Delete buttons | Has onDuplicate and onDelete callbacks                         |
| `components/templates/confirm-delete-dialog.tsx`   | Reference for delete confirmation      | Controlled dialog with loading state                           |
| `components/agents/confirm-reset-agent-dialog.tsx` | Existing confirmation dialog           | Alert dialog pattern for destructive actions                   |
| `lib/queries/agents.ts`                            | Query key factory                      | None expected - already comprehensive                          |
| `components/agents/agent-color-picker.tsx`         | Color selection component              | None - will be reused                                          |
| `components/agents/agent-tools-manager.tsx`        | Tools management                       | Handle case where agentId is undefined (new agent)             |
| `components/agents/agent-skills-manager.tsx`       | Skills management                      | Handle case where agentId is undefined (new agent)             |
| `lib/forms/form-hook.ts`                           | TanStack Form config                   | None - will use existing pattern                               |

### Low Priority (May Need Updates)

| File                                | Relevance        | Notes                    |
| ----------------------------------- | ---------------- | ------------------------ |
| `db/schema/agent-tools.schema.ts`   | Tools schema     | None expected            |
| `db/schema/agent-skills.schema.ts`  | Skills schema    | None expected            |
| `hooks/queries/use-agent-tools.ts`  | Tools hooks      | Edge case for new agents |
| `hooks/queries/use-agent-skills.ts` | Skills hooks     | Edge case for new agents |
| `components/ui/dialog.tsx`          | Base dialog      | None - use as-is         |
| `components/ui/button.tsx`          | Button component | None - use as-is         |

## Key Patterns Discovered

### 1. Create/Edit Mode Pattern

The `TemplateEditorDialog` uses:

```typescript
mode: "create" | "edit"
initialData?: TemplateData // For duplication
```

### 2. Built-in vs Custom Distinction

- Built-in entities have `builtInAt` timestamp set
- Custom entities have `builtInAt: null`
- Pattern exists across agents and templates

### 3. Deletion Protection

Built-in agents cannot be deleted (enforced in handlers). Only custom agents (`builtInAt === null`) can be deleted.

### 4. Duplicate Pattern

Templates use `onDuplicate` callback that passes full entity to parent, which opens editor in create mode with pre-filled `initialData`.

### 5. Confirmation Dialogs

Destructive actions use controlled dialogs with loading states.

## Integration Points Identified

### Agent Creation Flow

```
Create button -> Dialog opens in create mode -> Form submission ->
useCreateAgent mutation -> IPC agent:create -> Repository.create ->
Cache invalidation
```

### Agent Duplication Flow

```
Duplicate button on card -> Pass agent data to parent ->
Parent opens dialog in create mode with initialData ->
Same flow as creation with pre-filled values
```

### Agent Deletion Flow (new)

```
Delete button on card (custom only) -> Confirm dialog opens ->
useDeleteAgent mutation -> IPC agent:delete -> Repository.delete ->
Cache invalidation
```

## Existing Functionality to Leverage

- `useCreateAgent` mutation hook already exists
- IPC `agent:create` channel is implemented with validation
- Repository `create` method handles all required fields
- `agentTypes` and `agentColors` constants defined in schema
- `useDeleteAgent` hook exists but may need verification

# Step 2: AI-Powered File Discovery

**Started**: 2026-01-31T00:01:00Z
**Completed**: 2026-01-31T00:02:00Z
**Duration**: ~60 seconds
**Status**: Completed

## Refined Request Used as Input

When users attempt to import an agent whose internal name already exists in the application, the system currently rejects the import with an error toast message, requiring users to manually edit the agent's YAML file, save it, and attempt the import again. This creates unnecessary friction in the workflow, particularly for users working with agent templates or migrating agents between projects. The feature should enable users to edit the agent's internal name (kebab-case identifier) directly within the `ImportAgentDialog` component before confirming the import, allowing them to resolve naming conflicts inline without leaving the application or modifying source files.

## Discovery Analysis Summary

- Directories explored: 15+
- Candidate files examined: 35+
- Highly relevant files: 8
- Supporting/reference files: 12

---

## Files to Modify (Critical/High Priority)

| File | Priority | Reason |
|------|----------|--------|
| `components/agents/import-agent-dialog.tsx` | Critical | Main dialog component that needs the editable name field. Currently displays static name at line 159. Must add input field, local state, and validation UI. |
| `hooks/use-agent-import-export.ts` | Critical | Hook that handles import confirmation at line 145-162. Must update `handleImportConfirm` to accept and apply modified name to the parsed data before calling IPC. |
| `hooks/use-agent-dialogs.ts` | High | Manages dialog state including `ImportDialogState` (lines 47-51). May need to add `modifiedName` field to track user edits to the agent name. |
| `lib/validations/agent-import.ts` | High | Contains `KEBAB_CASE_PATTERN` regex (line 9) and `agentImportSchema` (lines 41-71). Validation logic must be exported and reused for real-time field validation. |

## Supporting Files (May Need Updates)

| File | Priority | Reason |
|------|----------|--------|
| `app/(app)/agents/_components/agents-dialogs.tsx` | Medium | Container component that renders `ImportAgentDialog`. Props interface may need adjustment if dialog signature changes. |
| `app/(app)/agents/page.tsx` | Medium | Parent page that orchestrates import flow. May need to pass additional callbacks for name modification. |
| `hooks/queries/use-agents.ts` | Medium | Contains `useImportAgent` mutation (lines 466-521) and `useAllAgents` query. May reuse `useAllAgents` for duplicate checking. |

## Reference Files (For Patterns Only)

| File | Priority | Reason |
|------|----------|--------|
| `components/ui/form/text-field.tsx` | Low | TanStack Form field component pattern reference |
| `components/ui/input.tsx` | Low | Base Input component with `isInvalid` prop for validation styling |
| `electron/ipc/agent.handlers.ts` | Low | IPC handler showing duplicate name check pattern (lines 697-709). No changes needed. |
| `db/repositories/agents.repository.ts` | Low | Repository with `findByName` method (line 116-117) |
| `lib/utils/agent-markdown.ts` | Low | `ParsedAgentMarkdown` type definition at lines 74-77 |
| `types/electron.d.ts` | Low | TypeScript types - `AgentImportInput` interface (lines 62-92) |
| `electron/ipc/channels.ts` | Low | IPC channel definitions - will reuse `agent:list` for name availability check |
| `db/schema/agents.schema.ts` | Low | Database schema showing `name` column is unique (line 26) |

---

## Architecture Insights

### Key Patterns Discovered

1. **Import Flow**: File dialog → parse markdown → validate → open preview dialog → confirm → IPC handler creates agent
2. **Validation Pattern**: Uses Zod schemas with `safeParse()` returning structured errors/warnings
3. **Name Validation**: Kebab-case regex pattern: `/^[a-z][a-z0-9-]*$/`
4. **Duplicate Check**: Done in IPC handler via `agentsRepository.findByName()` - returns error if exists
5. **Dialog State**: Managed via reducer pattern in `useAgentDialogs` hook
6. **Component Structure**: Dialog receives parsed data and validation result as props

### Existing Similar Functionality

- Agent name is already validated for kebab-case format in `agentImportSchema`
- Duplicate name check exists in `agent.handlers.ts` at line 697-709
- The validation result is already passed to the dialog and displayed

### Integration Points

1. **Name input in dialog**: Add between lines 145-161 in `import-agent-dialog.tsx` (Agent Identity section)
2. **State management**: Add local state or extend `ImportDialogState` in `use-agent-dialogs.ts`
3. **Validation**: Reuse `KEBAB_CASE_PATTERN` from `agent-import.ts` for format validation
4. **Duplicate check**: Call `api.agent.list()` and filter by name for real-time availability check
5. **Apply modified name**: Update `handleImportConfirm` in `use-agent-import-export.ts` to merge modified name into parsed data

---

## File Contents Analysis

### `components/agents/import-agent-dialog.tsx`

**Current Functionality:**
- Renders preview dialog for agent import with validation errors/warnings display
- Shows agent identity (name, displayName, color, type), tools, skills, hooks, and system prompt
- Has Import/Cancel buttons with disabled state based on validation

**Key Code Points:**
- Line 159: Static name display `<p className={'font-mono text-sm text-muted-foreground'}>{frontmatter.name}</p>`
- Lines 62-64: `hasErrors` computed from `validationResult`
- Line 64: `isImportDisabled` computed from `isLoading || hasErrors || !parsedData`
- Line 66-70: `handleImportClick` calls `onImport(parsedData)`

**Required Changes:**
- Add editable input field for the agent name
- Add local state for the edited name
- Implement real-time validation (kebab-case + duplicate check)
- Update the data passed to `onImport` with the modified name

### `hooks/use-agent-import-export.ts`

**Current Functionality:**
- Manages import/export operations for agents
- Opens file dialog, parses markdown, validates, and calls IPC

**Key Code Points:**
- Lines 145-162: `handleImportConfirm` receives `ParsedAgentMarkdown` and passes directly to mutation
- Line 147: `importAgentMutation.mutate(data, {...})`

**Required Changes:**
- The `onImportConfirm` callback receives the parsed data
- Must modify to accept an optional modified name parameter
- Or the dialog can update the parsed data's `frontmatter.name` before calling

### `lib/validations/agent-import.ts`

**Current Functionality:**
- Defines Zod schema for agent import validation
- Validates kebab-case name format
- Returns structured validation result with errors and warnings

**Key Exports:**
- `KEBAB_CASE_PATTERN` regex (line 9)
- `agentImportSchema` Zod schema
- `validateAgentImport()` function
- `prepareAgentImportData()` function

**Required Changes:**
- Export `KEBAB_CASE_PATTERN` for reuse in the dialog component
- Or create a validation helper function for name format checking

---

## Discovery Validation

| Metric | Value | Status |
|--------|-------|--------|
| Total files discovered | 20 | PASSED (min 3) |
| Files requiring modification | 4 | PASSED |
| File paths validated | 20/20 exist | PASSED |
| Coverage assessment | All layers covered | PASSED |

---
**Progress Marker**: MILESTONE:STEP_2_COMPLETE

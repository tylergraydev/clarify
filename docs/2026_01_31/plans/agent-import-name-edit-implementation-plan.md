# Editable Agent Name in Import Dialog - Implementation Plan

**Generated**: 2026-01-31
**Original Request**: Allow editing agent internal name during import when name conflicts exist
**Refined Request**: Enable users to edit the agent's internal name (kebab-case identifier) directly within the ImportAgentDialog component before confirming import, with real-time validation against kebab-case pattern and duplicate names.

---

## Overview

**Estimated Duration**: 4-6 hours
**Complexity**: Medium
**Risk Level**: Low

## Quick Summary

- Add an editable text input field for the agent internal name (kebab-case identifier) in the ImportAgentDialog component
- Implement real-time validation against kebab-case pattern and duplicate agent names using existing queries
- Update the import confirmation flow to apply the modified name before sending to the IPC handler
- No changes to IPC handlers, database schema, or core import logic required

## Prerequisites

- [ ] Familiarity with the existing import dialog flow in `components/agents/import-agent-dialog.tsx`
- [ ] Understanding of the validation patterns in `lib/validations/agent-import.ts`
- [ ] Access to the `useAllAgents` hook for duplicate checking

---

## File Discovery Results

### Files to Modify

| File | Priority | Reason |
|------|----------|--------|
| `components/agents/import-agent-dialog.tsx` | Critical | Main dialog - add editable name field with validation |
| `hooks/use-agent-import-export.ts` | Critical | Handle modified name in import confirmation |
| `lib/validations/agent-import.ts` | High | Export KEBAB_CASE_PATTERN for reuse |

### Reference Files

| File | Purpose |
|------|---------|
| `components/ui/input.tsx` | Base Input component with `isInvalid` prop |
| `hooks/queries/use-agents.ts` | `useAllAgents` query for duplicate checking |

---

## Implementation Steps

### Step 1: Export KEBAB_CASE_PATTERN from Validation Module

**What**: Export the existing KEBAB_CASE_PATTERN regex constant from the agent-import validation module so it can be reused in the dialog component for real-time validation.

**Why**: The pattern is already defined and validated, avoiding duplication of regex logic. Exporting it allows consistent validation across the import dialog and the backend validation.

**Confidence**: High

**Files:**
- `lib/validations/agent-import.ts` - Change `const KEBAB_CASE_PATTERN` to `export const KEBAB_CASE_PATTERN`

**Changes:**
- Export the KEBAB_CASE_PATTERN constant (currently private)
- No other changes to the file

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] KEBAB_CASE_PATTERN is exported from the module
- [ ] Existing validation logic continues to work
- [ ] All validation commands pass

---

### Step 2: Add Editable Name Field State and Validation to ImportAgentDialog

**What**: Add local state management for the editable agent name field with real-time validation against the kebab-case pattern and duplicate agent names.

**Why**: The dialog needs to track the user-modified name separately from the original parsed data, validate it in real-time, and display appropriate error messages.

**Confidence**: High

**Files:**
- `components/agents/import-agent-dialog.tsx` - Add state, validation logic, and UI for editable name

**Changes:**
- Import `useState`, `useEffect`, `useMemo` from React
- Import `KEBAB_CASE_PATTERN` from `@/lib/validations/agent-import`
- Import `Input` from `@/components/ui/input`
- Import `useAllAgents` hook from `@/hooks/queries/use-agents`
- Add `modifiedName` state initialized from `parsedData?.frontmatter.name`
- Add `nameError` state to track validation errors
- Create `existingAgentNames` Set from `useAllAgents` data for duplicate checking
- Add validation effect that checks: (1) kebab-case pattern match, (2) no duplicate names
- Replace static name display at line 159 with Input component
- Add error message display below the input field
- Update `isImportDisabled` to include `nameError` check
- Modify `handleImportClick` to pass modified name

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Editable input field displays the agent name
- [ ] Input validates against kebab-case pattern in real-time
- [ ] Input validates against existing agent names for duplicates
- [ ] Error message displays below input when validation fails
- [ ] Import button is disabled when name validation fails
- [ ] All validation commands pass

---

### Step 3: Update ImportAgentDialogProps to Support Modified Name Callback

**What**: Update the dialog props interface and callback to pass the potentially modified agent name when confirming import.

**Why**: The parent component (via useAgentImportExport) needs to receive the modified name so it can update the parsed data before sending to the IPC handler.

**Confidence**: High

**Files:**
- `components/agents/import-agent-dialog.tsx` - Update props interface and callback invocation

**Changes:**
- Modify `onImport` prop type to accept an optional second parameter for the modified name: `onImport: (data: ParsedAgentMarkdown, modifiedName?: string) => void`
- Update `handleImportClick` to pass `modifiedName` when it differs from the original name
- Ensure callback only passes modified name when it has actually changed

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Props interface updated with optional modifiedName parameter
- [ ] Callback passes modified name only when changed
- [ ] All validation commands pass

---

### Step 4: Update useAgentImportExport Hook to Apply Modified Name

**What**: Modify the `handleImportConfirm` callback in the useAgentImportExport hook to accept and apply the modified name to the parsed data before sending to the import mutation.

**Why**: The hook is responsible for preparing the final import payload. It needs to update the frontmatter.name field if the user provided a modified name.

**Confidence**: High

**Files:**
- `hooks/use-agent-import-export.ts` - Update handleImportConfirm to handle modified name

**Changes:**
- Update `onImportConfirm` type in `UseAgentImportExportReturn` interface to accept optional `modifiedName` parameter
- Modify `handleImportConfirm` callback to accept `(data: ParsedAgentMarkdown, modifiedName?: string)`
- When `modifiedName` is provided, create a new data object with `frontmatter.name` updated to the modified name
- Pass the updated data to `importAgentMutation.mutate()`

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Hook interface updated to support modified name
- [ ] Modified name is applied to parsed data before import
- [ ] Original parsed data is not mutated (immutable update)
- [ ] All validation commands pass

---

### Step 5: Sync Name State on Dialog Open and Reset on Close

**What**: Ensure the editable name state properly syncs with the parsed data when the dialog opens and resets when closed.

**Why**: When the dialog opens with new parsed data, the name field should reflect the current agent name. When closed, state should be cleared to prevent stale data on the next open.

**Confidence**: High

**Files:**
- `components/agents/import-agent-dialog.tsx` - Add effect to sync state with props

**Changes:**
- Add `useEffect` that syncs `modifiedName` state when `parsedData?.frontmatter.name` changes
- Clear `nameError` when dialog closes (`isOpen` becomes false)
- Handle edge case where dialog opens with null parsedData

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Name field shows correct value when dialog opens with new data
- [ ] State resets properly when dialog closes
- [ ] No stale data persists between import attempts
- [ ] All validation commands pass

---

### Step 6: Add Visual Styling and Accessibility for Name Field

**What**: Style the editable name field to match the dialog's visual design and ensure proper accessibility attributes.

**Why**: The input should be visually consistent with the existing dialog styling and accessible to screen readers.

**Confidence**: High

**Files:**
- `components/agents/import-agent-dialog.tsx` - Add styling and accessibility attributes

**Changes:**
- Apply font-mono styling to match the current static name display
- Add appropriate aria-label and aria-describedby attributes
- Add descriptive label text above the input (e.g., "Internal Name")
- Style error message with destructive color variant
- Ensure input has proper focus ring styling via existing Input component variants

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Input uses monospace font matching original display
- [ ] Error messages are styled with destructive color
- [ ] Accessibility attributes are present
- [ ] Visual integration matches existing dialog design
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm typecheck`
- [ ] All files pass `pnpm lint`
- [ ] Manual testing: Import an agent file, modify the name, verify validation errors appear for invalid formats
- [ ] Manual testing: Enter a duplicate name, verify duplicate error appears
- [ ] Manual testing: Modify to a valid unique name, confirm import succeeds with new name
- [ ] Manual testing: Verify original file on disk is not modified (only database reflects new name)

---

## Notes

- **Edge Case - Original Name Valid**: When the original name has no conflicts, the field should still be editable but not show errors
- **Edge Case - Empty Name**: Empty names should show the kebab-case validation error
- **Edge Case - Case Sensitivity**: Agent names are case-sensitive for uniqueness checks as per existing repository logic
- **UX Consideration**: The duplicate check uses `useAllAgents` which may include deactivated agents; this matches the existing IPC handler behavior
- **Performance**: The duplicate check builds a Set from all agents; this is efficient for the expected agent counts but could be optimized with a dedicated IPC query for very large agent libraries
- **No IPC Changes**: This implementation deliberately avoids adding a new `agent:checkName` IPC channel to minimize scope; the client-side check using cached agent data is sufficient for the UI validation, and the server-side check in the import handler serves as the authoritative validation

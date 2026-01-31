---
allowed-tools: Task(subagent_type:Explore), Task(subagent_type:general-purpose), AskUserQuestion(*), TodoWrite(*)
argument-hint: '"Feature Name" [--fix]'
description: Audit a feature's business logic for correctness - data flow, cache invalidation, form completeness, and action behavior
---

You are a business logic audit orchestrator. You coordinate subagents to trace data flow,
verify cache invalidation, validate form completeness, and ensure actions work correctly.
You do NOT do any file reading, searching, or code analysis yourself - you delegate ALL work
to specialized subagents.

@CLAUDE.MD

## Command Usage

```
/audit-logic "Feature Name" [--fix]
```

**Arguments**:

- `"Feature Name"` (required): The feature to audit (in quotes)
  - Example: `"Create Agent Dialog"`
  - Example: `"Edit Workflow Form"`
  - Example: `"Delete Project Action"`
  - Example: `"Import Template Feature"`
- `--fix`: Automatically fix issues after reporting (requires user confirmation)

**Examples**:

```
/audit-logic "Create Agent Dialog"
/audit-logic "Edit Project Form" --fix
/audit-logic "Delete Workflow Action"
/audit-logic "Import Agent Feature" --fix
```

## What This Command Validates

Unlike `/audit-feature` (which checks code conventions), this command validates **business logic correctness**:

1. **Data Flow Completeness**
   - Are ALL form fields captured in the form state?
   - Are ALL form values passed to the mutation?
   - Are ALL mutation parameters sent to the IPC handler?
   - Are ALL IPC handler parameters persisted to the database?
   - Are there any fields defined in the schema but not captured in the form?

2. **Cache Invalidation Correctness**
   - After mutations, are the RIGHT queries being invalidated?
   - Are related queries (list, detail, by-project, etc.) being invalidated?
   - Is cache invalidation using `_def` patterns for partial matching?
   - Are there any stale data scenarios after mutations?

3. **Form Validation Completeness**
   - Are ALL required fields marked as required in the Zod schema?
   - Are ALL validation rules applied (min/max length, patterns, etc.)?
   - Are validation error messages user-friendly and accurate?
   - Is validation happening at the right layer (form vs repository)?

4. **Action Behavior Correctness**
   - When user clicks a button, does the expected action happen?
   - Are success/error toasts showing appropriate messages?
   - Are loading states displayed during async operations?
   - Are disabled states applied correctly (during submission, etc.)?
   - Does the dialog close at the right time?

5. **Error Handling**
   - Are IPC errors propagated to the UI?
   - Are error toasts shown to the user?
   - Are validation errors displayed next to form fields?
   - Are network/database errors handled gracefully?

## Orchestrator Principles

**You are the orchestrator. You delegate, not execute.**

1. **NEVER read files directly** - Use Explore agents for file discovery
2. **NEVER analyze code directly** - Use general-purpose agents for analysis
3. **ALWAYS ask questions interactively** - Use AskUserQuestion for clarifications
4. **Your role is to**: Parse input, dispatch agents, collect results, ask clarifying questions, present summaries

## Orchestration Workflow

### Phase 1: Input Validation

**1. Parse Arguments from $ARGUMENTS**:

- Extract feature name (text in quotes)
- Parse optional flag (--fix)
- Validate feature name is provided

**2. If no feature name provided**: Stop with error message:

```
Error: Feature name required.

Usage: /audit-logic "Feature Name" [--fix]

Examples:
  /audit-logic "Create Agent Dialog"
  /audit-logic "Edit Project Form" --fix
  /audit-logic "Delete Workflow Action"
```

**3. Derive Search Terms**:

From the feature name, extract keywords for file discovery:
- `"Create Agent Dialog"` → keywords: `create`, `agent`, `dialog`
- `"Edit Workflow Form"` → keywords: `edit`, `workflow`, `form`
- `"Delete Project Action"` → keywords: `delete`, `project`

**4. Initialize Todo List**:

```
- Discover feature files (via Explore agent)
- Trace data flow (via general-purpose agent)
- Analyze cache invalidation (via general-purpose agent)
- Validate form completeness (via general-purpose agent)
- Check action behavior (via general-purpose agent)
- Generate business logic report
- [If --fix] Apply fixes (via general-purpose agent)
- [If --fix] Validate changes (via general-purpose agent)
```

### Phase 2: File Discovery (via Explore Agent)

Mark "Discover feature files" as in_progress.

**Dispatch an Explore agent to discover all related files**:

```
subagent_type: "Explore"
model: "haiku"

Discover all files related to the feature "{feature-name}" for a business logic audit.

## Feature Information
- Feature name: {feature-name}
- Keywords: {keyword1}, {keyword2}, {keyword3}

## Discovery Focus

For business logic auditing, I need to trace the COMPLETE data flow. Find ALL files involved in:

1. **UI Layer** (where user interacts)
   - Dialog/form components: `components/**/*{keyword}*.tsx`, `app/**/_components/*{keyword}*.tsx`
   - Look for: form definitions, button handlers, state management

2. **Validation Layer** (where data is validated)
   - Validation schemas: `lib/validations/*{keyword}*.ts`
   - Look for: Zod schemas, required fields, validation rules

3. **Query/Mutation Layer** (where data is fetched/mutated)
   - Query hooks: `hooks/queries/*{keyword}*.ts`
   - Query keys: `lib/queries/*{keyword}*.ts`
   - Look for: useQuery, useMutation, cache invalidation

4. **IPC Layer** (where frontend talks to backend)
   - IPC handlers: `electron/ipc/*{keyword}*.handlers.ts`
   - Channels: `electron/ipc/channels.ts`
   - Preload: `electron/preload.ts`
   - Types: `types/electron.d.ts`
   - Look for: handler functions, parameter validation

5. **Repository Layer** (where data is persisted)
   - Repositories: `db/repositories/*{keyword}*.repository.ts`
   - Look for: create/update/delete methods, Zod validation

6. **Schema Layer** (where data structure is defined)
   - Schemas: `db/schema/*{keyword}*.schema.ts`
   - Look for: table definitions, column names, required fields

## Output Format

Return a JSON object mapping the data flow:
```json
{
  "feature": "{feature-name}",
  "dataFlowLayers": {
    "ui": {
      "files": ["components/agents/agent-editor-dialog.tsx"],
      "formFields": ["name", "displayName", "description", "systemPrompt", "type", "color"],
      "actions": ["onCreate", "onUpdate", "onCancel"]
    },
    "validation": {
      "files": ["lib/validations/agent.ts"],
      "schemas": ["createAgentFormSchema", "updateAgentSchema"]
    },
    "mutations": {
      "files": ["hooks/queries/use-agents.ts"],
      "hooks": ["useCreateAgent", "useUpdateAgent"],
      "cacheInvalidations": ["agentKeys.list._def"]
    },
    "ipc": {
      "files": ["electron/ipc/agent.handlers.ts"],
      "channels": ["agent:create", "agent:update"]
    },
    "repository": {
      "files": ["db/repositories/agents.repository.ts"],
      "methods": ["create", "update"]
    },
    "schema": {
      "files": ["db/schema/agents.schema.ts"],
      "tables": ["agents"],
      "columns": ["id", "name", "displayName", "description", "systemPrompt", "type", "color", "createdAt", "updatedAt"]
    }
  }
}
```
```

**Parse the Explore agent's response**.

**Display Discovery Results**:

```markdown
## File Discovery for Feature: "{feature-name}"

### Data Flow Layers Identified

#### UI Layer
- Files: `{paths}`
- Form Fields: `{fields}`
- Actions: `{actions}`

#### Validation Layer
- Files: `{paths}`
- Schemas: `{schemas}`

#### Mutation Layer
- Files: `{paths}`
- Hooks: `{hooks}`
- Cache Invalidations: `{invalidations}`

#### IPC Layer
- Files: `{paths}`
- Channels: `{channels}`

#### Repository Layer
- Files: `{paths}`
- Methods: `{methods}`

#### Schema Layer
- Files: `{paths}`
- Tables: `{tables}`
- Columns: `{columns}`
```

Mark "Discover feature files" as completed.

### Phase 3: Data Flow Analysis (via General-Purpose Agent)

Mark "Trace data flow" as in_progress.

**Dispatch a general-purpose agent to trace data flow**:

```
subagent_type: "general-purpose"

Trace the complete data flow for the feature "{feature-name}" and identify any gaps or issues.

## Task

You are auditing BUSINESS LOGIC, not code conventions. Focus on whether data flows correctly through all layers.

## Files to Analyze

{List all discovered files from Phase 2}

## Analysis Steps

### Step 1: Extract Form Fields
Read the UI component files and list ALL form fields being captured:
- Field name
- Field type (text, select, checkbox, etc.)
- Whether it's required in the UI
- Default value if any

### Step 2: Extract Validation Schema Fields
Read the validation schema files and list ALL fields defined:
- Field name
- Zod type
- Validation rules (required, min, max, pattern, etc.)
- Error messages

### Step 3: Extract Mutation Parameters
Read the mutation hook files and list ALL parameters passed to mutations:
- Parameter name
- Parameter type
- Whether it's optional

### Step 4: Extract IPC Handler Parameters
Read the IPC handler files and list ALL parameters received:
- Parameter name
- Validation performed
- How it's passed to repository

### Step 5: Extract Repository Method Parameters
Read the repository files and list ALL fields being persisted:
- Field name
- Whether validation is performed
- How it maps to database column

### Step 6: Extract Schema Columns
Read the schema files and list ALL database columns:
- Column name
- Column type
- Default value if any
- Whether it's required (NOT NULL)

## Report Format

```markdown
## Data Flow Analysis Report

### Feature: "{feature-name}"

### Field Mapping

| Field | UI | Validation | Mutation | IPC | Repository | Schema |
|-------|----|-----------:|----------|-----|------------|--------|
| name | YES | YES (required, pattern) | YES | YES | YES | YES |
| description | YES | YES (optional, max 1000) | YES | YES | YES | YES |
| missing_field | NO | YES | NO | NO | NO | YES |

### Issues Found

#### CRITICAL - Data Loss Issues
1. **Field `{field}` not captured in form**
   - Defined in schema: `{column definition}`
   - Missing from: UI form, mutation call
   - Impact: Data will be lost/defaulted on save

2. **Field `{field}` not passed to IPC**
   - Captured in form: YES
   - Passed to mutation: YES
   - Passed to IPC: NO
   - Impact: Data will not be persisted

#### HIGH - Validation Gaps
1. **Field `{field}` missing validation**
   - Schema constraint: `{constraint}`
   - UI validation: NONE
   - Impact: Invalid data may be submitted

#### MEDIUM - Consistency Issues
1. **Validation mismatch for `{field}`**
   - UI says: optional
   - Schema says: required
   - Impact: Confusing user experience

### Summary
- Total fields in schema: {n}
- Fields captured in form: {n}
- Fields properly flowing through: {n}
- Missing from form: {n}
- Missing validation: {n}
- Mismatched rules: {n}
```
```

Mark "Trace data flow" as completed.

### Phase 4: Cache Invalidation Analysis (via General-Purpose Agent)

Mark "Analyze cache invalidation" as in_progress.

**Dispatch a general-purpose agent to analyze cache invalidation**:

```
subagent_type: "general-purpose"

Analyze cache invalidation patterns for the feature "{feature-name}" and identify any issues.

## Task

You are auditing CACHE INVALIDATION correctness. Focus on whether the right queries are invalidated after mutations.

## Files to Analyze

{List mutation and query key files from Phase 2}

## Analysis Steps

### Step 1: Map Query Keys
Read the query key factory file and map all keys related to this entity:
- List queries (useAgents, useAllAgents, etc.)
- Detail queries (useAgent(id))
- By-relationship queries (useAgentsByProject, useAgentsByType)
- Special queries (useActiveAgents, useBuiltInAgents)

### Step 2: Analyze Each Mutation
For each mutation (create, update, delete, etc.), identify:
- What data changes?
- Which queries could show stale data?
- Which queries ARE being invalidated?
- Which queries SHOULD be invalidated but aren't?

### Step 3: Check Invalidation Patterns
Verify invalidation uses correct patterns:
- Using `_def` for partial matching?
- Using exact keys where appropriate?
- Using `setQueryData` for optimistic updates?

## Report Format

```markdown
## Cache Invalidation Analysis Report

### Feature: "{feature-name}"

### Query Keys Mapped

| Query Key | Purpose | Used By |
|-----------|---------|---------|
| agentKeys.list | All agents with filters | useAgents |
| agentKeys.detail(id) | Single agent by ID | useAgent |
| agentKeys.byProject(id) | Agents for project | useAgentsByProject |

### Mutation Analysis

#### useCreateAgent
- **Data Changed**: New agent added to database
- **Queries That Could Be Stale**:
  - `agentKeys.list` - list should include new agent
  - `agentKeys.byProject` - if project-scoped
  - `agentKeys.active` - if agent is active
- **Queries Being Invalidated**:
  - `agentKeys.list._def` ✓
- **Issues**:
  - ⚠️ `agentKeys.active` not being invalidated - new active agents won't appear in active list until refresh

#### useUpdateAgent
- **Data Changed**: Agent fields modified
- **Queries That Could Be Stale**:
  - `agentKeys.detail(id)` - detail should show updated data
  - `agentKeys.list` - list may show outdated name/description
- **Queries Being Invalidated**:
  - `agentKeys.detail(id).queryKey` via setQueryData ✓
  - `agentKeys.list._def` ✓
- **Issues**: None

### Issues Found

#### HIGH - Stale Data Scenarios
1. **After `{mutation}`, `{query}` shows stale data**
   - Scenario: User creates new agent, navigates to active agents list
   - Expected: New agent appears in list
   - Actual: List not refreshed until manual refresh
   - Fix: Add `queryClient.invalidateQueries({ queryKey: agentKeys.active._def })`

#### MEDIUM - Inefficient Invalidation
1. **`{mutation}` invalidates too broadly**
   - Current: Invalidates all list queries
   - Better: Use targeted invalidation with specific keys
   - Impact: Unnecessary refetches, poor performance

### Summary
- Mutations analyzed: {n}
- Correct invalidations: {n}
- Missing invalidations: {n}
- Overly broad invalidations: {n}
```
```

Mark "Analyze cache invalidation" as completed.

### Phase 5: Form Validation Analysis (via General-Purpose Agent)

Mark "Validate form completeness" as in_progress.

**Dispatch a general-purpose agent to validate form completeness**:

```
subagent_type: "general-purpose"

Analyze form validation completeness for the feature "{feature-name}" and identify any issues.

## Task

You are auditing FORM VALIDATION correctness. Focus on whether all required fields are validated properly.

## Files to Analyze

{List UI and validation files from Phase 2}

## Analysis Steps

### Step 1: Map Form Fields to Validation Rules
For each form field, check:
- Is it marked as required in the UI (asterisk, etc.)?
- Is it marked as required in the Zod schema?
- What validation rules exist (min, max, pattern, etc.)?
- Are validation messages user-friendly?

### Step 2: Compare Against Database Schema
For each database column:
- Is it NOT NULL? If so, is form field required?
- Does it have constraints (length, check, etc.)? If so, is validation applied?
- Are defaults applied correctly?

### Step 3: Check Error Display
For validation errors:
- Are they shown next to the field?
- Are they shown on submit?
- Are they cleared when field is corrected?

## Report Format

```markdown
## Form Validation Analysis Report

### Feature: "{feature-name}"

### Field-by-Field Analysis

| Field | UI Required | Schema Required | DB Required | Validation Rules | Error Message |
|-------|-------------|-----------------|-------------|------------------|---------------|
| name | YES ✓ | YES ✓ | YES (NOT NULL) ✓ | min(1), max(100), pattern | ✓ Clear |
| description | NO | NO | NO (nullable) ✓ | max(1000) | ✓ Clear |
| type | YES ✓ | YES ✓ | YES (NOT NULL) ✓ | enum | ✓ Clear |
| color | NO | YES ⚠️ | NO | enum | ✗ Missing |

### Issues Found

#### HIGH - Required Field Not Enforced
1. **Field `{field}` should be required but isn't**
   - Database: NOT NULL constraint
   - Validation: Optional
   - UI: No required indicator
   - Impact: Form can submit without value, causing database error

#### MEDIUM - Validation Rule Mismatch
1. **Field `{field}` has mismatched max length**
   - Database: varchar(100)
   - Validation: max(255)
   - Impact: Validation passes but database rejects

#### LOW - Poor Error Messages
1. **Field `{field}` has generic error message**
   - Current: "Invalid value"
   - Better: "Name must start with a letter and contain only lowercase letters, numbers, and hyphens"

### Summary
- Fields analyzed: {n}
- Properly validated: {n}
- Missing required enforcement: {n}
- Mismatched rules: {n}
- Poor error messages: {n}
```
```

Mark "Validate form completeness" as completed.

### Phase 6: Action Behavior Analysis (via General-Purpose Agent)

Mark "Check action behavior" as in_progress.

**Dispatch a general-purpose agent to check action behavior**:

```
subagent_type: "general-purpose"

Analyze action behavior for the feature "{feature-name}" and identify any issues.

## Task

You are auditing USER ACTION correctness. Focus on whether buttons and actions behave correctly.

## Files to Analyze

{List UI and mutation files from Phase 2}

## Analysis Steps

### Step 1: Identify All User Actions
List all actions a user can take:
- Submit form (create/update)
- Cancel/close dialog
- Delete item
- Reset form
- Other buttons/actions

### Step 2: For Each Action, Verify
- **Loading State**: Is button disabled during async operation?
- **Success Handling**: What happens on success? (toast, close dialog, redirect)
- **Error Handling**: What happens on error? (toast, inline error, stay on form)
- **State Reset**: Is form/state reset appropriately after action?
- **Optimistic Updates**: Are there any? Are they correct?

### Step 3: Check Edge Cases
- Double-click prevention
- Form resubmission on browser back
- Unsaved changes warning
- Concurrent edit handling

## Report Format

```markdown
## Action Behavior Analysis Report

### Feature: "{feature-name}"

### Actions Identified

#### Submit (Create/Update)
- **Loading State**:
  - [ ] Button shows loading indicator
  - [ ] Button is disabled during submission
  - [ ] Form inputs are disabled during submission
- **Success Handling**:
  - [ ] Success toast is shown
  - [ ] Dialog closes
  - [ ] List is refreshed
  - [ ] User is redirected (if applicable)
- **Error Handling**:
  - [ ] Error toast is shown with clear message
  - [ ] Form stays open for correction
  - [ ] Validation errors shown inline
  - [ ] Focus moves to first error field
- **Issues**:
  - ⚠️ Form inputs not disabled during submission

#### Cancel
- **Behavior**:
  - [ ] Dialog closes without saving
  - [ ] Form state is reset
  - [ ] No toast shown
- **Issues**: None

#### Delete
- **Confirmation**:
  - [ ] Confirmation dialog shown
  - [ ] Clear warning message
  - [ ] Destructive action styling
- **Loading State**:
  - [ ] Delete button shows loading
  - [ ] Confirmation dialog stays open during delete
- **Success Handling**:
  - [ ] Success toast shown
  - [ ] Item removed from list
  - [ ] Dialog closes
- **Error Handling**:
  - [ ] Error toast shown
  - [ ] Item not removed from list
- **Issues**:
  - ⚠️ No confirmation dialog before delete

### Issues Found

#### HIGH - Missing Loading State
1. **Submit button not disabled during submission**
   - Risk: User can submit multiple times
   - Fix: Add `disabled={isSubmitting}` to submit button

#### HIGH - Missing Error Feedback
1. **No error toast on mutation failure**
   - Risk: User doesn't know save failed
   - Fix: Add `onError` callback to mutation with toast.error()

#### MEDIUM - Missing Confirmation
1. **Delete action has no confirmation**
   - Risk: Accidental data loss
   - Fix: Add confirmation dialog before delete

#### LOW - UX Improvement
1. **No loading indicator on async action**
   - Current: Button text doesn't change
   - Better: Show "Saving..." or spinner

### Summary
- Actions analyzed: {n}
- Properly implemented: {n}
- Missing loading states: {n}
- Missing error handling: {n}
- Missing confirmations: {n}
```
```

Mark "Check action behavior" as completed.

### Phase 7: Generate Combined Report

Mark "Generate business logic report" as in_progress.

Combine all analysis reports into a comprehensive business logic audit:

```markdown
## Business Logic Audit Report: "{feature-name}"

### Executive Summary

| Category | Issues | Critical | High | Medium | Low |
|----------|--------|----------|------|--------|-----|
| Data Flow | {n} | {n} | {n} | {n} | {n} |
| Cache Invalidation | {n} | {n} | {n} | {n} | {n} |
| Form Validation | {n} | {n} | {n} | {n} | {n} |
| Action Behavior | {n} | {n} | {n} | {n} | {n} |
| **Total** | **{n}** | **{n}** | **{n}** | **{n}** | **{n}** |

### Files Analyzed

{List all files by layer}

---

## Data Flow Issues

{Data flow analysis report}

---

## Cache Invalidation Issues

{Cache invalidation analysis report}

---

## Form Validation Issues

{Form validation analysis report}

---

## Action Behavior Issues

{Action behavior analysis report}

---

## Prioritized Fix List

### Critical (fix immediately)
1. {issue} - `{file}:{line}`
   - Impact: {description}
   - Fix: {solution}

### High (fix soon)
1. {issue} - `{file}:{line}`
   - Impact: {description}
   - Fix: {solution}

### Medium (should fix)
1. {issue} - `{file}:{line}`

### Low (nice to have)
1. {issue} - `{file}:{line}`

---

## Auto-Fix Summary

- **Auto-fixable**: {n} issues
- **Manual required**: {n} issues

To fix automatically, run:
```
/audit-logic "{feature-name}" --fix
```
```

**Display report to user**.

Mark "Generate business logic report" as completed.

**If --fix flag NOT provided**: Stop here. The audit is complete.

### Phase 8: Apply Fixes (if --fix)

**Ask for confirmation using AskUserQuestion**:

```
Use AskUserQuestion:
- question: "Found {n} business logic issues ({auto-fixable} auto-fixable). Proceed with automatic fixes?"
- options:
  - "Yes, fix all": Fix all issues automatically
  - "Critical only": Only fix critical and high priority issues
  - "Review each": Ask before each major fix
  - "No, just report": Skip fixes, keep report only
```

If user chooses "No", stop here.

Mark "[If --fix] Apply fixes" as in_progress.

**Dispatch a general-purpose agent to apply fixes**:

```
subagent_type: "general-purpose"

Fix the business logic issues identified in the audit for "{feature-name}".

## Task

Apply fixes for the following issues. Preserve existing functionality while fixing the issues.

## Issues to Fix

{List issues from the audit report}

## Files to Modify

{List files that need changes}

## Fix Instructions

For each issue, apply the appropriate fix:

1. **Missing form field**: Add field to form component with proper binding
2. **Missing validation**: Add Zod schema validation rule
3. **Missing cache invalidation**: Add queryClient.invalidateQueries() call
4. **Missing loading state**: Add disabled/loading props to buttons
5. **Missing error handling**: Add onError callback with toast
6. **Missing confirmation**: Add confirmation dialog component

## Report Format

```markdown
## Fixes Applied

### File: `{path}`

#### Changes
1. Line {n}: {change description}
2. Line {n}: {change description}

#### Issues Fixed
- [x] {issue 1}
- [x] {issue 2}

#### Could Not Fix (manual required)
- [ ] {issue} - Reason: {why}
```
```

Mark "[If --fix] Apply fixes" as completed.

### Phase 9: Validate Changes (via General-Purpose Agent)

Mark "[If --fix] Validate changes" as in_progress.

**Dispatch a general-purpose agent to validate fixes**:

```
subagent_type: "general-purpose"

Run validation checks after business logic fixes were applied.

## Task

1. Run ESLint: `pnpm lint`
2. Run TypeScript: `pnpm typecheck`
3. Verify the fixes don't break existing functionality

## Report Format

```markdown
## Validation Results

### ESLint
- Status: PASS/FAIL
- Errors: {n}
- Details: ...

### TypeScript
- Status: PASS/FAIL
- Errors: {n}
- Details: ...

### Overall Status: PASS/FAIL
```
```

Mark "[If --fix] Validate changes" as completed.

### Phase 10: Final Summary

```markdown
## Business Logic Audit Complete: "{feature-name}"

### Summary

| Metric | Count |
|--------|-------|
| Files analyzed | {n} |
| Original issues | {n} |
| Issues fixed | {n} |
| Manual attention needed | {n} |

### Validation

- ESLint: PASS/FAIL
- TypeScript: PASS/FAIL

### Files Modified

{List all modified files}

### Remaining Issues (Manual Attention Required)

{List any issues that couldn't be auto-fixed}

### Recommendations

1. {recommendation for testing}
2. {recommendation for manual verification}

### Next Steps

1. [ ] Test the feature manually
2. [ ] Verify data persists correctly
3. [ ] Check cache invalidation works
4. [ ] Run integration tests if available
5. [ ] Commit changes
```

Mark all todos as completed.

## Error Handling

| Error | Action |
|-------|--------|
| Feature not found | Ask user for file path or alternative name |
| No files found | Suggest similar features or ask for clarification |
| Agent failed | Retry once, then report partial results |
| Validation failed | Continue but note in summary |

## Performance Notes

- **Sequential analysis**: Analysis phases run sequentially to build understanding
- **Focused scope**: Feature-level audit for manageable context
- **Explore agent for discovery**: Keeps main context clean
- **Interactive decisions**: Uses AskUserQuestion for clarifications

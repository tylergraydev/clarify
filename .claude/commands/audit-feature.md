---
allowed-tools: Task(subagent_type:claude-agent-sdk), Task(subagent_type:database-schema), Task(subagent_type:ipc-handler), Task(subagent_type:tanstack-query), Task(subagent_type:tanstack-table), Task(subagent_type:tanstack-form), Task(subagent_type:tanstack-form-base-components), Task(subagent_type:frontend-component), Task(subagent_type:vercel-react-best-practices), Task(subagent_type:Explore), Task(subagent_type:general-purpose), AskUserQuestion(*), TodoWrite(*)
argument-hint: '"Feature Name" [--fix] [--domain=frontend|backend|ipc|hooks|all]'
description: Audit a specific feature for best practice violations across all layers (frontend through backend), optionally fix issues
---

You are a feature audit orchestrator. You coordinate subagents to discover files, analyze
violations, fix issues, and validate changes. You do NOT do any file reading, searching,
or code analysis yourself - you delegate ALL work to specialized subagents.

@CLAUDE.MD

## Command Usage

```
/audit-feature "Feature Name" [--fix] [--domain=frontend|backend|ipc|hooks|all]
```

**Arguments**:

- `"Feature Name"` (required): The feature to audit (in quotes)
  - Example: `"Create Agent Dialog"`
  - Example: `"Workflow Step Card"`
  - Example: `"Project Settings Form"`
  - Example: `"Template List Table"`
- `--fix`: Automatically fix violations after reporting (requires user confirmation)
- `--domain=X`: Limit audit to specific domain(s). Options:
  - `frontend` - Components, dialogs, forms, UI files
  - `backend` - Database schemas, repositories
  - `ipc` - Electron IPC handlers, preload, types
  - `hooks` - Query hooks, mutations, stores, validations
  - `all` (default) - All domains

**Examples**:

```
/audit-feature "Create Agent Dialog"
/audit-feature "Workflow Step Card" --fix
/audit-feature "Project Settings Form" --domain=frontend
/audit-feature "Template List Table" --domain=hooks --fix
```

## Orchestrator Principles

**You are the orchestrator. You delegate, not execute.**

1. **NEVER read files directly** - Use Explore agents for file discovery
2. **NEVER analyze code directly** - Use specialist agents for analysis
3. **NEVER run validation commands directly** - Use general-purpose agents
4. **ALWAYS ask questions interactively** - Use AskUserQuestion for design decisions
5. **Your role is to**: Parse input, dispatch agents, collect results, ask clarifying questions, present summaries

## Domain Classification Reference

| Domain | File Patterns | Specialist Agent | Skills |
|--------|---------------|------------------|--------|
| `claude-sdk` | `.claude/agents/*.md`, `.claude/skills/**/*.md`, `.claude/commands/*.md` | `claude-agent-sdk` | claude-agent-sdk |
| `frontend` | `components/**/*.tsx`, `app/**/_components/*.tsx` | `frontend-component` | component-conventions, react-coding-conventions |
| `backend` | `db/schema/*.ts`, `db/repositories/*.ts` | `database-schema` | database-schema-conventions |
| `ipc` | `electron/ipc/*.ts`, `preload.ts`, `types/electron.d.ts` | `ipc-handler` | ipc-handler-conventions |
| `hooks` | `hooks/**/*.ts`, `lib/queries/*.ts` | `tanstack-query` | tanstack-query-conventions |
| `forms` | `lib/validations/*.ts`, form components | `tanstack-form` | tanstack-form-conventions |
| `stores` | `lib/stores/*.ts` | Uses `zustand-state-management` skill | zustand-state-management |

## Orchestration Workflow

### Phase 1: Input Validation

**1. Parse Arguments from $ARGUMENTS**:

- Extract feature name (text in quotes)
- Parse optional flags (--fix, --domain)
- Validate feature name is provided

**2. If no feature name provided**: Stop with error message:

```
Error: Feature name required.

Usage: /audit-feature "Feature Name" [--fix] [--domain=frontend|backend|ipc|hooks|all]

Examples:
  /audit-feature "Create Agent Dialog"
  /audit-feature "Workflow Step Card" --fix
  /audit-feature "Project Settings Form" --domain=frontend
```

**3. Derive Search Terms**:

From the feature name, extract keywords for file discovery:
- `"Create Agent Dialog"` → keywords: `create`, `agent`, `dialog`; pattern hints: `*agent*dialog*`, `*create*agent*`
- `"Workflow Step Card"` → keywords: `workflow`, `step`, `card`; pattern hints: `*workflow*step*`, `*step*card*`
- `"Template List Table"` → keywords: `template`, `list`, `table`; pattern hints: `*template*list*`, `*template*table*`

**4. Initialize Todo List**:

```
- Discover files for feature (via Explore agent)
- Analyze frontend files (via specialist)
- Analyze backend files (via specialist)
- Analyze IPC files (via specialist)
- Analyze hooks/queries files (via specialist)
- Resolve design decisions with user
- Generate combined report
- [If --fix] Apply fixes by domain (via specialists)
- [If --fix] Validate changes (via general-purpose agent)
- [If --fix] Review and iterate (via specialists)
```

### Phase 2: File Discovery (via Explore Agent)

Mark "Discover files for feature" as in_progress.

**Dispatch an Explore agent to discover all related files**:

```
subagent_type: "Explore"
model: "haiku"

Discover all files related to the feature "{feature-name}" for a comprehensive audit.

## Feature Information
- Feature name: {feature-name}
- Keywords: {keyword1}, {keyword2}, {keyword3}

## Discovery Strategy

This is a FEATURE-level audit, not a route-level audit. Focus on finding:
1. The primary component(s) that implement this feature
2. Any supporting components, hooks, or utilities
3. Related validation schemas, query hooks, and IPC handlers

## Search Patterns

Use these patterns to find feature-related files. Be thorough - search multiple variations:

### Components (Primary Search)
Search for the main feature component and related UI files:
- `components/**/*{keyword}*.tsx` - UI components
- `app/**/_components/*{keyword}*.tsx` - Page-colocated components
- Variations: kebab-case, PascalCase, camelCase

Examples for "{feature-name}":
- `*{keyword1}*{keyword2}*.tsx`
- `*{keyword2}*{keyword1}*.tsx`
- Look for dialogs, forms, cards, tables, lists matching the feature

### Hooks & Queries
- `hooks/**/*{keyword}*.ts` - Custom hooks
- `hooks/queries/*{keyword}*.ts` - Query hooks
- `lib/queries/*{keyword}*.ts` - Query key factories

### Validations
- `lib/validations/*{keyword}*.ts` - Zod validation schemas

### Stores
- `lib/stores/*{keyword}*.ts` - Zustand stores

### Database (if feature involves data)
- `db/schema/*{keyword}*.ts` - Schema definitions
- `db/repositories/*{keyword}*.ts` - Repository classes

### IPC (if feature involves Electron)
- `electron/ipc/*{keyword}*.ts` - IPC handlers

## Output Format

Return a JSON object with discovered files:
```json
{
  "feature": "{feature-name}",
  "primary_component": "path/to/main-component.tsx",
  "frontend": [
    {"path": "components/dialogs/create-agent-dialog.tsx", "type": "dialog", "role": "primary"},
    {"path": "components/ui/form/agent-form-fields.tsx", "type": "form-component", "role": "supporting"}
  ],
  "backend": [
    {"path": "db/schema/agents.schema.ts", "type": "schema", "role": "data-source"},
    {"path": "db/repositories/agents.repository.ts", "type": "repository", "role": "data-source"}
  ],
  "ipc": [
    {"path": "electron/ipc/agent.handlers.ts", "type": "handlers", "role": "api"}
  ],
  "hooks": [
    {"path": "hooks/queries/use-agents.ts", "type": "query-hook", "role": "data-fetching"},
    {"path": "lib/queries/agents.ts", "type": "query-keys", "role": "cache-keys"}
  ],
  "forms": [
    {"path": "lib/validations/agent.ts", "type": "validation", "role": "schema"}
  ],
  "stores": []
}
```

If you cannot find files matching the feature name, report what you searched for and suggest alternatives.
```

**Parse the Explore agent's response** and filter by --domain if specified.

**Display Discovery Results**:

```markdown
## File Discovery for Feature: "{feature-name}"

### Primary Component
- `{primary_component_path}`

### Files Found: {total}

#### Frontend ({count})
- `{path}` - {role}
- ...

#### Backend ({count})
- `{path}` - {role}
- ...

#### IPC ({count})
- `{path}` - {role}
- ...

#### Hooks ({count})
- `{path}` - {role}
- ...

#### Forms/Validations ({count})
- `{path}` - {role}
- ...

#### Stores ({count})
- `{path}` - {role}
- ...
```

**If no files found**: Ask user for clarification:
```
Use AskUserQuestion:
- question: "I couldn't find files matching '{feature-name}'. Can you provide more context?"
- options:
  - "Show file path": I'll provide the path to the main component
  - "Different name": The feature might be named differently in code
  - "Describe location": I'll describe where to find it
```

Mark "Discover files for feature" as completed.

### Phase 3: Parallel Domain Analysis (via Specialist Agents)

**IMPORTANT**: Run domain analyses IN PARALLEL using multiple Task tool calls in a single message.

For each domain with files, dispatch the appropriate specialist agent.

#### Frontend Analysis

Mark "Analyze frontend files" as in_progress.

```
subagent_type: "frontend-component"

Analyze these frontend files for violations of project conventions.

## Context
This is a feature-level audit for: "{feature-name}"

## Role
You are a code ANALYST. Identify all violations but DO NOT make changes.

## Files to Analyze

{List file paths from discovery - agent will read them}

## Conventions to Check

Load and apply these skills:
- component-conventions
- react-coding-conventions

### Specific Checks:

**Dialog Components**:
- [ ] Uses DialogRoot, DialogBackdrop, DialogPopup, DialogTitle from Base UI
- [ ] Has proper close button with DialogClose
- [ ] Uses controlled open/onOpenChange pattern
- [ ] Focuses first interactive element on open
- [ ] Traps focus within dialog

**Form Components**:
- [ ] Uses TanStack Form with useForm hook
- [ ] Has proper validation schema from lib/validations
- [ ] Uses field components from components/ui/form
- [ ] Has Submit/Cancel buttons with proper states
- [ ] Shows validation errors appropriately

**Card Components**:
- [ ] Uses semantic HTML structure
- [ ] Has proper interactive states if clickable
- [ ] Uses CVA for variants

**Table Components**:
- [ ] Uses TanStack Table if complex
- [ ] Has proper column definitions
- [ ] Handles empty state

**General Component Checks**:
- [ ] Wraps Base UI primitives
- [ ] Uses CVA for variants
- [ ] className comes LAST in cn() calls
- [ ] Uses standard size scale (sm, default, lg only)
- [ ] Uses ComponentPropsWithRef for props
- [ ] Has focus-visible and data-disabled states
- [ ] Named exports only (no default)
- [ ] JSDoc on exported components

## Report Format

Return a structured report:

```markdown
## Frontend Analysis Report

### Feature: "{feature-name}"

### Files Analyzed
- `{file_path}` ({lines} lines) - {role}

### Violations Found

#### HIGH Priority
1. **{Issue}**
   - File: `{path}:{line}`
   - Rule: `{rule-id}`
   - Problem: {description}
   - Fix: {what should be done}
   - Design Decision Required: YES/NO (if YES, describe the decision needed)

#### MEDIUM Priority
...

#### LOW Priority
...

### Design Decisions Required
List any violations that require user input to resolve

### Summary
- Total violations: {n}
- High: {n}, Medium: {n}, Low: {n}
- Auto-fixable: {n}
- Requires design decision: {n}
```
```

#### Backend Analysis

Mark "Analyze backend files" as in_progress.

```
subagent_type: "database-schema"

Analyze these database files for violations of project conventions.

## Context
This is a feature-level audit for: "{feature-name}"

## Role
You are a code ANALYST. Identify all violations but DO NOT make changes.

## Files to Analyze

{List file paths from discovery}

## Conventions to Check

Load and apply: database-schema-conventions

### Specific Checks:

**Schema Files**:
- [ ] Table name is plural, lowercase, underscores
- [ ] Column names use snake_case in SQL
- [ ] Has id, createdAt, updatedAt columns
- [ ] Columns in alphabetical order
- [ ] Exports NewEntity and Entity types
- [ ] Index naming: {tablename}_{columnname}_idx

**Repository Files**:
- [ ] ALL methods are async (return Promise<T>)
- [ ] Has Zod validation on create/update
- [ ] Uses toISOString() for timestamp updates (not SQL)
- [ ] Return types use T | undefined (success first)
- [ ] Has interface + factory function pattern
- [ ] Exported from index.ts barrel

## Report Format

{Same format as frontend, including "Design Decisions Required" section}
```

#### IPC Analysis

Mark "Analyze IPC files" as in_progress.

```
subagent_type: "ipc-handler"

Analyze these IPC files for violations of project conventions.

## Context
This is a feature-level audit for: "{feature-name}"

## Role
You are a code ANALYST. Identify all violations but DO NOT make changes.

## Files to Analyze

{List file paths from discovery}

Also analyze synchronization with:
- electron/ipc/channels.ts
- electron/preload.ts
- types/electron.d.ts

## Conventions to Check

Load and apply: ipc-handler-conventions

### Specific Checks:

- [ ] ALL handlers declared async
- [ ] Channel naming: {domain}:{action}
- [ ] Uses try-catch with [IPC Error] prefix
- [ ] Throws errors (not result objects)
- [ ] Channels defined in channels.ts
- [ ] Channels duplicated in preload.ts
- [ ] Types match in electron.d.ts
- [ ] Uses dependency injection for repositories

## Report Format

{Same format as frontend, including "Design Decisions Required" section}
```

#### Hooks/Queries Analysis

Mark "Analyze hooks/queries files" as in_progress.

```
subagent_type: "tanstack-query"

Analyze these query/hook files for violations of project conventions.

## Context
This is a feature-level audit for: "{feature-name}"

## Role
You are a code ANALYST. Identify all violations but DO NOT make changes.

## Files to Analyze

{List file paths from discovery}

## Conventions to Check

Load and apply: tanstack-query-conventions

### Specific Checks:

**Query Hooks**:
- [ ] Uses createQueryKeys factory
- [ ] Spreads keys: ...entityKeys.detail(id)
- [ ] Has enabled: isElectron check
- [ ] Uses useElectron() hook
- [ ] Naming: useEntities (plural) for lists

**Mutations**:
- [ ] Toast notifications in hooks (not components)
- [ ] Cache invalidation with _def
- [ ] void prefix on invalidateQueries
- [ ] Error handling with toast.error

**Barrel Exports**:
- [ ] All public hooks exported from index.ts

## Report Format

{Same format as frontend, including "Design Decisions Required" section}
```

**Wait for all analysis agents to complete**.

Mark all "Analyze *" todos as completed.

### Phase 4: Resolve Design Decisions with User

Mark "Resolve design decisions with user" as in_progress.

**Collect all design decisions from analysis reports**.

If there are design decisions required, use AskUserQuestion to resolve them interactively:

```
For each design decision:
1. Present the context (which file, what the issue is)
2. Offer clear options with descriptions
3. Record the user's choice for the fix phase

Example questions to ask:

- "The dialog component doesn't trap focus properly. Should I: (A) Add FocusTrap wrapper, (B) Use dialog's built-in focus management, (C) Skip - this is intentional?"

- "The form doesn't have a validation schema. Should I: (A) Create schema in lib/validations, (B) Use inline validation, (C) Skip validation for this form?"

- "The mutation doesn't show toast notifications. Should I: (A) Add success/error toasts, (B) Keep silent, (C) Only show error toasts?"
```

Use AskUserQuestion with appropriate options for each decision. Group related decisions if possible (max 4 questions per AskUserQuestion call).

**Store user decisions** for use in the fix phase.

Mark "Resolve design decisions with user" as completed.

### Phase 5: Generate Combined Report

Mark "Generate combined report" as in_progress.

Combine all domain reports into a single comprehensive report:

```markdown
## Feature Audit Report: "{feature-name}"

### Overview

| Domain | Files | Violations | High | Medium | Low |
|--------|-------|------------|------|--------|-----|
| Frontend | {n} | {n} | {n} | {n} | {n} |
| Backend | {n} | {n} | {n} | {n} | {n} |
| IPC | {n} | {n} | {n} | {n} | {n} |
| Hooks | {n} | {n} | {n} | {n} | {n} |
| **Total** | **{n}** | **{n}** | **{n}** | **{n}** | **{n}** |

### Primary Component
- `{primary_component_path}`

### Files Analyzed

{List all files by domain with their roles}

---

## Violations by Domain

### Frontend

{Frontend analysis report}

### Backend

{Backend analysis report}

### IPC

{IPC analysis report}

### Hooks

{Hooks analysis report}

---

## User Decisions Made

{List the design decisions that were resolved via AskUserQuestion}

## Prioritized Fix List

### High Priority (fix first)
1. {violation} - `{file}:{line}`
2. ...

### Medium Priority
1. {violation} - `{file}:{line}`
2. ...

### Low Priority
1. {violation} - `{file}:{line}`
2. ...

---

## Auto-Fix Summary

- **Auto-fixable**: {n} violations
- **Manual required**: {n} violations

To fix automatically, run:
```
/audit-feature "{feature-name}" --fix
```
```

**Display report to user**.

Mark "Generate combined report" as completed.

**If --fix flag NOT provided**: Stop here. The audit is complete.

### Phase 6: Apply Fixes (if --fix)

**Ask for confirmation using AskUserQuestion**:

```
Use AskUserQuestion:
- question: "Found {n} violations ({auto-fixable} auto-fixable). Proceed with automatic fixes?"
- options:
  - "Yes, fix all": Fix all violations automatically
  - "Review each": Ask before each major fix
  - "No, just report": Skip fixes, keep report only
```

If user chooses "No", stop here.

Mark "[If --fix] Apply fixes by domain" as in_progress.

**Dispatch fix agents IN PARALLEL by domain**:

For each domain with violations:

```
subagent_type: "{domain-specialist}"

Fix the violations identified in the audit for these files.

## Context
This is a feature-level audit for: "{feature-name}"

## Role
You are an implementer. Fix all violations while preserving existing functionality.

## Files to Fix

{List file paths}

## Violations to Fix

{List violations for this domain from the audit report}

## User Decisions

{Include any relevant user decisions from Phase 4}

## Conventions

{Load appropriate skill for this domain}

## Instructions

1. Read each file
2. Fix each violation listed
3. Apply user decisions where applicable
4. Preserve existing functionality
5. Report changes made

## Report Format

```markdown
## Fixes Applied

### File: `{path}`

#### Changes
1. Line {n}: {change description}
2. Line {n}: {change description}

#### Violations Fixed
- [x] {violation 1}
- [x] {violation 2}

#### Could Not Fix (manual required)
- [ ] {violation} - Reason: {why}
```
```

**Wait for all fix agents to complete**.

Mark "[If --fix] Apply fixes by domain" as completed.

### Phase 7: Validate Changes (via General-Purpose Agent)

Mark "[If --fix] Validate changes" as in_progress.

**Dispatch a general-purpose agent to run validation**:

```
subagent_type: "general-purpose"

Run validation checks on the codebase after fixes were applied.

## Task

1. Run ESLint: `pnpm lint`
2. Run TypeScript: `pnpm typecheck`

## Report Format

```markdown
## Validation Results

### ESLint
- Status: PASS/FAIL
- Errors: {n}
- Warnings: {n}
- Error details (if any):
  - `{file}:{line}`: {error}

### TypeScript
- Status: PASS/FAIL
- Errors: {n}
- Error details (if any):
  - `{file}:{line}`: {error}

### Overall Status: PASS/FAIL
```
```

Mark "[If --fix] Validate changes" as completed.

### Phase 8: Review and Iterate (if --fix)

Mark "[If --fix] Review and iterate" as in_progress.

**Dispatch review agents IN PARALLEL by domain**:

```
subagent_type: "{domain-specialist}"

Review the fixes applied to these files.

## Context
This is a feature-level audit for: "{feature-name}"

## Role
You are a code REVIEWER. Verify fixes are correct and identify any remaining issues.

## Files to Review

{List file paths}

## Original Violations

{List violations that were supposed to be fixed}

## Validation Results

{Include results from validation agent}

## Review Checklist

{Domain-specific checklist}

## Report Format

```markdown
## Review Results

### Assessment: APPROVED | NEEDS_MORE_FIXES

### Violations Status
| Violation | Status | Notes |
|-----------|--------|-------|
| {violation} | FIXED / NOT_FIXED / PARTIALLY_FIXED | {notes} |

### New Issues Introduced
1. {issue} - Line {n}

### Remaining Issues
1. {issue} - Reason not fixed: {reason}

### Summary
- Original violations: {n}
- Fixed: {n}
- Remaining: {n}
- New issues: {n}
```
```

**If issues remain and cycle < 2**:

Use AskUserQuestion to ask user:
```
- question: "Review found {n} remaining issues. Continue with another fix cycle?"
- options:
  - "Yes, continue": Run another fix cycle
  - "No, stop here": Accept current state
```

If user wants to continue, dispatch fix agents again with specific remaining issues.

**If cycle >= 2 or user declines or all fixed**:

Proceed to final summary.

Mark "[If --fix] Review and iterate" as completed.

### Phase 9: Final Summary

```markdown
## Feature Audit Complete: "{feature-name}"

### Summary

| Metric | Count |
|--------|-------|
| Files analyzed | {n} |
| Original violations | {n} |
| Violations fixed | {n} |
| Manual attention needed | {n} |

### Validation

- ESLint: PASS/FAIL
- TypeScript: PASS/FAIL

### Fix Cycles

- Cycle 1: Fixed {n} violations
- Cycle 2: Fixed {n} additional violations (if applicable)

### User Decisions Applied

{List decisions made during the audit}

### Files Modified

{List all modified files}

### Remaining Issues (Manual Attention Required)

{List any issues that couldn't be auto-fixed}

### Next Steps

1. [ ] Review the changes
2. [ ] Run tests if applicable
3. [ ] Commit changes
```

Mark all todos as completed.

## Error Handling

| Error | Action |
|-------|--------|
| Feature not found | Ask user for file path or alternative name |
| No files found | Suggest similar features or ask for clarification |
| Specialist failed | Retry once, then report |
| Validation failed | Continue but note in summary |
| Max iterations reached | Report remaining issues for manual fix |

## Performance Notes

- **Parallel analysis**: All domain analyses run concurrently via separate specialist agents
- **Parallel fixes**: All domain fixes run concurrently via separate specialist agents
- **Max 2 iterations**: Prevents infinite fix loops
- **Domain filtering**: Use --domain to focus on specific areas
- **Explore agent for discovery**: Keeps main context clean
- **Interactive decisions**: Uses AskUserQuestion instead of deferred reporting
- **Feature-focused**: Narrower scope than route audit for faster execution

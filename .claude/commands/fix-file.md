---
allowed-tools: Task(subagent_type:database-schema), Task(subagent_type:ipc-handler), Task(subagent_type:tanstack-query), Task(subagent_type:tanstack-table), Task(subagent_type:tanstack-form), Task(subagent_type:tanstack-form-base-components), Task(subagent_type:frontend-component), Bash(timeout 120 pnpm typecheck), Bash(timeout 120 pnpm lint), Bash(timeout 60 pnpm format), Write(*), Read(*), Edit(*), Glob(*), Grep(*), TodoWrite(*)
argument-hint: "path/to/file.ts [--reference=path/to/reference.ts] [--dry-run]"
description: Fix a file to follow project patterns using specialist agents with automatic review and iteration
---

You are a file fix orchestrator. You coordinate specialist agents to fix files to
follow project patterns, then review the changes and iterate if issues are found.

@CLAUDE.MD

## Command Usage

```
/fix-file path/to/file.ts [--reference=path/to/reference.ts] [--dry-run]
```

**Arguments**:

- `path/to/file.ts` (required): Path to the file to fix
  - Example: `db/schema/projects.schema.ts`
  - Example: `electron/ipc/projects.handlers.ts`
  - Example: `components/features/projects/project-form.tsx`
- `--reference=path/to/reference.ts`: Optional path to a well-implemented reference file to use as a pattern example
- `--dry-run`: Analyze the file and show what would be fixed without making changes

**Examples**:

```
/fix-file db/schema/feature-requests.schema.ts
/fix-file electron/ipc/projects.handlers.ts --reference=electron/ipc/repositories.handlers.ts
/fix-file hooks/queries/use-projects.ts --dry-run
/fix-file components/features/projects/project-card.tsx
```

## Specialist Selection Matrix

Map the file path to the appropriate specialist agent:

| File Pattern                            | Specialist Agent                | Skills Loaded                                       |
| --------------------------------------- | ------------------------------- | --------------------------------------------------- |
| `*.schema.ts` in `db/schema/`           | `database-schema`               | database-schema-conventions                         |
| `*.repository.ts` in `db/repositories/` | `database-schema`               | database-schema-conventions                         |
| `*.handlers.ts` in `electron/ipc/`      | `ipc-handler`                   | ipc-handler-conventions                             |
| `electron/preload.ts`                   | `ipc-handler`                   | ipc-handler-conventions                             |
| `use-*.ts` in `hooks/queries/`          | `tanstack-query`                | tanstack-query-conventions                          |
| `*.ts` in `lib/queries/`                | `tanstack-query`                | tanstack-query-conventions                          |
| `*-table.tsx` or tables with useReactTable | `tanstack-table`             | tanstack-table, component-conventions               |
| `*-form.tsx` or forms in features       | `tanstack-form`                 | tanstack-form-conventions, react-coding-conventions |
| `*.ts` in `lib/validations/`            | `tanstack-form`                 | tanstack-form-conventions                           |
| Components in `components/ui/form/`     | `tanstack-form-base-components` | tanstack-form-base-components                       |
| Components in `components/ui/`          | `frontend-component`            | component-conventions, react-coding-conventions     |
| Components in `components/features/`    | `frontend-component`            | component-conventions, react-coding-conventions     |
| Components in `components/layout/`      | `frontend-component`            | component-conventions, react-coding-conventions     |

## Orchestration Workflow

### Phase 1: Input Validation & Analysis

**1. Parse Arguments from $ARGUMENTS**:

- Extract file path
- Parse optional flags (--reference, --dry-run)
- Validate that a file path was provided

**2. If no file provided**: Stop with error message:

```
Error: File path required.

Usage: /fix-file path/to/file.ts

Examples:
  /fix-file db/schema/projects.schema.ts
  /fix-file electron/ipc/projects.handlers.ts --reference=electron/ipc/repositories.handlers.ts
```

**3. Validate File Exists**:

- Check file exists at the provided path
- If not found, try common path patterns and suggest corrections

**4. Determine Specialist Type**:

Using the Specialist Selection Matrix above:

- Analyze file path
- Read file to check for patterns if needed
- Select the appropriate specialist agent type

**5. Find Reference Files** (if not provided):

If no `--reference` flag:

- Find 1-2 well-implemented reference files in the same domain
- For schemas: Look for existing `*.schema.ts` files in `db/schema/`
- For repositories: Look for existing `*.repository.ts` files in `db/repositories/`
- For IPC handlers: Look for existing `*.handlers.ts` files in `electron/ipc/`
- For queries: Look for existing `use-*.ts` files in `hooks/queries/`
- For components: Find similar components in `components/ui/` or `components/features/`

**6. Initialize Todo List**:

```
- Analyze file and identify issues
- Apply fixes using specialist agent
- Validate changes (lint, typecheck)
- Review changes with second specialist
- Apply additional fixes if needed
- Generate summary
```

### Phase 2: Initial Analysis (Using Specialist Agent)

Mark "Analyze file and identify issues" as in_progress.

**IMPORTANT**: Use a specialist agent for initial analysis. The specialist agents load skills containing project patterns and conventions, making them significantly better at identifying issues than analyzing directly.

**Dispatch the specialist analysis agent**:

```
subagent_type: "{selected-specialist}"

Analyze this file and identify all issues that need to be fixed to follow project patterns.

## Role
You are a code ANALYST, NOT an implementer. Your job is to:
1. Thoroughly analyze the target file
2. Compare it against reference files to identify pattern gaps
3. Identify all violations of project conventions
4. Provide a detailed issue report

DO NOT make any changes. Only analyze and report.

## Target File
`{file_path}`

## File Contents
{Read and include the full file contents}

## Reference Files for Comparison
Study these well-implemented files to understand the correct patterns:

### `{reference_path_1}`
{Full contents of reference file 1}

### `{reference_path_2}` (if applicable)
{Full contents of reference file 2}

## Analysis Checklist

{Include domain-specific checklist based on specialist type}

### For Database Schemas (database-schema):
- Table name: plural, lowercase, underscores
- Column names: snake_case in SQL, camelCase in TypeScript
- Standard columns: id, createdAt, updatedAt present
- Columns in alphabetical order
- Type exports: NewEntity and Entity types exported
- Index naming: `{tablename}_{columnname}_idx`
- Foreign key constraints defined with cascade behavior
- Proper imports from drizzle-orm and drizzle-orm/sqlite-core

### For Repositories (database-schema):
- Interface definition present
- Factory function exported: `createXxxRepository(db)`
- Standard CRUD methods: create, getById, getAll, update, delete
- Auto-update updatedAt in update operations
- Proper type imports from schema file
- Barrel export in index.ts

### For IPC Handlers (ipc-handler):
- Channel naming: `{domain}:{action}` or `{domain}:{subdomain}:{action}`
- Handler file: One file per domain, `{domain}.handlers.ts`
- Registration function: `registerXxxHandlers(dependencies)` export
- Event typing: `_event: IpcMainInvokeEvent` (underscore if unused)
- Uses `ipcMain.handle()` exclusively (not send/on)
- Channels defined in `electron/ipc/channels.ts`
- Preload API matches channel structure
- Types in sync with `types/electron.d.ts`

### For TanStack Query (tanstack-query):
- Query key factory: Uses `createQueryKeys` from `@lukemorales/query-key-factory`
- Spread keys: `...entityKeys.query()` pattern
- Electron check: `enabled: isElectron` present in all queries
- Uses `useElectronDb` hook for repository access
- Invalidation: Uses `_def` for base key invalidation
- Void prefix: `void queryClient.invalidateQueries()`
- Naming: `use{Entity}` for detail, `use{Entities}` for list
- Mutations use `Parameters<typeof fn>` for type inference

### For TanStack Table (tanstack-table):
- Data memoization: `data` wrapped in `useMemo` with stable deps
- Column memoization: `columns` wrapped in `useMemo`
- Server-side flags: `manualPagination`, `manualSorting`, `manualFiltering` for server-side
- Query integration: All table state included in query keys
- Pagination state: `pageCount` provided for server-side pagination
- Virtualization guard: `enabled` option used when virtualizing in tabs/modals
- React 19 compatibility: `"use no memo"` directive if using React Compiler
- Column definitions: `accessorKey` for simple, `accessorFn` for computed
- Action columns: `id` property and `enableSorting: false`

### For TanStack Form (tanstack-form):
- Hook usage: Uses `useAppForm` from `@/lib/forms`
- Validation schema: Defined in `lib/validations/` with Zod
- Field components: Uses pre-built TextField, TextareaField, SelectField, etc.
- Label required: All field components have `label` prop
- AppField pattern: `form.AppField` with render function
- SubmitButton wrapper: Wrapped in `form.AppForm`
- Default values: Match schema shape
- Native form element with preventDefault/stopPropagation
- Type export: Both schema and inferred type exported

### For Components (frontend-component):
- Base UI usage: Wraps @base-ui/react primitives when available
- CVA variants: Uses class-variance-authority when multiple variants needed
- Props typing: Uses ComponentPropsWithRef combined with VariantProps
- cn() utility: Always uses for class merging
- Focus states: Includes `focus-visible:ring-2 focus-visible:ring-accent`
- Disabled states: Uses `data-disabled:` styles
- Named exports: No default exports
- Import order: Type imports first, then external, then internal
- `'use client'` directive at top for client components

## Report Format

Provide your analysis in this exact format:

\`\`\`markdown
## Current State Analysis

### File: `{file_path}`
- Type: {schema|repository|ipc-handler|query-hook|form|component}
- Specialist: {specialist-type}
- Lines: {count}

### Reference Files
- `{reference_path_1}` - {why it's a good reference}
- `{reference_path_2}` - {why it's a good reference} (if applicable)

### Issues Identified

#### High Priority
1. **{Issue Title}** (line ~{n})
   - Problem: {detailed description}
   - Expected: {what the code should look like based on patterns}
   - Reference: {which reference file shows the correct pattern}

#### Medium Priority
1. **{Issue Title}** (line ~{n})
   - Problem: {description}
   - Expected: {correct pattern}

#### Low Priority
1. **{Issue Title}** (line ~{n})
   - Problem: {description}
   - Expected: {correct pattern}

### Pattern Gaps Summary
- {Brief summary of major gaps compared to reference files}

### Estimated Changes
- Structural changes: {description}
- Lines affected: ~{estimate}
\`\`\`
```

**Save the analysis report** for use in Phase 3.

**If --dry-run**: Display the analysis report from the specialist agent and stop here. Do not proceed to Phase 3.

Mark "Analyze file and identify issues" as completed.

### Phase 3: Apply Fixes

Mark "Apply fixes using specialist agent" as in_progress.

**Dispatch the specialist fix agent** with the analysis from Phase 2:

```
subagent_type: "{selected-specialist}"

Fix this file to follow project patterns and conventions based on the analysis below.

## Target File
`{file_path}`

## Analysis from Phase 2
{Include the full analysis report from the specialist agent in Phase 2}

## File Contents
{Full file contents}

## Reference Files
Study these files for proper patterns:

### `{reference_path_1}`
{Full contents of reference file 1}

### `{reference_path_2}` (if applicable)
{Full contents of reference file 2}

## Instructions

1. Read the target file carefully
2. Study the reference files to understand the correct patterns
3. Apply fixes to make the target file follow the same patterns as the references
4. Focus on:
   - Structure and organization
   - Naming conventions
   - Error handling patterns
   - Type definitions
   - Import organization
   - Documentation where expected

## Key Patterns to Enforce

{Include domain-specific patterns based on specialist type}

### For Database Schemas:
- Table name: plural, lowercase with underscores
- Column names: snake_case in SQL
- Always include id (integer primary key), createdAt, updatedAt columns
- Columns in alphabetical order
- Export NewEntity (insert) and Entity (select) types
- Index naming: `{tablename}_{columnname}_idx`

### For Repositories:
- Interface with method signatures
- Factory function: `createXxxRepository(db: DrizzleDatabase)`
- Standard CRUD: create, getById, getAll, update, delete
- Auto-set updatedAt in update operations
- Proper type imports from schema

### For IPC Handlers:
- Channel constants in channels.ts
- Handler file per domain
- `registerXxxHandlers(dependencies)` export
- `ipcMain.handle()` for all operations
- `_event: IpcMainInvokeEvent` typing
- Keep preload.ts and types/electron.d.ts in sync

### For TanStack Query:
- Query key factory with `createQueryKeys`
- Spread keys in useQuery: `...entityKeys.query()`
- Always include `enabled: isElectron`
- Use `useElectronDb` for repository access
- Invalidation with `_def` property
- `void` prefix for invalidation promises

### For TanStack Table:
- Memoize `data` and `columns` with `useMemo`
- Set `manualPagination`, `manualSorting`, `manualFiltering` for server-side
- Include all table state in query keys
- Provide `pageCount` for server-side pagination
- Use `enabled` option in virtualizer when in tabs/modals
- Add `"use no memo"` for React 19 Compiler compatibility
- Use `accessorKey` for simple, `accessorFn` for computed columns
- Add `id` and `enableSorting: false` for action columns

### For TanStack Form:
- Use `useAppForm` from `@/lib/forms`
- Define validation schemas in `lib/validations/`
- Use pre-built field components (TextField, TextareaField, etc.)
- All fields require `label` prop
- Wrap SubmitButton in `form.AppForm`
- Native form with preventDefault

### For Components:
- Wrap Base UI primitives when available
- Use CVA for variants
- Use `ComponentPropsWithRef` for props
- Always accept and merge className with cn()
- Include focus-visible and data-disabled styles
- Named exports only

## Report Format

After making changes, provide a summary:

\`\`\`markdown
## Changes Applied

### File: `{file_path}`

#### Structural Changes
- {Change 1}
- {Change 2}

#### Pattern Fixes
- {Fix 1}
- {Fix 2}

#### Lines Modified
- Lines {n}-{m}: {description}

### Files Modified Count: 1
\`\`\`
```

**Save the agent's response** for the review phase.

Mark "Apply fixes using specialist agent" as completed.

### Phase 4: Validate Changes

Mark "Validate changes (lint, typecheck)" as in_progress.

**Run validation**:

```bash
pnpm lint
pnpm typecheck
pnpm format
```

**Track Validation Results**:

```markdown
## Validation Results

### ESLint

- Status: PASS/FAIL
- Errors remaining: {n}
- {Error details if any}

### TypeScript

- Status: PASS/FAIL
- Errors in modified file: {n}
- {Error details if any}

### Prettier

- Status: PASS/FAIL
```

**If validation fails**: Note the errors for the review phase.

Mark "Validate changes (lint, typecheck)" as completed.

### Phase 5: Review Changes

Mark "Review changes with second specialist" as in_progress.

**Dispatch a review agent** (can be same specialist type or a code review type):

```
subagent_type: "{selected-specialist}"

Review this file that was just updated to follow project patterns.

## Role
You are a code reviewer, NOT an implementer. Your job is to:
1. Verify the file now follows project patterns correctly
2. Identify any remaining issues or improvements needed
3. Check for regressions or new problems introduced

## File to Review
`{file_path}`

## Current Contents (after fixes)
{Read the file again to get current contents}

## Reference Files for Comparison
{Same reference files used in Phase 3}

## Validation Status
{Include validation results from Phase 4}

## Review Checklist

Check each item and report status:

{Include domain-specific checklist based on file type}

### For Database Schemas:
- [ ] Table name is plural, lowercase with underscores
- [ ] Column names are snake_case
- [ ] Standard columns (id, createdAt, updatedAt) present
- [ ] Columns in alphabetical order
- [ ] NewEntity and Entity types exported
- [ ] Indexes named correctly
- [ ] Foreign keys have cascade behavior

### For Repositories:
- [ ] Interface definition present
- [ ] Factory function exported
- [ ] CRUD methods implemented
- [ ] updatedAt auto-updated
- [ ] Types properly imported

### For IPC Handlers:
- [ ] Channels defined in channels.ts
- [ ] Handler uses ipcMain.handle
- [ ] Event typed as IpcMainInvokeEvent
- [ ] Registration function exported
- [ ] Preload API in sync
- [ ] Type definitions in sync

### For TanStack Query:
- [ ] Query key factory used
- [ ] Keys spread in useQuery
- [ ] enabled: isElectron present
- [ ] useElectronDb hook used
- [ ] Invalidation uses _def
- [ ] void prefix on invalidation

### For TanStack Table:
- [ ] Data wrapped in useMemo
- [ ] Columns wrapped in useMemo
- [ ] Server-side flags set correctly (manual*)
- [ ] Table state in query keys
- [ ] pageCount provided for server-side
- [ ] Virtualization guard if needed
- [ ] React 19 compatibility handled
- [ ] Column defs use accessorKey/accessorFn correctly
- [ ] Action columns have id and enableSorting: false

### For TanStack Form:
- [ ] useAppForm hook used
- [ ] Validation schema in lib/validations/
- [ ] Pre-built field components used
- [ ] All fields have label
- [ ] SubmitButton in form.AppForm
- [ ] Default values match schema

### For Components:
- [ ] Base UI primitives wrapped
- [ ] CVA used for variants
- [ ] ComponentPropsWithRef typing
- [ ] cn() for class merging
- [ ] Focus states included
- [ ] Disabled states included
- [ ] Named exports only

## Report Format

\`\`\`markdown
## Review Results

### Overall Assessment
{APPROVED | NEEDS_FIXES}

### Checklist Results
| Check | Status | Notes |
|-------|--------|-------|
| {item} | PASS/FAIL | {notes} |

### Issues Found (if any)
1. **{Issue Title}** (Severity: HIGH/MEDIUM/LOW)
   - Line: {n}
   - Problem: {description}
   - Recommendation: {how to fix}

### Summary
- Checks Passed: {n}/{total}
- Issues Found: {n}
- Recommendation: {APPROVED | FIX_REQUIRED}
\`\`\`
```

Mark "Review changes with second specialist" as completed.

### Phase 6: Iterate if Needed

Mark "Apply additional fixes if needed" as in_progress.

**Parse Review Results**:

- If review says `APPROVED` with 0 issues: Skip to Phase 7
- If review found issues: Proceed to fix them

**If Issues Found**:

Dispatch the specialist agent again with specific issues to fix:

```
subagent_type: "{selected-specialist}"

The code review found the following issues. Please fix them:

## File
`{file_path}`

## Issues to Fix

{List each issue from the review with line numbers and recommendations}

### Issue 1: {title}
- Line: {n}
- Problem: {description}
- Fix Required: {recommendation}

## Current File Contents
{file contents}

## Instructions
1. Fix each issue listed above
2. Verify each fix doesn't break other patterns
3. Run validation after fixes

Report the changes made for each issue.
```

**Run Validation Again**:

```bash
pnpm lint
pnpm typecheck
```

**Maximum Iterations**: 2 fix-review cycles. If issues persist after 2 iterations, report them as needing manual attention.

Mark "Apply additional fixes if needed" as completed.

### Phase 7: Generate Summary

Mark "Generate summary" as in_progress.

**Display Summary to User**:

```markdown
## File Fix Complete

### Target File

`{file_path}`

### Specialist Used

{specialist-type}

### Reference Files

- `{reference_path_1}`
- `{reference_path_2}` (if applicable)

### Changes Applied

{Summary of main changes from Phase 3}

### Validation

- ESLint: PASS/FAIL
- TypeScript: PASS/FAIL
- Prettier: PASS/FAIL

### Review Result

- Assessment: APPROVED / NEEDS_MANUAL_ATTENTION
- Checks Passed: {n}/{total}

{If issues remain}

### Issues Requiring Manual Attention

1. {issue description} (line {n})

### Next Steps

1. [ ] Review the changes
2. [ ] Run tests if applicable
3. [ ] Commit changes
```

Mark all todos as completed.

### Error Handling

| Failure                       | Action                                                  |
| ----------------------------- | ------------------------------------------------------- |
| File not found                | Show error with path suggestions                        |
| Unknown file type             | Ask user to specify specialist or suggest closest match |
| Specialist agent failed       | Retry once, then report failure                         |
| Validation failed repeatedly  | Continue but note in summary                            |
| Review found unfixable issues | Report for manual attention                             |

### Performance Notes

- **Single file focus**: This command focuses on one file at a time for precision
- **Reference files are key**: Good reference files improve fix quality significantly
- **Max 2 iterations**: Avoid infinite fix-review loops
- **Validation between phases**: Catch issues early

## Quality Standards

Good fixes must:

1. **Match reference patterns** - Follow the same structure and conventions
2. **Pass validation** - No lint or type errors
3. **Pass review** - Second specialist approves the changes
4. **Be minimal** - Only change what's needed to follow patterns
5. **Preserve functionality** - Don't break existing behavior
6. **Add appropriate documentation** - JSDoc where expected by patterns

---
name: fix-files
allowed-tools: Task(subagent_type:*), Task(subagent_type:claude-agent-sdk), Bash(timeout 120 pnpm typecheck), Bash(timeout 120 pnpm lint), Bash(timeout 60 pnpm format), Write(*), Read(*), Edit(*), Glob(*), Grep(*), TodoWrite(*)
argument-hint: 'path/to/file1.ts path/to/file2.ts [...more] [--reference=path/to/reference.ts] [--dry-run]'
description: Fix multiple files to follow project patterns using specialist agents with automatic review and iteration
disable-model-invocation: true
---

You are a multi-file fix orchestrator for Clarify. You coordinate specialist agents to fix
multiple files to follow project patterns, then review the changes and iterate if issues are found.

@CLAUDE.MD

## Command Usage

```
/fix-files path/to/file1.ts path/to/file2.ts [...more] [--reference=path/to/reference.ts] [--dry-run]
```

**Arguments**:

- `path/to/fileX.ts` (required, one or more): Paths to files to fix
  - Example: `db/schema/workflows.schema.ts`
  - Example: `db/repositories/workflows.repository.ts`
  - Example: `components/workflows/workflow-card.tsx`
  - Example: `hooks/queries/use-workflows.ts`
  - Example: `lib/validations/workflow.ts`
  - Example: `electron/ipc/workflow.ipc.ts`
- `--reference=path/to/reference.ts`: Optional global reference file to use as a pattern example across all files
- `--dry-run`: Analyze files and show what would be fixed without making changes

**Examples**:

```
/fix-files db/schema/workflows.schema.ts db/schema/feature-requests.schema.ts
/fix-files db/repositories/workflows.repository.ts db/repositories/features.repository.ts --reference=db/repositories/templates.repository.ts
/fix-files components/workflows/workflow-card.tsx components/workflows/workflow-step.tsx --dry-run
/fix-files hooks/queries/use-workflows.ts hooks/queries/use-feature-requests.ts
```

## Specialist Selection Matrix

See the "File Pattern Routing" section in @.claude/available-agents.md for the complete mapping of file patterns to specialist agents and their skills.

## Orchestration Workflow

### Phase 1: Input Validation & Analysis Setup

**1. Parse Arguments from $ARGUMENTS**:

- Extract one or more file paths
- Parse optional flags (--reference, --dry-run)
- Validate that at least one file path was provided

**2. If no files provided**: Stop with error message:

```
Error: At least one file path is required.

Usage: /fix-files path/to/file1.ts path/to/file2.ts [...more]

Examples:
  /fix-files db/schema/workflows.schema.ts db/schema/feature-requests.schema.ts
  /fix-files db/repositories/workflows.repository.ts db/repositories/features.repository.ts --reference=db/repositories/templates.repository.ts
```

**3. Validate Files Exist**:

- Check each provided file exists
- If any are missing, show missing paths with suggestions
- Continue only when all target files are valid

**4. Determine Specialist Type Per File**:

Using the Specialist Selection Matrix above:

- Analyze each file path
- Read file to check for patterns if needed
- Select the appropriate specialist agent type per file

**5. Find Reference Files Per File** (if not provided):

If no `--reference` flag:

- Find 1-2 well-implemented reference files in the same domain for each target file
- For schemas: Look for `templates.schema.ts`, `agents.schema.ts`
- For repositories: Look for `templates.repository.ts`, `agents.repository.ts`
- For components: Find similar components in the same feature area
- For queries: Look for `use-templates.ts`, `use-agents.ts`
- For IPC: Look for `template.ipc.ts`, `agent.ipc.ts`

If `--reference` is provided:

- Use it as a global primary reference for all files
- Add one domain-specific secondary reference per file when useful

**6. Initialize Todo List**:

```
- Analyze all files and identify issues
- Apply fixes using specialist agents
- Validate changes (lint, typecheck)
- Review changes with second specialist pass
- Apply additional fixes if needed
- Generate summary
```

### Phase 2: Initial Analysis (Using Specialist Agents)

Mark "Analyze all files and identify issues" as in_progress.

**IMPORTANT**: Use specialist agents for initial analysis. The specialist agents load skills containing project patterns and conventions, making them significantly better at identifying issues than analyzing directly.

For each target file, dispatch the specialist analysis agent:

```
subagent_type: "{selected-specialist-for-file}"

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

### For Schemas (database-schema):
- Proper import organization (drizzle-orm, relations, other schemas)
- Table naming conventions (camelCase for variable, snake_case in DB)
- Column type usage (text, integer, etc.)
- Proper relations definition
- Index definitions for common queries
- Export of both table and relations

### For Repositories (database-schema):
- Repository class pattern with constructor
- Async suffix on all methods
- Proper parameter typing
- Return type annotations
- Error handling patterns
- Transaction usage for multi-step operations

### For Query Hooks (tanstack-query):
- Query key factory usage from `lib/queries/`
- Proper queryOptions pattern
- IPC call integration via window.api
- Type inference from IPC channels
- Cache invalidation in mutations
- Optimistic update patterns where appropriate

### For Components (frontend-component):
- Base UI primitive usage
- CVA pattern for variants
- Hook organization order (state, queries, mutations, handlers, derived)
- Event handler naming (handle prefix)
- Boolean state naming (is prefix)
- Accessibility attributes
- Tailwind usage (no inline styles unless justified)

### For Pages (page-route):
- Route type definition for dynamic routes
- Proper Next.js App Router conventions
- Loading/error boundary setup
- Metadata exports
- Server/client component separation

### For IPC Handlers (ipc-handler):
- Channel naming conventions
- Handler registration pattern
- Type-safe IPC bridge
- Preload script exposure
- React hook wrapper

### For Stores (zustand-store):
- Store naming conventions (*-store.ts)
- Selector functions
- Persist middleware usage
- DevTools integration
- TypeScript type definitions

## Report Format

Provide your analysis in this exact format:

\`\`\`markdown
## Current State Analysis

### File: `{file_path}`
- Type: {schema|repository|query-hook|component|page|ipc-handler|store|validation}
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

**Save every analysis report** for use in Phase 3.

**If --dry-run**: Display all analysis reports grouped by file and stop here. Do not proceed to Phase 3.

Mark "Analyze all files and identify issues" as completed.

### Phase 3: Apply Fixes

Mark "Apply fixes using specialist agents" as in_progress.

For each target file, dispatch the specialist fix agent with the corresponding analysis from Phase 2:

```
subagent_type: "{selected-specialist-for-file}"

Fix this file to follow project patterns and conventions based on the analysis below.

## Target File
`{file_path}`

## Analysis from Phase 2
{Include the full analysis report for this file}

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
   - Type safety
   - Return value patterns
   - Documentation
   - Import organization

## Key Patterns to Enforce

{Include domain-specific patterns based on specialist type}

### For Schemas:
- Import organization (drizzle-orm first, then relations, then other schemas)
- Table variable naming (camelCase)
- Column definitions with proper types
- Relations with proper references
- Indexes for query optimization

### For Repositories:
- Repository class with db parameter
- Async suffix on all public methods
- Typed parameters and return values
- Transaction wrapping for multi-step operations
- Consistent error handling

### For Query Hooks:
- Query key factory from lib/queries/
- queryOptions helper usage
- IPC integration via window.api
- Proper cache invalidation
- Type inference from IPC

### For Components:
- Base UI primitive usage
- CVA for variant management
- Proper hook organization
- Event handlers with handle prefix
- Boolean states with is prefix
- Accessibility attributes

### For Pages:
- Route type definitions
- App Router conventions
- Loading/error states
- Proper metadata

### For IPC Handlers:
- Channel naming (entity.action format)
- Handler registration in main process
- Preload script exposure
- React hook wrapper

### For Stores:
- Zustand create pattern
- Selector functions
- Persist middleware
- DevTools integration

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
\`\`\`
```

**Save each agent response** for the review phase.

Mark "Apply fixes using specialist agents" as completed.

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
- Errors in modified files: {n}
- {Error details if any}

### Prettier

- Status: PASS/FAIL
```

**If validation fails**: Note all errors for the review and iteration phases.

Mark "Validate changes (lint, typecheck)" as completed.

### Phase 5: Review Changes

Mark "Review changes with second specialist pass" as in_progress.

For each target file, dispatch a review agent (can be same specialist type or a code review type):

```
subagent_type: "{selected-specialist-for-file}"

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
{Same reference files used in Phase 3 for this file}

## Validation Status
{Include validation results from Phase 4}

## Review Checklist

Check each item and report status:

{Include domain-specific checklist based on file type}

### For Schemas:
- [ ] Proper import organization
- [ ] Correct table naming
- [ ] Appropriate column types
- [ ] Relations properly defined
- [ ] Indexes for common queries
- [ ] Exports complete

### For Repositories:
- [ ] Repository class pattern followed
- [ ] Async suffix on methods
- [ ] Proper typing throughout
- [ ] Error handling consistent
- [ ] Transactions where needed

### For Query Hooks:
- [ ] Query key factory used
- [ ] queryOptions pattern correct
- [ ] IPC integration proper
- [ ] Cache invalidation correct
- [ ] Types inferred correctly

### For Components:
- [ ] Base UI primitives used
- [ ] CVA patterns correct
- [ ] Hook organization proper
- [ ] Event handlers named correctly
- [ ] Accessibility complete
- [ ] No inline styles

### For Pages:
- [ ] Route types defined
- [ ] App Router conventions followed
- [ ] Loading/error states present
- [ ] Metadata exported

### For IPC Handlers:
- [ ] Channel naming correct
- [ ] Handler registration proper
- [ ] Preload exposure correct
- [ ] React hook complete

### For Stores:
- [ ] Zustand pattern correct
- [ ] Selectors defined
- [ ] Persistence configured
- [ ] Types complete

## Report Format

\`\`\`markdown
## Review Results

### File: `{file_path}`
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

Mark "Review changes with second specialist pass" as completed.

### Phase 6: Iterate if Needed

Mark "Apply additional fixes if needed" as in_progress.

**Parse all review results**:

- If all files are `APPROVED` with 0 issues: Skip to Phase 7
- If any file has issues: Fix only those files

**If issues are found for a file**:

Dispatch the specialist agent again with specific issues to fix:

```
subagent_type: "{selected-specialist-for-file}"

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

**Maximum Iterations**: 2 fix-review cycles per file. If issues persist for any file after 2 iterations, report those files as needing manual attention.

Mark "Apply additional fixes if needed" as completed.

### Phase 7: Generate Summary

Mark "Generate summary" as in_progress.

**Display Summary to User**:

```markdown
## Files Fix Complete

### Target Files

{List all file paths}

### Specialists Used

{List specialist type per file}

### Reference Files

{List references used per file}

### Changes Applied

{Per-file summary of main changes from Phase 3}

### Validation

- ESLint: PASS/FAIL
- TypeScript: PASS/FAIL
- Prettier: PASS/FAIL

### Review Results

- Files Approved: {n}/{total}
- Files Needing Manual Attention: {n}

{If issues remain}

### Issues Requiring Manual Attention

1. `{file_path}`: {issue description} (line {n})

### Next Steps

1. [ ] Review the changes
2. [ ] Run tests if applicable
3. [ ] Commit changes
```

Mark all todos as completed.

### Error Handling

| Failure                        | Action                                                  |
| ------------------------------ | ------------------------------------------------------- |
| Any file not found             | Show missing paths with suggestions                     |
| Unknown file type              | Ask user to specify specialist or suggest closest match |
| Specialist agent failed        | Retry once, then report failure for affected files      |
| Validation failed repeatedly   | Continue but note impacted files in summary             |
| Review found unfixable issues  | Report affected files for manual attention              |

### Performance Notes

- **Batch focus**: This command handles multiple files in one workflow
- **Per-file specialist routing**: Each file can use a different specialist
- **Reference files are key**: Good reference files improve fix quality significantly
- **Max 2 iterations per file**: Avoid infinite fix-review loops
- **Validation between phases**: Catch issues early across the batch

## Quality Standards

Good fixes must:

1. **Match reference patterns** - Follow the same structure and conventions
2. **Pass validation** - No lint or type errors
3. **Pass review** - Specialist review approves each file
4. **Be minimal** - Only change what's needed to follow patterns
5. **Preserve functionality** - Don't break existing behavior
6. **Add appropriate documentation** - JSDoc where expected by patterns

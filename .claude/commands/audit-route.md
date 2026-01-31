---
allowed-tools: Task(subagent_type:database-schema), Task(subagent_type:ipc-handler), Task(subagent_type:tanstack-query), Task(subagent_type:tanstack-table), Task(subagent_type:tanstack-form), Task(subagent_type:tanstack-form-base-components), Task(subagent_type:frontend-component), Task(subagent_type:vercel-react-best-practices), Task(subagent_type:Explore), Bash(timeout 120 pnpm typecheck), Bash(timeout 120 pnpm lint), Write(*), Read(*), Edit(*), Glob(*), Grep(*), TodoWrite(*)
argument-hint: "/route-path [--fix] [--domain=frontend|backend|ipc|hooks|all]"
description: Audit a route/feature area for best practice violations across all layers (frontend through backend), optionally fix issues
---

You are a route audit orchestrator. You coordinate multiple specialist agents to analyze
all files related to a route, identify violations of project conventions, and optionally
fix them with review cycles.

@CLAUDE.MD

## Command Usage

```
/audit-route /route-path [--fix] [--domain=frontend|backend|ipc|hooks|all]
```

**Arguments**:

- `/route-path` (required): The app route to audit
  - Example: `/agents`
  - Example: `/workflows/[id]`
  - Example: `/projects`
- `--fix`: Automatically fix violations after reporting (requires user confirmation)
- `--domain=X`: Limit audit to specific domain(s). Options:
  - `frontend` - Components, pages, UI files
  - `backend` - Database schemas, repositories
  - `ipc` - Electron IPC handlers, preload, types
  - `hooks` - Query hooks, stores, validations
  - `all` (default) - All domains

**Examples**:

```
/audit-route /agents
/audit-route /workflows/[id] --fix
/audit-route /projects --domain=backend
/audit-route /templates --domain=frontend --fix
```

## File Discovery Patterns

Map routes to their associated files:

### Route: `/agents`
```
app/(app)/agents/
├── page.tsx                    → frontend-component
├── layout.tsx                  → frontend-component
├── route-type.ts               → frontend-component (nextjs-routing-conventions)
└── _components/*.tsx           → frontend-component

hooks/
├── queries/use-agents.ts       → tanstack-query
├── use-agent-*.ts              → tanstack-query (custom hooks)

lib/
├── queries/agents.ts           → tanstack-query
├── validations/agent.ts        → tanstack-form
├── stores/agent-*-store.ts     → zustand

db/
├── schema/agents.schema.ts     → database-schema
├── repositories/agents.repository.ts → database-schema

electron/ipc/
├── agent.handlers.ts           → ipc-handler
├── agent-*.handlers.ts         → ipc-handler
```

### Discovery Rules

For a given route `/route-name`:

1. **Page Files**: `app/(app)/{route-name}/**/*.tsx`
2. **Route Types**: `app/(app)/{route-name}/**/route-type.ts`
3. **Query Hooks**: `hooks/queries/use-{entity}.ts`, `hooks/use-{entity}-*.ts`
4. **Query Keys**: `lib/queries/{entity}.ts`
5. **Validations**: `lib/validations/{entity}.ts`
6. **Stores**: `lib/stores/{entity}-*-store.ts`
7. **Schemas**: `db/schema/{entity}*.schema.ts`
8. **Repositories**: `db/repositories/{entity}*.repository.ts`
9. **IPC Handlers**: `electron/ipc/{entity}*.handlers.ts`

## Domain Classification

| Domain | File Patterns | Specialist Agent | Skills |
|--------|---------------|------------------|--------|
| `frontend` | `app/**/*.tsx`, `components/**/*.tsx` | `frontend-component` | component-conventions, react-coding-conventions, nextjs-routing-conventions |
| `backend` | `db/schema/*.ts`, `db/repositories/*.ts` | `database-schema` | database-schema-conventions |
| `ipc` | `electron/ipc/*.ts`, `preload.ts`, `types/electron.d.ts` | `ipc-handler` | ipc-handler-conventions |
| `hooks` | `hooks/**/*.ts`, `lib/queries/*.ts` | `tanstack-query` | tanstack-query-conventions |
| `forms` | `lib/validations/*.ts` | `tanstack-form` | tanstack-form-conventions |
| `stores` | `lib/stores/*.ts` | Uses `zustand-state-management` skill | zustand-state-management |

## Orchestration Workflow

### Phase 1: Input Validation & Discovery

**1. Parse Arguments from $ARGUMENTS**:

- Extract route path (remove leading `/` if present for matching)
- Parse optional flags (--fix, --domain)
- Validate route path is provided

**2. If no route provided**: Stop with error message:

```
Error: Route path required.

Usage: /audit-route /route-path [--fix] [--domain=frontend|backend|ipc|hooks|all]

Examples:
  /audit-route /agents
  /audit-route /workflows/[id] --fix
  /audit-route /projects --domain=backend
```

**3. Extract Entity Name**:

From the route path, extract the entity name for file discovery:
- `/agents` → `agents`, singular: `agent`
- `/workflows/[id]` → `workflows`, singular: `workflow`
- `/projects` → `projects`, singular: `project`

**4. Discover Related Files**:

Use Glob to find all files related to the route. Run these searches in parallel:

```
# Page files
app/(app)/{route-name}/**/*.tsx
app/(app)/{route-name}/**/route-type.ts

# Query hooks (try both plural and singular)
hooks/queries/use-{entity}.ts
hooks/queries/use-{singular}.ts
hooks/use-{singular}-*.ts

# Query keys
lib/queries/{entity}.ts
lib/queries/{singular}.ts

# Validations
lib/validations/{singular}.ts
lib/validations/{entity}.ts

# Stores
lib/stores/{singular}-*-store.ts

# Database
db/schema/{entity}*.schema.ts
db/schema/{singular}*.schema.ts
db/repositories/{entity}*.repository.ts
db/repositories/{singular}*.repository.ts

# IPC
electron/ipc/{singular}*.handlers.ts
```

**5. Classify Files by Domain**:

Group discovered files into domains using the Domain Classification table above.

**6. Filter by --domain flag** (if provided):

If `--domain` is specified, only include files from that domain.

**7. Initialize Todo List**:

```
- Discover files for route
- Analyze frontend files
- Analyze backend files
- Analyze IPC files
- Analyze hooks/queries files
- Generate combined report
- [If --fix] Apply fixes by domain
- [If --fix] Validate changes
- [If --fix] Review and iterate
```

**8. Display Discovery Results**:

```markdown
## File Discovery for Route: `/{route-name}`

### Files Found: {total}

#### Frontend ({count})
- `app/(app)/{route-name}/page.tsx`
- `app/(app)/{route-name}/_components/...`

#### Backend ({count})
- `db/schema/{entity}.schema.ts`
- `db/repositories/{entity}.repository.ts`

#### IPC ({count})
- `electron/ipc/{entity}.handlers.ts`

#### Hooks ({count})
- `hooks/queries/use-{entity}.ts`
- `lib/queries/{entity}.ts`

#### Forms/Validations ({count})
- `lib/validations/{entity}.ts`

#### Stores ({count})
- `lib/stores/{entity}-store.ts`
```

Mark "Discover files for route" as completed.

### Phase 2: Parallel Domain Analysis

**IMPORTANT**: Run domain analyses IN PARALLEL using multiple Task tool calls in a single message. This dramatically improves performance.

For each domain with files, dispatch a specialist analysis agent:

#### Frontend Analysis

Mark "Analyze frontend files" as in_progress.

```
subagent_type: "frontend-component"

Analyze these frontend files for violations of project conventions.

## Role
You are a code ANALYST. Identify all violations but DO NOT make changes.

## Files to Analyze

{List each frontend file with full contents}

### `{file_path}`
```tsx
{file contents}
```

## Conventions to Check

Load and apply these skills:
- component-conventions
- react-coding-conventions
- nextjs-routing-conventions

### Specific Checks:

**Page Files (page.tsx)**:
- [ ] Has 'use client' directive
- [ ] Has route-type.ts if page has URL params
- [ ] Uses withParamValidation HOC if has params
- [ ] Uses numeric ID validation (z.coerce.number().int().positive())
- [ ] Has proper loading states (skeleton components)
- [ ] Has QueryErrorBoundary wrapper
- [ ] Skeleton components colocated in _components/

**Components**:
- [ ] Wraps Base UI primitives
- [ ] Uses CVA for variants
- [ ] className comes LAST in cn() calls
- [ ] Uses standard size scale (sm, default, lg only)
- [ ] Uses ComponentPropsWithRef for props
- [ ] Has focus-visible and data-disabled states
- [ ] Named exports only (no default)
- [ ] JSDoc on exported components

## Report Format

```markdown
## Frontend Analysis Report

### Files Analyzed
- `{file_path}` ({lines} lines)

### Violations Found

#### HIGH Priority
1. **{Issue}**
   - File: `{path}:{line}`
   - Rule: `{rule-id}`
   - Problem: {description}
   - Fix: {what should be done}

#### MEDIUM Priority
...

#### LOW Priority
...

### Summary
- Total violations: {n}
- High: {n}, Medium: {n}, Low: {n}
- Auto-fixable: {n}
```
```

#### Backend Analysis

Mark "Analyze backend files" as in_progress.

```
subagent_type: "database-schema"

Analyze these database files for violations of project conventions.

## Role
You are a code ANALYST. Identify all violations but DO NOT make changes.

## Files to Analyze

{List each backend file with full contents}

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

{Same format as frontend}
```

#### IPC Analysis

Mark "Analyze IPC files" as in_progress.

```
subagent_type: "ipc-handler"

Analyze these IPC files for violations of project conventions.

## Role
You are a code ANALYST. Identify all violations but DO NOT make changes.

## Files to Analyze

{List each IPC file with full contents}

Also check for synchronization issues with:
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

{Same format as frontend}
```

#### Hooks/Queries Analysis

Mark "Analyze hooks/queries files" as in_progress.

```
subagent_type: "tanstack-query"

Analyze these query/hook files for violations of project conventions.

## Role
You are a code ANALYST. Identify all violations but DO NOT make changes.

## Files to Analyze

{List each hooks file with full contents}

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

{Same format as frontend}
```

**Wait for all analysis agents to complete**, then combine their reports.

Mark all "Analyze *" todos as completed.

### Phase 3: Generate Combined Report

Mark "Generate combined report" as in_progress.

Combine all domain reports into a single comprehensive report:

```markdown
## Audit Report: `/{route-name}`

### Overview

| Domain | Files | Violations | High | Medium | Low |
|--------|-------|------------|------|--------|-----|
| Frontend | {n} | {n} | {n} | {n} | {n} |
| Backend | {n} | {n} | {n} | {n} | {n} |
| IPC | {n} | {n} | {n} | {n} | {n} |
| Hooks | {n} | {n} | {n} | {n} | {n} |
| **Total** | **{n}** | **{n}** | **{n}** | **{n}** | **{n}** |

### Files Analyzed

{List all files by domain}

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
/audit-route /{route-name} --fix
```
```

**Display report to user**.

Mark "Generate combined report" as completed.

**If --fix flag NOT provided**: Stop here. The audit is complete.

### Phase 4: Apply Fixes (if --fix)

**Ask for confirmation**:

```
Found {n} violations ({auto-fixable} auto-fixable).

Proceed with automatic fixes?
- Fixes will be applied by domain-specific specialists
- Changes will be validated (lint, typecheck)
- Up to 2 fix-review cycles will run

[Y/n]
```

If user confirms, proceed. Otherwise, stop.

Mark "[If --fix] Apply fixes by domain" as in_progress.

**Dispatch fix agents IN PARALLEL by domain**:

For each domain with violations:

```
subagent_type: "{domain-specialist}"

Fix the violations identified in the audit for these files.

## Role
You are an implementer. Fix all violations while preserving existing functionality.

## Files to Fix

{List files with current contents}

## Violations to Fix

{List violations for this domain from the audit report}

## Reference Files

{Include 1-2 well-implemented reference files for this domain}

## Conventions

{Load appropriate skill for this domain}

## Instructions

1. Fix each violation listed
2. Follow the patterns from reference files
3. Preserve existing functionality
4. Report changes made

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

### Phase 5: Validate Changes (if --fix)

Mark "[If --fix] Validate changes" as in_progress.

Run validation:

```bash
pnpm lint
pnpm typecheck
```

**Track results**:

```markdown
## Validation Results

### ESLint
- Status: PASS/FAIL
- Errors: {n}
- {Details if failed}

### TypeScript
- Status: PASS/FAIL
- Errors: {n}
- {Details if failed}
```

Mark "[If --fix] Validate changes" as completed.

### Phase 6: Review and Iterate (if --fix)

Mark "[If --fix] Review and iterate" as in_progress.

**Dispatch review agents IN PARALLEL by domain**:

```
subagent_type: "{domain-specialist}"

Review the fixes applied to these files.

## Role
You are a code REVIEWER. Verify fixes are correct and identify any remaining issues.

## Files to Review

{List files with current (post-fix) contents}

## Original Violations

{List violations that were supposed to be fixed}

## Validation Results

{Include lint/typecheck results}

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

Dispatch fix agents again with specific remaining issues.

**If cycle >= 2 or all fixed**:

Proceed to final summary.

Mark "[If --fix] Review and iterate" as completed.

### Phase 7: Final Summary

```markdown
## Audit Complete: `/{route-name}`

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
| Route not found | Suggest similar routes |
| No files found | Check if route exists, suggest alternatives |
| Specialist failed | Retry once, then report |
| Validation failed | Continue but note in summary |
| Max iterations reached | Report remaining issues for manual fix |

## Performance Notes

- **Parallel analysis**: All domain analyses run concurrently
- **Parallel fixes**: All domain fixes run concurrently
- **Max 2 iterations**: Prevents infinite fix loops
- **Domain filtering**: Use --domain to focus on specific areas

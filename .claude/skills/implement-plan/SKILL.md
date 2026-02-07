---
name: implement-plan
allowed-tools: Task(subagent_type:general-purpose), Task(subagent_type:claude-agent-sdk), Task(subagent_type:database-schema), Task(subagent_type:tanstack-query), Task(subagent_type:tanstack-table), Task(subagent_type:tanstack-form), Task(subagent_type:tanstack-form-base-components), Task(subagent_type:ipc-handler), Task(subagent_type:frontend-component), Task(subagent_type:page-route), Task(subagent_type:zustand-store), Task(subagent_type:vercel-react-best-practices), Read(*), Write(*), Bash(git:*,mkdir:*,npm:*,pnpm:*,cd:*), TodoWrite(*), AskUserQuestion(*)
argument-hint: "path/to/implementation-plan.md [--step-by-step|--dry-run|--resume-from=N|--worktree]"
description: Execute implementation plan with structured tracking and validation using subagent architecture
disable-model-invocation: true
---

## CRITICAL: You Are an Orchestrator, NOT an Implementer

**YOU MUST delegate every implementation step to a subagent using the Task tool.**

**YOU MUST NOT:**

- ❌ Use Edit tool to modify code files
- ❌ Use Write tool to create code files
- ❌ Implement any code changes yourself
- ❌ Read source files to understand implementation details

**YOU MUST:**

- ✅ Use Task tool with `subagent_type` for EVERY implementation step
- ✅ Only use Read for the plan file and log files you create
- ✅ Only use Write for implementation log files (in docs/)
- ✅ Coordinate, track progress, and log results

**If you find yourself about to use Edit or Write on a source file: STOP. You are violating the core pattern. Use the Task tool instead.**

---

## Quick Reference: Correct Pattern

```
1. Read the plan file
2. Create routing table (which specialist handles each step)
3. For EACH step:
   → Task(subagent_type="specialist", prompt="Implement step N...")
   → Process subagent results
   → Log results
   → Update todo
4. Run quality gates
5. Offer git commit
```

---

## Common Mistakes - DO NOT DO THESE

| Wrong                                          | Right                                  |
| ---------------------------------------------- | -------------------------------------- |
| Reading component files to understand patterns | Subagent reads files it needs          |
| Using Edit to modify source code               | Task tool delegates to subagent        |
| Using Write to create new components           | Task tool delegates to subagent        |
| Implementing multiple steps before delegating  | Delegate EACH step via Task tool       |
| Skipping the routing table                     | ALWAYS create routing table in Phase 2 |

---

## Your Role as Orchestrator

You are a **lightweight coordinator**. Your job is:

1. **Parse** the implementation plan
2. **Route** each step to the correct specialist agent
3. **Track** progress via TodoWrite
4. **Log** results to implementation log files
5. **Coordinate** quality gates and git commit

You do NOT implement code. Subagents implement code.

---

## Command Usage

```
/implement-plan <plan-file-path> [options]
```

**Options:**

- `--step-by-step`: Pause for user approval between each step
- `--dry-run`: Show what would be done without making changes
- `--resume-from=N`: Resume implementation from step N (if previous run failed)
- `--worktree`: Create a new git worktree with feature branch for isolated development

**Examples:**

- `/implement-plan docs/2025_11_11/plans/add-user-auth-implementation-plan.md`
- `/implement-plan docs/2025_11_11/plans/notifications-implementation-plan.md --step-by-step`
- `/implement-plan docs/2025_11_11/plans/admin-dashboard-implementation-plan.md --dry-run`

## Available Specialist Agents

See the "Specialist Subagents" table in @.claude/available-agents.md for the complete list of available agents.

## Step-Type Detection Rules

See the "Step-Type Detection Rules" section in @.claude/available-agents.md for the routing logic.

---

## Workflow Phases

### Phase 1: Pre-Implementation Checks (Orchestrator)

1. Record execution start time
2. Parse arguments and validate plan file exists
3. **Worktree Setup** (if `--worktree` flag):
   - Create worktree at `.worktrees/{feature-slug}/`
   - Create branch `feat/{feature-slug}`
   - Run `pnpm install`
4. **Git Safety Checks**:
   - Block if on `main` (unless worktree created)
   - Check for uncommitted changes
5. **Read Implementation Plan** using Read tool
6. Create implementation directory: `docs/{YYYY_MM_DD}/implementation/{feature-name}/`
7. Save `01-pre-checks.md` log file
8. **Dry-Run Mode**: If `--dry-run`, output plan summary and exit

### Phase 2: Setup and Routing Table (Orchestrator)

**CRITICAL: You MUST create the routing table before any implementation.**

1. Extract all steps from the plan
2. **Create Routing Table** - For each step, determine the specialist:
   ```
   Step 1: database-schema (db/schema/users.schema.ts)
   Step 2: tanstack-query (hooks/queries/use-users.ts)
   Step 3: zustand-store (lib/stores/user-preferences-store.ts)
   Step 4: tanstack-table (components/features/users/users-table.tsx)
   Step 5: tanstack-form-base-components (components/ui/form/combobox-field.tsx)
   Step 6: tanstack-form (components/users/create-user-form.tsx, lib/validations/user.ts)
   Step 7: frontend-component (components/ui/avatar.tsx)
   Step 8: frontend-component (components/features/users/user-card.tsx)
   Step 9: page-route (app/(app)/users/page.tsx, app/(app)/users/[id]/page.tsx)
   Step 10: general-purpose (lib/utils/format-user.ts)
   ...
   ```
3. Create TodoWrite with all steps labeled with their specialist:
   - Format: "Step N: {title} [{specialist}]"
4. Save `02-setup.md` with the routing table
5. Output: `MILESTONE:PHASE_2_COMPLETE`

### Phase 3: Step Execution (Delegation to Subagents)

**For EACH step, you MUST use the Task tool to delegate:**

1. Mark step todo as "in_progress"
2. Look up specialist from routing table
3. **Launch subagent using Task tool:**

```
Task(
  subagent_type: "{specialist-from-routing-table}",
  description: "Implement step {N}: {title}",
  prompt: "You are implementing Step {N} of an implementation plan...

    **What to do**: {description from plan}
    **Why**: {rationale from plan}
    **Files**: {file list from plan}
    **Validation**: Run pnpm lint && pnpm typecheck
    **Success criteria**: {criteria from plan}

    Return structured results with:
    - Status: success | failure
    - Files modified/created
    - Validation results
    - Success criteria verification"
)
```

4. Process subagent results
5. Save step log: `0{N+2}-step-{N}-results.md`
6. Mark todo as "completed" (or keep "in_progress" if failed)
7. Output progress: "Completed step {N}/{Total} [{specialist}]"

**Repeat for ALL steps. Do not skip the Task tool.**

### Phase 4: Quality Gates (Orchestrator)

1. Run `pnpm lint && pnpm typecheck` via Bash
2. Save `XX-quality-gates.md`
3. Mark quality gates todo as completed/failed

### Phase 5: Summary and Commit (Orchestrator)

1. Calculate statistics (steps completed, files changed, etc.)
2. Save `YY-implementation-summary.md`
3. Offer git commit via AskUserQuestion
4. Handle worktree cleanup if applicable

---

## Specialist Subagent Prompt Template

When calling Task tool for each step, use this prompt structure:

```
You are implementing Step {N}/{Total} of an implementation plan.

## Step Details

**Title**: {Step Title}
**Specialist**: {specialist-type}

**What to do**:
{What description from plan}

**Why**:
{Why rationale from plan}

**Files to work with**:
{List of file paths}

**Validation commands**:
pnpm lint && pnpm typecheck

**Success criteria**:
{List from plan}

## Instructions

1. Read all files mentioned above
2. Implement the changes described in "What to do"
3. Run validation commands
4. Verify success criteria

## Return Format

Provide results in this format:

**Status**: success | failure

**Files Modified**:
- path/to/file.ts - Description of changes

**Files Created**:
- path/to/new-file.ts - Purpose

**Validation Results**:
- pnpm lint: PASS/FAIL
- pnpm typecheck: PASS/FAIL

**Success Criteria**:
- [✓] Criterion 1
- [✓] Criterion 2

**Notes for Next Steps**: {anything important}
```

---

## File Output Structure

All logs go in `docs/{YYYY_MM_DD}/implementation/{feature-name}/`:

```
00-implementation-index.md    # Overview and navigation
01-pre-checks.md              # Pre-implementation validation
02-setup.md                   # Routing table and step assignments
03-step-1-results.md          # Step 1 subagent results
04-step-2-results.md          # Step 2 subagent results
...
XX-quality-gates.md           # Quality gate results
YY-implementation-summary.md  # Final summary
```

---

## Error Handling

**If subagent fails:**

1. Log failure details to step results file
2. Keep todo as "in_progress"
3. In `--step-by-step` mode: Ask user how to proceed
4. Otherwise: Continue to next step or abort based on severity

**If quality gates fail:**

1. Show error output
2. Provide fix recommendations
3. Ask user whether to continue or abort

---

## Reminder: You Are the Orchestrator

Before taking any action, ask yourself:

> "Am I about to edit or write a source code file?"

If yes: **STOP and use Task tool instead.**

Your tools for implementation are:

- ✅ `Task(subagent_type="...")` - Delegate implementation
- ✅ `Read` - Only for plan file and your log files
- ✅ `Write` - Only for log files in docs/
- ✅ `TodoWrite` - Track progress
- ✅ `Bash` - Git commands, mkdir, pnpm commands
- ✅ `AskUserQuestion` - User decisions

Your tools are NOT for:

- ❌ `Edit` on source files
- ❌ `Write` on source files
- ❌ `Read` on source files (subagents do this)

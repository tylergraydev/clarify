# Clarify Implementation Review - Findings Report

**Date:** January 29, 2026
**Scope:** All features excluding core workflow execution (Claude CLI integration)
**Purpose:** Identify gaps, incomplete implementations, and deviations from design document

---

## Executive Summary

A comprehensive review of the Clarify application against the design document reveals that the structural foundation is **85-95% complete**. The database schema is 100% implemented with all 17 tables. However, several UI features are incomplete, some business logic is missing, and there are a few critical bugs that need attention.

### Key Findings

| Area             | Completion | Critical Issues                          |
| ---------------- | ---------- | ---------------------------------------- |
| Database Schema  | 100%       | None                                     |
| Projects/Repos   | 90%        | Missing Edit Repository UI               |
| Workflows        | 85%        | Auto-start not implemented               |
| Templates        | 95%        | Missing built-in template seeding        |
| Agents           | 75%        | Missing tool/skill UI, no seeding        |
| Settings         | 85%        | Missing per-step-type timeouts           |
| Dashboard        | 85%        | Status bar not wired, missing fields     |
| Navigation/Shell | 95%        | Status bar activeWorkflowCount not wired |
| IPC Handlers     | 98%        | Critical type mismatch in step:complete  |

---

## 1. Dashboard Issues

### 1.1 Missing Features

| Feature                             | Design Spec              | Status                        | Location                      |
| ----------------------------------- | ------------------------ | ----------------------------- | ----------------------------- |
| Branch name on active workflows     | Show "Branch: feat/xxx"  | Not implemented               | `active-workflows-widget.tsx` |
| Action buttons on dashboard cards   | View/Pause/Resume/Cancel | Not implemented               | `active-workflows-widget.tsx` |
| Duration column in recent workflows | "8m 32s" format          | Not implemented               | `recent-workflows-widget.tsx` |
| "New Workflow" button in header     | Per design mockup        | In Quick Actions card instead | `app-header.tsx`              |

### 1.2 Status Bar Not Wired

**Critical Bug:** The `activeWorkflowCount` prop is defined on `StatusBar` but never passed from the layout.

**Location:** `app/(app)/layout.tsx:54`

```tsx
<StatusBar /> // Missing: activeWorkflowCount prop
```

**Impact:** Status bar always shows "No active workflows" regardless of actual state.

**Fix Required:** Use `useActiveWorkflows()` hook to get count and pass to StatusBar.

### 1.3 Dashboard Cards Missing Information

Active workflow cards don't display:

- Branch name for implementation workflows
- Inline action buttons (View, Pause/Resume, Cancel)

Note: These ARE implemented on `/workflows/active` page cards but not on dashboard widget.

---

## 2. Projects & Repositories Issues

### 2.1 Missing Edit Repository UI

**Status:** Repository editing is NOT possible after creation.

**What exists:**

- IPC handler: `repository:update` ✓
- React hook: `useUpdateRepository()` ✓
- Repository method: `update()` ✓

**What's missing:**

- `EditRepositoryDialog` component
- Edit button on `RepositoryCard`
- `updateRepositorySchema` validation

**Impact:** Users must delete and recreate repositories to fix mistakes.

### 2.2 Missing Delete Confirmation Dialogs

Deleting repositories and projects happens immediately without confirmation.

**Affected components:**

- `RepositoryCard` - "Remove" button deletes immediately
- Should have confirmation dialog showing any associated workflows

### 2.3 Clear Default Repository UX

No explicit "Unset Default" button for repositories. Users must set another repository as default to clear the current default.

---

## 3. Workflows Issues

### 3.1 Workflow Not Auto-Started After Creation

**Design Intent:** Creating a workflow should start it automatically (transition to "running").

**Current Behavior:** Workflow is created with status "created" and stays there.

**Missing:** UI to start a workflow after creation, or auto-start on create.

### 3.2 Missing Repository Selection in Create Flow

**Design Flow:**

1. Select Repository ❌ NOT IMPLEMENTED
2. Enter Feature Request ✓
3. Configure Workflow ✓
4. Start Workflow ⚠️ (creates but doesn't start)

Currently only project selection is available, not repository selection.

### 3.3 Missing Timeout Configuration UI

Design specifies per-step-type timeouts:

- Clarification: 60s
- Refinement: 30s
- File Discovery: 120s
- Planning: 180s
- Implementation: 300s per step

**Current:** Single generic "Step Timeout" field only.

### 3.4 Missing Skip Clarification Toggle

Design mentions toggle to skip clarification step - not implemented in create workflow form.

### 3.5 Missing Workflow Delete/Archive

Repository has `delete()` method but no UI or mutation hook to use it.

### 3.6 Missing Step Actions in Detail View

Workflow detail page doesn't have:

- Edit individual step outputs
- Retry failed steps
- Skip steps
- Step input/output inline editing

---

## 4. Templates Issues

### 4.1 Missing Built-in Template Seeding

**Critical Gap:** No code exists to seed the 7 design-specified built-in templates:

| Template         | Category |
| ---------------- | -------- |
| CRUD Feature     | Data     |
| Form Component   | UI       |
| API Integration  | Backend  |
| Auth Flow        | Security |
| Dashboard Widget | UI       |
| IPC Channel      | Electron |
| Settings Page    | UI       |

**What exists:**

- Schema supports `builtInAt` column ✓
- UI correctly identifies and protects built-in templates ✓
- Read-only enforcement works ✓

**What's missing:**

- Seeding logic in database initialization
- Template content for the 7 templates
- Migration or seed file with INSERT statements

### 4.2 Template Placeholders Not Persisted with Template

The placeholder editor UI exists and works, but placeholders may not be correctly saved when creating/updating templates (needs verification).

---

## 5. Agents Issues

### 5.1 Missing Built-in Agent Seeding

**Critical Gap:** No code exists to seed the 11 design-specified built-in agents:

**Planning Agents:**

- clarification-agent
- file-discovery-agent
- implementation-planner

**Specialist Agents:**

- database-schema
- tanstack-query
- tanstack-form
- tanstack-form-base
- ipc-handler
- frontend-component
- general-purpose

**Review Agents:**

- gemini-review

**Impact:** Users see empty agents list on first run.

### 5.2 Missing Tool Permissions UI

**Design shows:**

```
Allowed Tools
├─ [✓] Read(*)
├─ [✓] Write(*)
├─ [✓] Edit(*)
├─ [✓] Bash(pnpm db:generate)
└─ [+ Add Tool]
```

**Current:** Agent editor only has displayName, description, and systemPrompt fields.

**What exists:**

- `agent_tools` database table ✓
- Schema with toolName, toolPattern, disallowedAt ✓

**What's missing:**

- UI component to manage tool permissions
- Integration in AgentEditorDialog

### 5.3 Missing Skills Management UI

**Design shows:** Referenced Skills section with View/Detach buttons.

**What exists:**

- `agent_skills` database table ✓
- Schema with skillName, requiredAt ✓

**What's missing:**

- UI component to manage agent skills
- Integration in AgentEditorDialog

### 5.4 Missing Color Tag Editor

**Design shows:** Radio buttons for color selection (green, blue, yellow, cyan, red).

**What exists:**

- `color` field in agents schema ✓
- Color indicator displayed on agent cards ✓

**What's missing:**

- Color selection UI in AgentEditorDialog

### 5.5 Color Map Mismatch

`AgentCard` component has colors mapped that aren't in schema:

- Schema defines: green, blue, yellow, cyan, red
- Card map includes: gray, magenta, orange (extras)

---

## 6. Settings Issues

### 6.1 Missing Per-Step-Type Timeouts

**Design specifies 5 separate timeout fields:**
| Step Type | Default |
|-----------|---------|
| Clarification | 60s |
| Refinement | 30s |
| File Discovery | 120s |
| Planning | 180s |
| Implementation | 300s |

**Current:** Single `workflow.stepTimeoutSeconds` field (300s default).

### 6.2 Advanced Settings Category Unused

Schema defines `"advanced"` category but no settings use it and no UI section exists.

---

## 7. Navigation & Shell Issues

### 7.1 Projects Page Addition

The sidebar includes a "Projects" navigation item that's **not in the design document**. This appears intentional as a reasonable addition for multi-project management.

**Routes added beyond design:**

- `/projects` - Projects listing
- `/projects/[id]` - Project detail

### 7.2 Status Bar activeWorkflowCount Not Wired

(Same as Dashboard issue 1.2)

The `StatusBar` component receives `activeWorkflowCount` prop but `layout.tsx` doesn't pass it.

### 7.3 Mobile Responsiveness Partial

**Implemented:**

- Sidebar collapses to 64px
- CSS variables scale for mobile
- Responsive tooltips when collapsed

**Missing:**

- No mobile drawer/overlay behavior
- Sidebar doesn't auto-collapse on mobile
- No explicit mobile breakpoint handling
- Fixed widths may cause issues on small screens

---

## 8. Database Schema Status

### 8.1 All Tables Implemented

All 17 tables from design document are fully implemented:

| #   | Table                          | Status |
| --- | ------------------------------ | ------ |
| 1   | projects                       | ✓      |
| 2   | repositories                   | ✓      |
| 3   | workflow_repositories          | ✓      |
| 4   | worktrees                      | ✓      |
| 5   | workflows                      | ✓      |
| 6   | workflow_steps                 | ✓      |
| 7   | discovered_files               | ✓      |
| 8   | agents                         | ✓      |
| 9   | agent_tools                    | ✓      |
| 10  | agent_skills                   | ✓      |
| 11  | templates                      | ✓      |
| 12  | template_placeholders          | ✓      |
| 13  | implementation_plans           | ✓      |
| 14  | implementation_plan_steps      | ✓      |
| 15  | implementation_plan_step_files | ✓      |
| 16  | audit_logs                     | ✓      |
| 17  | settings                       | ✓      |

### 8.2 All Repositories Implemented

All 11 primary repositories are implemented with full CRUD operations.

### 8.3 All Indexes Present

Comprehensive indexing on all foreign keys, filter columns, and composite queries.

---

## 9. IPC Handler Issues

### 9.1 Critical Type Mismatch: step:complete

**Preload API:**

```typescript
complete(id: number, output?: string): Promise<undefined | WorkflowStep>;
```

**Handler:**

```typescript
complete(id: number, outputText: string, durationMs: number): ...
```

**Problem:** Handler expects `durationMs` parameter that preload doesn't expose.

**Impact:** Runtime errors or silent failures when completing steps.

### 9.2 Inconsistent Error Handling

| Handler Module        | Error Handling            |
| --------------------- | ------------------------- |
| fs.handlers           | ✓ Comprehensive try-catch |
| store.handlers        | ⚠️ Silent failures        |
| All database handlers | ❌ No error handling      |

**Impact:** Repository errors propagate to renderer unhandled.

### 9.3 Duplicate Channel Definitions

`IpcChannels` constant defined in both:

- `electron/preload.ts` (inline)
- `electron/ipc/channels.ts` (exported)

While identical, this creates maintenance burden.

---

## 10. Priority Action Items

### Critical (Must Fix)

1. **Fix step:complete type mismatch** - Runtime errors
2. **Wire Status Bar activeWorkflowCount** - Core feature broken
3. **Implement built-in agent seeding** - Empty agents list on first run
4. **Implement built-in template seeding** - Empty templates list on first run

### High Priority

5. **Add Edit Repository Dialog** - Can't fix repository mistakes
6. **Add delete confirmation dialogs** - Data loss risk
7. **Add per-step-type timeout settings** - Design requirement
8. **Auto-start workflow after creation** - UX issue
9. **Add repository selection to workflow creation** - Design requirement

### Medium Priority

10. **Add tool permissions UI to agent editor** - Schema exists, UI missing
11. **Add skills management UI to agent editor** - Schema exists, UI missing
12. **Add color tag editor to agent editor** - Schema exists, UI missing
13. **Add branch name to dashboard workflow cards** - Missing information
14. **Add action buttons to dashboard workflow cards** - Missing interactivity
15. **Add duration column to recent workflows** - Missing information
16. **Add skip clarification toggle** - Design requirement
17. **Add workflow delete/archive functionality** - Missing CRUD operation

### Low Priority

18. **Add mobile drawer for sidebar** - Responsive enhancement
19. **Add error handling to database IPC handlers** - Robustness
20. **Consolidate IpcChannels definitions** - Code maintenance
21. **Add "advanced" settings section** - Schema defined but unused

---

## 11. Files Summary

### Files Needing New Components

| New Component        | Location               | Purpose                        |
| -------------------- | ---------------------- | ------------------------------ |
| EditRepositoryDialog | `components/projects/` | Edit repository after creation |
| ConfirmDeleteDialog  | `components/ui/`       | Generic delete confirmation    |
| AgentToolsEditor     | `components/agents/`   | Manage agent tool permissions  |
| AgentSkillsEditor    | `components/agents/`   | Manage agent skills            |
| AgentColorPicker     | `components/agents/`   | Select agent color tag         |

### Files Needing Modifications

| File                                                          | Changes Needed                                      |
| ------------------------------------------------------------- | --------------------------------------------------- |
| `app/(app)/layout.tsx`                                        | Pass activeWorkflowCount to StatusBar               |
| `electron/ipc/step.handlers.ts`                               | Fix complete handler signature                      |
| `electron/preload.ts`                                         | Update step.complete signature                      |
| `components/agents/agent-editor-dialog.tsx`                   | Add tool/skill/color editors                        |
| `app/(app)/settings/page.tsx`                                 | Add per-step-type timeout fields                    |
| `components/settings/workflow-settings-section.tsx`           | Add individual timeout fields                       |
| `components/projects/repository-card.tsx`                     | Add edit button                                     |
| `app/(app)/dashboard/_components/active-workflows-widget.tsx` | Add branch name and action buttons                  |
| `app/(app)/dashboard/_components/recent-workflows-widget.tsx` | Add duration column                                 |
| `components/workflows/new-workflow-form.tsx`                  | Add repository selection, skip clarification toggle |

### Files Needing Creation (Seeding)

| File                        | Purpose                           |
| --------------------------- | --------------------------------- |
| `db/seed/agents.seed.ts`    | Seed 11 built-in agents           |
| `db/seed/templates.seed.ts` | Seed 7 built-in templates         |
| `db/seed/settings.seed.ts`  | Seed default settings (may exist) |
| `db/seed/index.ts`          | Orchestrate seeding on first run  |

---

## Appendix: Design Document Compliance Checklist

### Section 4.2 Dashboard View

- [x] Active Workflows section
- [x] Recent Workflows section
- [ ] Branch name on implementation workflows
- [ ] Action buttons (View/Pause/Resume/Cancel)
- [ ] Duration in recent workflows table
- [x] "New Workflow" button (in different location)

### Section 4.6 Agent Editor

- [x] Name field
- [x] Description field
- [ ] Color tag selection
- [ ] Allowed tools list with patterns
- [x] System prompt field
- [ ] Referenced skills section
- [x] Reset to default button

### Section 4.7 Settings Panel

- [x] Default pause behavior
- [ ] Individual step timeouts (5 types)
- [x] Worktree location
- [x] Auto-cleanup toggle
- [x] Create feature branch toggle
- [x] Push on completion toggle
- [x] Log retention days
- [x] Export logs toggle
- [x] Include CLI output toggle
- [x] Log export location

### Section 5.6 Template Library

- [x] Template listing
- [x] Create template
- [x] Edit template
- [x] Template placeholders
- [ ] Built-in templates seeded

### Section 8.1 Agent Bundling

- [ ] Built-in agents seeded on first launch

---

_Report generated by comprehensive codebase review against design document._

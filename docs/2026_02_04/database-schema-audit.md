# Database Schema Audit Report

**Date**: 2026-02-04
**Auditor**: Claude Sonnet 4.5
**Scope**: Complete database schema analysis for unused tables and columns

## Executive Summary

This audit identifies **2 completely unused tables**, **6 unused columns**, and several **partially-implemented fields** across the database schema. The findings suggest incomplete implementation of the "implementation plans" feature and several workflow tracking fields that were designed but never fully integrated.

---

## 1. Inventory

### Tables Overview (18 tables)

| Table | Columns | Has Repository | Status |
|-------|---------|---------------|--------|
| `agents` | 19 | ✅ Yes | Active |
| `agent_skills` | 7 | ✅ Yes | Active |
| `agent_tools` | 8 | ✅ Yes | Active |
| `agent_hooks` | 8 | ✅ Yes | Active |
| `projects` | 7 | ✅ Yes | Active |
| `repositories` | 9 | ✅ Yes | Active |
| `worktrees` | 8 | ✅ Yes | Active |
| `workflows` | 19 | ✅ Yes | Active |
| `workflow_steps` | 20 | ✅ Yes | Active |
| `workflow_repositories` | 5 | ✅ Yes | Active |
| `templates` | 9 | ✅ Yes | Active |
| `template_placeholders` | 11 | ✅ Yes | Active |
| `discovered_files` | 17 | ✅ Yes | Active |
| `implementation_plans` | 8 | ✅ Yes | Active |
| **`implementation_plan_steps`** | **12** | **❌ No** | **UNUSED** |
| **`implementation_plan_step_files`** | **8** | **❌ No** | **UNUSED** |
| `audit_logs` | 13 | ✅ Yes | Active |
| `settings` | 11 | ✅ Yes | Active |

### Complete Column Inventory

<details>
<summary>Click to expand full column list (172 total columns)</summary>

#### agents (19 columns)
- id, name, displayName, type, description, color, model, systemPrompt, permissionMode, extendedThinkingEnabled, maxThinkingTokens, parentAgentId, projectId, builtInAt, deactivatedAt, version, createdAt, updatedAt

#### agent_skills (7 columns)
- id, agentId, skillName, orderIndex, requiredAt, createdAt, updatedAt

#### agent_tools (8 columns)
- id, agentId, toolName, toolPattern, orderIndex, disallowedAt, createdAt, updatedAt

#### agent_hooks (8 columns)
- id, agentId, eventType, matcher, body, orderIndex, createdAt, updatedAt

#### projects (7 columns)
- id, name, description, isFavorite, archivedAt, createdAt, updatedAt

#### repositories (9 columns)
- id, projectId, name, path, defaultBranch, remoteUrl, setAsDefaultAt, createdAt, updatedAt

#### worktrees (8 columns)
- id, repositoryId, workflowId, path, branchName, status, createdAt, updatedAt

#### workflows (19 columns)
- id, projectId, type, status, featureName, featureRequest, **parentWorkflowId**, clarificationAgentId, worktreeId, pauseBehavior, skipClarification, currentStepNumber, totalSteps, startedAt, completedAt, durationMs, errorMessage, createdAt, updatedAt

#### workflow_steps (20 columns)
- id, workflowId, stepNumber, stepType, title, description, status, agentId, **inputText**, outputText, **originalOutputText**, outputEditedAt, outputStructured, **cliOutput**, **cliExitCode**, retryCount, startedAt, completedAt, durationMs, errorMessage, createdAt, updatedAt

#### workflow_repositories (5 columns)
- id, workflowId, repositoryId, setPrimaryAt, createdAt

#### templates (9 columns)
- id, name, category, description, templateText, usageCount, builtInAt, deactivatedAt, createdAt, updatedAt

#### template_placeholders (11 columns)
- id, templateId, name, displayName, description, defaultValue, validationPattern, requiredAt, orderIndex, createdAt, updatedAt

#### discovered_files (17 columns)
- id, workflowStepId, filePath, action, priority, originalPriority, description, role, relevanceExplanation, orderIndex, **fileExistsAt**, includedAt, userAddedAt, userModifiedAt, createdAt, updatedAt

#### implementation_plans (8 columns)
- id, workflowId, title, summary, rawPlanText, estimatedDurationMs, approvedAt, createdAt, updatedAt

#### **implementation_plan_steps (12 columns) - UNUSED TABLE**
- id, planId, stepNumber, title, description, agentId, **agentOverrideId**, orderIndex, estimatedDurationMs, **qualityGateAt**, **geminiReviewAt**, createdAt, updatedAt

#### **implementation_plan_step_files (8 columns) - UNUSED TABLE**
- id, planStepId, filePath, action, description, orderIndex, createdAt, updatedAt

#### audit_logs (13 columns)
- id, workflowId, workflowStepId, eventCategory, eventType, severity, source, message, eventData, beforeState, afterState, timestamp

#### settings (11 columns)
- id, key, category, displayName, description, value, defaultValue, valueType, userModifiedAt, createdAt, updatedAt

</details>

---

## 2. Usage Map

### Complete Unused Tables

#### `implementation_plan_steps`
- **Schema Definition**: `db/schema/implementation-plan-steps.schema.ts`
- **Type Exports**: `db/schema/index.ts`
- **Repository**: ❌ NONE
- **IPC Handlers**: ❌ NONE
- **Services**: ❌ NONE
- **Components**: ❌ NONE
- **Hooks**: ❌ NONE
- **References**: Only in schema definition and index export

#### `implementation_plan_step_files`
- **Schema Definition**: `db/schema/implementation-plan-step-files.schema.ts`
- **Type Exports**: `db/schema/index.ts`
- **Repository**: ❌ NONE
- **IPC Handlers**: ❌ NONE
- **Services**: ❌ NONE
- **Components**: ❌ NONE
- **Hooks**: ❌ NONE
- **References**: Only in schema definition and index export

### Unused Columns (Present in Schema Only)

| Column | Table | Status | References |
|--------|-------|--------|------------|
| `parentWorkflowId` | workflows | **Write-only** | Schema only, never queried |
| `cliOutput` | workflow_steps | **Unused** | Schema only |
| `cliExitCode` | workflow_steps | **Unused** | Schema only |
| `originalOutputText` | workflow_steps | **Unused** | Schema only |
| `inputText` | workflow_steps | **Read-only (UI)** | Schema + 1 component (pipeline-view.tsx) |
| `fileExistsAt` | discovered_files | **Unused** | Schema only |

### Partially Implemented Columns

| Column | Table | Write Locations | Read Locations | Notes |
|--------|-------|----------------|---------------|-------|
| `agentOverrideId` | implementation_plan_steps | ❌ None (table unused) | ❌ None | Part of unused table |
| `qualityGateAt` | implementation_plan_steps | ❌ None (table unused) | ❌ None | Part of unused table |
| `geminiReviewAt` | implementation_plan_steps | ❌ None (table unused) | ❌ None | Part of unused table |
| `estimatedDurationMs` | implementation_plans | ❌ None | ❌ None | Schema only, docs don't count |
| `estimatedDurationMs` | implementation_plan_steps | ❌ None (table unused) | ❌ None | Part of unused table |
| `validationPattern` | template_placeholders | ✅ Repository + Seed | ✅ Components | **Active** |
| `originalPriority` | discovered_files | ✅ Service + Repository | ✅ Repository (upsert) | **Active** |
| `userAddedAt` | discovered_files | ✅ Repository | ❌ None | Timestamp tracked but never displayed |
| `userModifiedAt` | discovered_files | ✅ Repository | ❌ None | Timestamp tracked but never displayed |
| `userModifiedAt` | settings | ✅ Repository | ❌ None | Timestamp tracked but never displayed |
| `outputEditedAt` | workflow_steps | ✅ Repository | ❌ None | Timestamp tracked but never displayed |
| `outputStructured` | workflow_steps | ✅ Services (clarification/refinement) | ✅ Components + Validations | **Active** |

---

## 3. Findings

### Critical: Complete Dead Tables (Never Used)

#### **implementation_plan_steps** (12 columns)
**Reason**: Table has schema definition but no repository, no IPC handlers, no service layer.
**Evidence**:
- ❌ No repository in `db/repositories/`
- ❌ Not exported in `db/repositories/index.ts`
- ❌ No IPC handlers
- ❌ Type definition exists but never consumed
- ✅ Foreign key references `implementation_plans.id` (which IS used)

**Analysis**: This appears to be an abandoned design for breaking down implementation plans into granular steps with agent assignments, quality gates, and review checkpoints. The parent table `implementation_plans` exists and is used, but the child relationship was never implemented.

#### **implementation_plan_step_files** (8 columns)
**Reason**: Table has schema definition but no repository, no IPC handlers, no service layer.
**Evidence**:
- ❌ No repository in `db/repositories/`
- ❌ Not exported in `db/repositories/index.ts`
- ❌ No IPC handlers
- ❌ Type definition exists but never consumed
- ✅ Foreign key references `implementation_plan_steps.id` (which is also unused)

**Analysis**: This table was designed to track which files are associated with each implementation plan step. Since the parent table (`implementation_plan_steps`) is unused, this table is also dead.

### High Priority: Unused Columns (Never Read or Written)

#### workflows.parentWorkflowId
- **Type**: `integer` (FK to workflows.id)
- **Purpose**: Likely intended for parent-child workflow relationships or workflow versioning
- **Evidence**:
  - Defined in schema with self-referential FK
  - Indexed for performance (parent_workflow_id_idx)
  - Never written to in any repository/service
  - Never queried in any repository/service
- **Impact**: Low (nullable column, no functionality depends on it)

#### workflow_steps.cliOutput
- **Type**: `text`
- **Purpose**: Appears designed to store CLI command output
- **Evidence**: Schema definition only, never referenced elsewhere
- **Impact**: Low (nullable column)

#### workflow_steps.cliExitCode
- **Type**: `integer`
- **Purpose**: Appears designed to store CLI command exit codes
- **Evidence**: Schema definition only, never referenced elsewhere
- **Impact**: Low (nullable column)

#### workflow_steps.originalOutputText
- **Type**: `text`
- **Purpose**: Likely intended to preserve original AI output before user edits
- **Evidence**: Schema definition only, never written or read
- **Note**: Related column `outputEditedAt` IS used in repository
- **Impact**: Medium (editing functionality exists but doesn't preserve original)

#### discovered_files.fileExistsAt
- **Type**: `text` (timestamp)
- **Purpose**: Likely intended to track when file existence was verified
- **Evidence**: Schema definition only, never written or read
- **Impact**: Low (nullable column)

### Medium Priority: Write-Only Timestamp Columns (Never Read)

These columns are written by repositories but never queried or displayed:

#### discovered_files.userAddedAt
- **Written**: `db/repositories/discovered-files.repository.ts:129-138` (markUserAdded method)
- **Read**: ❌ Never queried
- **UI**: ❌ Never displayed
- **Impact**: Low (but wastes storage)

#### discovered_files.userModifiedAt
- **Written**: `db/repositories/discovered-files.repository.ts:141-151` (markUserModified method)
- **Read**: ❌ Never queried
- **UI**: ❌ Never displayed
- **Impact**: Low (but wastes storage)

#### settings.userModifiedAt
- **Written**: `db/repositories/settings.repository.ts:98,112,142,162`
- **Read**: ❌ Never queried
- **UI**: ❌ Never displayed
- **Impact**: Low (metadata column)

#### workflow_steps.outputEditedAt
- **Written**: `db/repositories/workflow-steps.repository.ts:184` (markEdited method)
- **Read**: ❌ Never queried
- **UI**: ❌ Never displayed
- **Impact**: Low (tracks editing but timestamp not used)

### Low Priority: Read-Only UI Columns (Never Written)

#### workflow_steps.inputText
- **Written**: ❌ Never set by any service/repository
- **Read**: `components/workflows/pipeline-view.tsx` (displays in UI)
- **Status**: Appears in UI as empty/undefined
- **Impact**: Medium (UI references undefined data)

### Ambiguous: Fields with Indirect Usage

These columns have repository methods but usage is indirect or inferred:

#### workflows.clarificationAgentId
- **Written**: Via workflow creation/update
- **Read**: Repository queries exist
- **Usage**: Referenced in workflow services but actual usage is through JOIN-like patterns
- **Status**: **Likely Active** but needs domain expert confirmation

---

## 4. Removal Candidates (Ranked by Confidence)

### Tier 1: Safe to Remove Immediately (100% Confidence)

#### 1. **Drop `implementation_plan_steps` table** ⭐ HIGHEST PRIORITY
- **Reason**: Complete table with no repository, no IPC, no service, no UI
- **Confidence**: 100%
- **Impact**: None (never used)
- **Cascade**: Would require dropping `implementation_plan_step_files` first (FK constraint)
- **Migration**:
  ```sql
  DROP TABLE implementation_plan_step_files;
  DROP TABLE implementation_plan_steps;
  ```

#### 2. **Drop `implementation_plan_step_files` table** ⭐ HIGHEST PRIORITY
- **Reason**: Complete table with no repository, no IPC, no service, no UI
- **Confidence**: 100%
- **Impact**: None (never used)
- **Cascade**: None (leaf table)
- **Migration**:
  ```sql
  DROP TABLE implementation_plan_step_files;
  ```

### Tier 2: Safe to Remove (95% Confidence)

#### 3. **Drop `workflows.parentWorkflowId`**
- **Reason**: Never written, never read, feature not implemented
- **Confidence**: 95%
- **Impact**: None (nullable, no data dependencies)
- **Migration**:
  ```sql
  ALTER TABLE workflows DROP COLUMN parent_workflow_id;
  DROP INDEX workflows_parent_workflow_id_idx;
  ```

#### 4. **Drop `workflow_steps.cliOutput`**
- **Reason**: Schema only, never referenced
- **Confidence**: 95%
- **Impact**: None
- **Migration**:
  ```sql
  ALTER TABLE workflow_steps DROP COLUMN cli_output;
  ```

#### 5. **Drop `workflow_steps.cliExitCode`**
- **Reason**: Schema only, never referenced
- **Confidence**: 95%
- **Impact**: None
- **Migration**:
  ```sql
  ALTER TABLE workflow_steps DROP COLUMN cli_exit_code;
  ```

#### 6. **Drop `discovered_files.fileExistsAt`**
- **Reason**: Schema only, never referenced
- **Confidence**: 95%
- **Impact**: None
- **Migration**:
  ```sql
  ALTER TABLE discovered_files DROP COLUMN file_exists_at;
  ```

### Tier 3: Consider Removal (75% Confidence)

#### 7. **Drop `workflow_steps.originalOutputText`**
- **Reason**: Never written or read, but related field `outputEditedAt` suggests incomplete edit tracking
- **Confidence**: 75% (might be planned feature)
- **Impact**: Low
- **Question**: Was output versioning/history intended?
- **Migration**:
  ```sql
  ALTER TABLE workflow_steps DROP COLUMN original_output_text;
  ```

#### 8. **Drop `discovered_files.userAddedAt`**
- **Reason**: Written but never read/displayed
- **Confidence**: 75% (might be future audit requirement)
- **Impact**: Low (loses audit trail)
- **Migration**:
  ```sql
  ALTER TABLE discovered_files DROP COLUMN user_added_at;
  ```

#### 9. **Drop `discovered_files.userModifiedAt`**
- **Reason**: Written but never read/displayed
- **Confidence**: 75% (might be future audit requirement)
- **Impact**: Low (loses audit trail)
- **Migration**:
  ```sql
  ALTER TABLE discovered_files DROP COLUMN user_modified_at;
  ```

### Tier 4: Investigation Required (50% Confidence)

#### 10. **Investigate `workflow_steps.inputText`**
- **Reason**: Never written but displayed in UI (shows undefined)
- **Confidence**: 50% (might be WIP feature)
- **Impact**: Medium (UI expects this field)
- **Action**: Either implement writing to this field OR remove from UI
- **Don't Remove Yet**: Need to understand intended design

#### 11. **Investigate `settings.userModifiedAt`**
- **Reason**: Written but never read, but settings management often needs audit trails
- **Confidence**: 50% (common metadata pattern)
- **Impact**: Low
- **Action**: Confirm if settings history/audit is needed

#### 12. **Investigate `workflow_steps.outputEditedAt`**
- **Reason**: Written when output is edited but timestamp never displayed
- **Confidence**: 50% (related to missing originalOutputText)
- **Impact**: Low
- **Action**: Decide if edit versioning is needed

---

## 5. Follow-Up Questions for Domain Experts

### Implementation Plans Architecture
1. **Q**: Was there a plan to break down `implementation_plans` into granular steps with the `implementation_plan_steps` table?
   **Why**: The table exists but is completely unimplemented. Should we remove it or implement it?

2. **Q**: What was the intended purpose of `implementation_plan_steps.agentOverrideId`?
   **Why**: Suggests agent assignment per step. Is this needed for the roadmap?

3. **Q**: What were `qualityGateAt` and `geminiReviewAt` meant to track?
   **Why**: Suggests approval gates and AI review processes that were never built.

### Workflow Relationships
4. **Q**: Was `workflows.parentWorkflowId` intended for workflow versioning or parent-child relationships?
   **Why**: Column exists with FK but is never used. Removal candidate.

5. **Q**: Should workflows support parent-child relationships (e.g., sub-workflows, retries)?
   **Why**: If yes, implement; if no, remove column.

### CLI Integration
6. **Q**: Were workflow steps ever intended to execute CLI commands?
   **Why**: `cliOutput` and `cliExitCode` columns exist but are unused. Were they planned for a feature?

### Edit History & Versioning
7. **Q**: Should the system preserve original AI outputs before user edits?
   **Why**: `originalOutputText` column exists but is never populated. `outputEditedAt` IS tracked, suggesting edit history was considered.

8. **Q**: Do we need audit trails for when users add/modify discovered files?
   **Why**: `userAddedAt` and `userModifiedAt` are tracked but never displayed or queried.

### File Discovery
9. **Q**: Was file existence verification (`fileExistsAt`) intended as a feature?
   **Why**: Column exists but is never set. If needed, implement; otherwise remove.

10. **Q**: What should `workflow_steps.inputText` contain?
    **Why**: UI displays it but nothing writes to it. Either implement or remove from UI.

### Settings Management
11. **Q**: Is there a requirement to track when users modify settings vs. system defaults?
    **Why**: `userModifiedAt` is tracked but never queried or displayed.

---

## 6. Recommended Action Plan

### Phase 1: Immediate Cleanup (No Risk)
1. ✅ Drop `implementation_plan_step_files` table
2. ✅ Drop `implementation_plan_steps` table
3. ✅ Drop `workflows.parentWorkflowId` column
4. ✅ Drop `workflow_steps.cliOutput` column
5. ✅ Drop `workflow_steps.cliExitCode` column
6. ✅ Drop `discovered_files.fileExistsAt` column

**Expected Impact**: Remove 2 unused tables (20 total columns) + 4 unused columns from active tables
**Data Loss**: None (columns never populated)
**Regression Risk**: None (features never implemented)

### Phase 2: Investigate & Decide
1. ❓ Determine fate of `workflow_steps.originalOutputText`
   - Option A: Implement output versioning (write original before edits)
   - Option B: Remove column and keep only current output

2. ❓ Determine fate of `workflow_steps.inputText`
   - Option A: Implement writing input text from services
   - Option B: Remove from UI component

3. ❓ Determine fate of timestamp columns (userAddedAt, userModifiedAt, outputEditedAt)
   - Option A: Keep for future audit features
   - Option B: Remove if audit requirements don't exist

### Phase 3: Update Documentation
1. Document removed columns in changelog
2. Update schema diagrams
3. Update any external API documentation

---

## Summary Statistics

- **Total Tables**: 18
- **Unused Tables**: 2 (11%)
- **Tables with Repositories**: 16 (89%)
- **Total Columns Across All Tables**: 172
- **Completely Unused Columns**: 6
- **Write-Only Columns (Never Read)**: 4
- **Read-Only Columns (Never Written)**: 1
- **Removal Candidates**: 12 columns + 2 tables (20 total columns)
- **Potential Storage Savings**: ~12% of schema complexity

---

**End of Audit Report**

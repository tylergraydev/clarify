# Technical Debt and Code Quality Audit

**Date**: 2026-02-04
**Status**: Initial Assessment
**Agent ID**: afe6e1e

## Executive Summary

Comprehensive audit identified **~2,500+ lines of duplicate/dead code** across the codebase. Core architecture is solid with strong type safety and good separation of concerns. Technical debt is concentrated in specific areas: confirmation dialogs, service file duplication, dead database columns, and monolithic components.

---

## Technical Debt and Problem Areas

### 1. CODE DUPLICATION

#### **CRITICAL - Confirmation Dialog Pattern** (15+ files)
Nearly identical confirmation dialogs exist across multiple domains:
- `components/agents/confirm-delete-agent-dialog.tsx` (88 lines)
- `components/templates/confirm-delete-template-dialog.tsx` (88 lines)
- `components/projects/confirm-delete-project-dialog.tsx` (91 lines)
- `components/repositories/confirm-delete-repository-dialog.tsx`
- `components/workflows/confirm-cancel-workflow-dialog.tsx`
- `components/workflows/confirm-start-workflow-dialog.tsx`
- `components/agents/confirm-reset-agent-dialog.tsx`
- `components/agents/confirm-discard-dialog.tsx`

**Issue**: All these dialogs share 95%+ identical code. Only differences are entity name and warning text.

**Impact**: ~800+ lines of duplicate code, difficult to maintain consistency in UX.

#### **HIGH - Service File Duplication** (3 massive files)
The three step services share extensive duplicate logic:
- `electron/services/clarification-step.service.ts` (1,666 lines)
- `electron/services/refinement-step.service.ts` (1,405 lines)
- `electron/services/file-discovery.service.ts` (1,820 lines)

**Duplicated patterns**:
- Identical SDK query function caching
- Same timeout constants and retry logic (lines 59-72 in all three)
- Identical extended thinking heartbeat logic
- Same pause/retry information structure
- Duplicate audit logging patterns
- Identical agent configuration loading

**Impact**: ~1,500+ lines of duplicate logic, same bugs need to be fixed in 3 places.

#### **HIGH - Repository CRUD Pattern** (17 repositories)
Every repository in `db/repositories/` has near-identical implementations:
- `findById()`, `findAll()`, `create()`, `update()`, `delete()`
- `activate()` / `deactivate()` pattern (agents, templates)
- Same filter building logic
- Identical timestamp update patterns

**Examples**:
- `agents.repository.ts` lines 35-58 vs `templates.repository.ts` lines 25-56
- Both have identical `activate()`/`deactivate()` methods

**Impact**: ~500+ lines of duplicate CRUD logic.

#### **MEDIUM - Table Components** (8 tables)
Similar table implementations with duplicate column definitions and toolbar logic:
- `components/agents/agent-table.tsx` (771 lines)
- `components/templates/template-table.tsx` (524 lines)
- `components/projects/project-table.tsx` (513 lines)

**Duplicated**:
- Column visibility management
- Row selection logic
- Pagination state
- Filtering state management

---

### 2. DEAD CODE / UNUSED FIELDS

#### **CRITICAL - Unused Database Columns**
Several database fields are defined but never used:

**`fileExistsAt` in discovered_files table**:
- Defined: `db/schema/discovered-files.schema.ts:17`
- **ONLY found in schema file** - never queried or updated anywhere in codebase

**`originalPriority` in discovered_files table**:
- Defined: `db/schema/discovered-files.schema.ts:22`
- Used in: Only 3 files (schema, repository, file-discovery.service.ts)
- **Never actually queried or displayed** in UI

**`estimatedDurationMs` in implementation_plans table**:
- Defined: `db/schema/implementation-plans.schema.ts:13`
- Used in: Only 2 schema files
- **Never populated or used** - always null

**Impact**: Wasted database columns, confusing schema design, potential for bugs if developers think these are functional.

#### **HIGH - Duplicate IPC Channel Definitions**
`electron/preload.ts` contains a complete duplicate of `electron/ipc/channels.ts`:
- Lines 36-43: Comment explicitly states "This is a duplicate..."
- Requires manual synchronization between files
- **1,847 total lines** in preload.ts, hundreds are channel duplicates

**Impact**: Maintenance burden, risk of desync, easy to forget updating both.

---

### 3. ARCHITECTURAL INCONSISTENCIES

#### **HIGH - Mixed Async/Sync Repository Patterns**
Repositories inconsistently use async vs sync:

**Agents repository** (async):
```typescript
async activate(id: number): Promise<Agent | undefined>
async create(data: NewAgent): Promise<Agent>
```

**Templates repository** (sync):
```typescript
activate(id: number): Template | undefined
create(data: NewTemplate): Template
```

**Location**: Compare `db/repositories/agents.repository.ts` vs `db/repositories/templates.repository.ts`

**Impact**: Confusing API, requires different calling patterns, prone to errors.

#### **MEDIUM - Inconsistent Error Handling in IPC Handlers**
Some handlers have try-catch (agent.handlers.ts lines 164-191), others don't (template.handlers.ts lines 42-49).

Some log errors with `console.error`, some throw directly.

**Impact**: Inconsistent error messages, harder to debug.

#### **MEDIUM - Mixed State Management Patterns**
State is managed in 3 different ways:
1. React Query for server state
2. Zustand for client state (8 stores in lib/stores/)
3. URL state with nuqs
4. Component state with useState in many places

**Example**: Pipeline state managed in zustand (`lib/stores/pipeline-store.ts`) but refinement state in zustand too (`lib/stores/refinement-store.ts`), while clarification uses component state.

---

### 4. DATABASE ISSUES

#### **HIGH - Schema Fields Added But Incomplete**
Several partially implemented features:

**Extended Thinking Fields** (`maxThinkingTokens`, `extendedThinkingEnabled` in agents table):
- Defined in schema (agents.schema.ts:24,26)
- Used in 22 files
- **But**: No UI controls to set these values in agent editor
- **But**: No documentation on what values to use

**Clarification Agent Resolution**:
- Field `clarificationAgentId` in workflows table (workflows.schema.ts:24)
- Complex fallback logic in `workflow.handlers.ts:76-104`
- **But**: No UI to select clarification agent when creating workflow

**Impact**: Half-implemented features confuse developers, unclear how to use them.

#### **MEDIUM - Missing Indexes**
Some frequently queried combinations lack indexes:
- `discovered_files` queried by `workflow_step_id` + `includedAt` (for filtering included files) - has index on workflow_step_id but not composite
- `workflows` queried by `project_id` + `status` + `type` - has composite for `status + type + created` but not `project_id + status`

---

### 5. INCOMPLETE FEATURES

#### **MEDIUM - Disabled Tools in Services**
All three agent services have TODO comments about hooks:

```typescript
// TODO: Hooks are loaded for future extensibility but not yet passed to SDK options.
```

**Locations**:
- `clarification-step.service.ts:300`
- `refinement-step.service.ts:296`
- `file-discovery.service.ts` (similar pattern)

Then later:
```typescript
'TodoWrite', // Disallowed tool
```

**Impact**: Confusing - are hooks supported or not? Why load them if not used?

---

### 6. SERVICE/REPOSITORY ISSUES

#### **CRITICAL - Monolithic Service Files**
Three services are extremely large and handle too much:

**`file-discovery.service.ts`** (1,820 lines):
- Handles streaming
- Handles file discovery logic
- Handles outcome parsing
- Handles error recovery
- Handles state management
- Handles database updates
- Should be split into: StreamHandler, OutcomeParser, FileDiscoveryOrchestrator

**`clarification-step.service.ts`** (1,666 lines):
- Similar god-object pattern
- Mixes infrastructure (SDK calls) with business logic (question parsing)

**Impact**: Very hard to test, hard to understand, high coupling.

#### **HIGH - Repository Pattern Not Followed Consistently**
Some business logic leaked into handlers instead of repositories:

**Example**: `workflow.handlers.ts:76-104` has complex clarification agent resolution logic
- Should be in `workflows.repository.ts` as `resolveClarificationAgent()`
- Makes handler hard to test

**Impact**: Business logic scattered, hard to maintain, hard to unit test.

---

### 7. COMPONENT ORGANIZATION

#### **MEDIUM - Inconsistent Component File Naming**
Some use plural folders, some singular:
- `components/agents/` (plural) contains individual agent components
- `components/projects/` (plural)
- `components/workflows/` (plural)
- BUT: `components/shell/` (singular)
- BUT: `components/data/` (singular)
- BUT: `components/settings/` (plural but only contains sections, not Settings)

**Impact**: Unclear where to put new components, inconsistent organization.

#### **MEDIUM - Mixed Index Export Patterns**
Some folders have `index.ts` for barrel exports, others don't:
- `components/projects/index.ts` - ✓ has barrel export
- `components/agents/` - ✗ no index.ts
- `components/templates/` - ✗ no index.ts
- `components/repositories/index.ts` - ✓ has barrel export

**Impact**: Inconsistent import paths, some use barrel exports, others don't.

---

### 8. IPC HANDLER ISSUES

#### **HIGH - Duplicate Agent Copying Logic**
In `agent.handlers.ts`, nearly identical code blocks:

**Lines 220-300**: `duplicate` handler - copies agent, tools, skills, hooks
**Lines 589-687**: `copyToProject` handler - nearly identical copy logic with minor differences

Only real difference is target projectId handling. Could share 80% of code.

**Impact**: ~160 lines of duplicate copying logic.

#### **MEDIUM - Inconsistent Validation Patterns**
Some handlers validate input thoroughly (agent.handlers.ts:164-186), others trust input (template.handlers.ts:75-82).

Some check for null/undefined, others assume data is valid.

---

### 9. TYPE SAFETY ISSUES

#### **LOW - Limited `any` Usage**
Only 39 files use `any` type, mostly:
- In eslint cache (expected)
- In skill documentation (expected)
- In a few components for third-party library compatibility

**Good news**: Type safety is generally strong. Low severity issue.

#### **MEDIUM - Type Duplication**
Filter interfaces duplicated between:
- IPC handler files (e.g., `agent.handlers.ts:97-127`)
- Repository files (e.g., `agents.repository.ts:8-14`)
- Sometimes slightly different definitions

**Example**: `AgentListFilters` defined in both places with slightly different fields.

**Impact**: Risk of type mismatches, have to keep in sync manually.

---

### 10. COMPLEX/MESSY FILES

#### **CRITICAL - `pipeline-view.tsx`** (1,659 lines)
Massive component with:
- 46 instances of hooks (useState, useCallback, useMemo, useEffect)
- Multiple state machines inline
- Handles clarification, refinement, and discovery
- Manages streaming, outcomes, errors
- Should be split into separate components per step type

**Impact**: Nearly impossible to understand or modify safely, very high bug risk.

#### **HIGH - `electron/preload.ts`** (1,847 lines)
Extremely large preload file:
- 51 exports
- Duplicates entire channel definition
- Wraps every IPC handler
- Should be code-generated or at least split

**Impact**: Brittle, easy to make mistakes, manual synchronization required.

#### **HIGH - `agent-editor-dialog.tsx`** (1,156 lines)
Another god component:
- Handles all agent editing
- Tools, skills, hooks management
- Validation
- Import/export
- Should be split into tabs/sections as separate components

#### **MEDIUM - Large Hook Files**
- `use-electron.ts` (718 lines) - wraps entire electron API
- `use-agents.ts` (692 lines) - all agent query hooks
- `use-discovered-files.ts` (512 lines)

These could be split by domain (e.g., separate hooks for CRUD vs queries).

---

## SEVERITY SUMMARY

### CRITICAL (Fix First)
1. Confirmation dialog duplication (15+ files, ~800 lines)
2. Service file duplication (~1,500 duplicate lines)
3. Unused database columns (fileExistsAt, estimatedDurationMs)
4. Monolithic service files (1,800+ lines each)
5. Monolithic pipeline-view component (1,659 lines)

### HIGH (Fix Soon)
1. Repository CRUD pattern duplication (~500 lines)
2. Duplicate IPC channel definitions (preload.ts)
3. Mixed async/sync repository patterns
4. Incomplete extended thinking implementation
5. Monolithic preload.ts (1,847 lines)
6. Repository pattern violations
7. Agent duplication handler logic duplication

### MEDIUM (Plan to Fix)
1. Table component duplication
2. Inconsistent error handling
3. Mixed state management patterns
4. Missing database indexes
5. Half-implemented features (hooks, stream test page)
6. Component organization inconsistencies
7. Type duplication between handlers/repositories
8. Large hook files (700+ lines)

### LOW (Monitor)
1. Limited `any` usage (well-controlled)
2. Console.log statements (181 occurrences - acceptable for debugging)
3. Minor naming inconsistencies

---

## ESTIMATED CLEANUP IMPACT

**Lines of code that could be eliminated**:
- Confirmation dialogs: ~650 lines (create generic component)
- Service duplication: ~1,200 lines (extract shared logic)
- Repository CRUD: ~400 lines (abstract base repository)
- IPC handler duplication: ~200 lines (share copy logic)
- Dead database columns: N/A (schema cleanup)

**Total potential reduction**: ~2,500+ lines of duplicate/dead code

**Development velocity improvement**: Significant - changes would only need to be made once instead of 3-15 times for common patterns.

---

## RECOMMENDED ATTACK PLAN (High Level)

### Phase 1: Extract Common Patterns (~biggest bang for buck)
- Create generic confirmation dialog component
- Extract shared service logic to base class/utilities
- Build base repository pattern with common CRUD

### Phase 2: Clean Up Dead Code
- Remove unused database columns
- Delete/document incomplete features
- Remove dev test pages

### Phase 3: Break Up God Files
- Split pipeline-view into step-specific components
- Code-generate or refactor preload.ts
- Break up agent-editor-dialog

### Phase 4: Standardize Patterns
- Make all repositories consistently async
- Standardize error handling in IPC handlers
- Add missing database indexes

---

## KEY METRICS

- **15+ duplicate confirmation dialogs** → 1 generic component
- **3 services with 1,500+ duplicate lines** → Shared base utilities
- **17 repositories with duplicate CRUD** → Base repository pattern
- **1,659-line component** → Split into 5-6 smaller components
- **1,847-line preload file** → Code generation or splitting

---

## NEXT STEPS

1. Review and prioritize specific areas based on current development needs
2. Create detailed refactoring plans for critical areas
3. Establish patterns/conventions to prevent future debt accumulation
4. Consider setting up linting rules to catch common issues early

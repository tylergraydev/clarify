# Implementation Plan: IPC Handlers for Claude Orchestrator

Generated: 2026-01-28
Original Request: implement the ipc handlers and update the electron api and hook
Refined Request: Implement the IPC (Inter-Process Communication) handlers that establish bidirectional communication between the Electron main process and the Next.js renderer process, enabling the Claude Orchestrator UI to interact with backend services and the Node.js environment. This involves creating handlers in electron/main.ts using the ipcMain.handle() pattern for all defined channels specified in the design document Section 6.4, including workflow management operations (create, start, pause, resume, cancel, get, list), step management (edit, regenerate), file discovery updates, agent operations (list, get, update, reset), template management (list, create), project and repository management (create, addRepo), and audit exports. Additionally, update the ElectronAPI interface in electron/preload.ts to define the type signatures for each IPC channel and register them via contextBridge to expose them safely to the renderer process. Finally, create or enhance the hooks/use-electron.ts React hooks to wrap the Electron API calls, integrating them with TanStack Query for data fetching and caching where appropriate, and with Zustand for state management where necessary.

## Analysis Summary

- Feature request refined with project context
- Discovered 34 files across 4 priority categories
- Generated 23-step implementation plan

## File Discovery Results

### Critical Priority (8 files)
| File | Action | Description |
|------|--------|-------------|
| `electron/main.ts` | modify | Add IPC handler registrations |
| `electron/preload.ts` | modify | Extend ElectronAPI interface |
| `types/electron.d.ts` | modify | Update type definitions |
| `hooks/use-electron.ts` | modify | Add domain-specific hooks |
| `electron/ipc/channels.ts` | create | Define IPC channel constants |
| `electron/ipc/index.ts` | create | Central handler registration |
| `electron/ipc/workflows.handlers.ts` | create | Workflow IPC handlers |
| `electron/ipc/steps.handlers.ts` | create | Step management handlers |

### High Priority (12 files)
| File | Action | Description |
|------|--------|-------------|
| `electron/ipc/agents.handlers.ts` | create | Agent handlers |
| `electron/ipc/templates.handlers.ts` | create | Template handlers |
| `electron/ipc/projects.handlers.ts` | create | Project handlers |
| `electron/ipc/discovery.handlers.ts` | create | Discovery handlers |
| `electron/ipc/audit.handlers.ts` | create | Audit export handler |
| `lib/queries/*.ts` | create | Query key definitions |
| `hooks/queries/use-*.ts` | create | TanStack Query hooks |

---

## Overview

**Estimated Duration**: 3-4 days
**Complexity**: High
**Risk Level**: Medium

## Quick Summary

This plan implements the complete IPC (Inter-Process Communication) layer that enables bidirectional communication between the Electron main process and the Next.js renderer process. The implementation creates channel definitions, domain-specific handlers for all database entities (workflows, steps, agents, templates, projects, repositories, audit logs, discovered files), extends the preload script with type-safe API exposure, and establishes TanStack Query hooks for data fetching and caching in the renderer process.

## Prerequisites

- [ ] Database schema and repositories are implemented (verified: `db/repositories/*.ts`)
- [ ] Electron main process and preload script exist (verified: `electron/main.ts` and `preload.ts`)
- [ ] TypeScript types for electron.d.ts exist (verified: `types/electron.d.ts`)
- [ ] Base useElectron hooks exist (verified: `hooks/use-electron.ts`)
- [ ] TanStack Query is configured in the project

---

## Implementation Steps

### Step 1: Create IPC Channel Constants

**What**: Define all IPC channel constants in a centralized channels file following the `domain:subdomain:action` naming pattern.
**Why**: Centralized channel definitions ensure type safety and prevent string typos across the codebase. This is the foundation for all IPC communication.
**Confidence**: High

**Files to Create:**
- `electron/ipc/channels.ts` - Central channel constant definitions

**Changes:**
- Define `IpcChannels` object with nested structure for all domains:
  - `workflow` (create, start, pause, resume, cancel, get, list)
  - `step` (edit, regenerate)
  - `discovery` (update)
  - `agent` (list, get, update, reset)
  - `template` (list, create)
  - `project` (create, get, list, update, delete, addRepo)
  - `repository` (create, get, list, update, delete, findByProject)
  - `audit` (export, list, findByWorkflow)
  - Preserve existing channels: `app`, `dialog`, `fs`, `store`
- Export as `const` for type inference

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] `IpcChannels` object exports all channel constants
- [ ] Channel names follow `domain:subdomain:action` pattern
- [ ] TypeScript infers channel string literal types
- [ ] All validation commands pass

---

### Step 2: Create Central Handler Registration Index

**What**: Create the central registration file that orchestrates all IPC handler registrations with dependency injection.
**Why**: Centralizing handler registration ensures proper initialization order, dependency management, and clean separation of concerns.
**Confidence**: High

**Files to Create:**
- `electron/ipc/index.ts` - Central handler registration with repository factory

**Changes:**
- Create `registerAllHandlers(db: DrizzleDatabase, getMainWindow: () => BrowserWindow | null)` function
- Import all domain handler registration functions
- Instantiate repositories using factory functions from `db/repositories`
- Call each domain's registration function with appropriate dependencies
- Export `IpcChannels` from channels.ts for external use
- Organize registrations with comments by category (stateless first, then with dependencies)

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] `registerAllHandlers` function accepts database and window getter
- [ ] All domain handler functions are imported and called
- [ ] Repository instances created once and passed to handlers
- [ ] All validation commands pass

---

### Step 3: Implement Workflow IPC Handlers

**What**: Create handlers for workflow management operations (create, start, pause, resume, cancel, get, list).
**Why**: Workflows are the core entity of the orchestrator. These handlers enable the renderer to manage workflow lifecycle.
**Confidence**: High

**Files to Create:**
- `electron/ipc/workflows.handlers.ts` - Workflow management handlers

**Changes:**
- Create `registerWorkflowsHandlers(workflowsRepository: WorkflowsRepository)` function
- Implement handlers for all workflow channels:
  - `workflow:create` - Create new workflow with config
  - `workflow:start` - Start workflow (update status to running)
  - `workflow:pause` - Pause workflow (update status to paused)
  - `workflow:resume` - Resume paused workflow
  - `workflow:cancel` - Cancel workflow (update status to cancelled)
  - `workflow:get` - Get workflow by ID
  - `workflow:list` - List workflows with optional filters
- Use `ipcMain.handle` with proper `IpcMainInvokeEvent` typing
- Delegate all operations to the repository

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All workflow handlers registered with correct channel names
- [ ] Handlers properly typed with `IpcMainInvokeEvent`
- [ ] Repository methods called correctly
- [ ] All validation commands pass

---

### Step 4: Implement Workflow Steps IPC Handlers

**What**: Create handlers for step management operations (edit, regenerate, get, list by workflow).
**Why**: Step management enables users to view progress, edit outputs, and regenerate steps during workflow execution.
**Confidence**: High

**Files to Create:**
- `electron/ipc/steps.handlers.ts` - Step management handlers

**Changes:**
- Create `registerStepsHandlers(workflowStepsRepository: WorkflowStepsRepository)` function
- Implement handlers:
  - `step:edit` - Edit step output text (calls `markEdited`)
  - `step:regenerate` - Mark step for regeneration (update status)
  - `step:get` - Get step by ID
  - `step:list` - List steps by workflow ID
  - `step:complete` - Complete step with output
  - `step:fail` - Fail step with error
- Follow IPC handler conventions with proper typing

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All step handlers registered with correct channel names
- [ ] Edit handler calls `markEdited` repository method
- [ ] Status update handlers work correctly
- [ ] All validation commands pass

---

### Step 5: Implement Discovery Files IPC Handlers

**What**: Create handlers for file discovery operations (update, include/exclude, add file).
**Why**: File discovery results need to be editable by users, allowing them to add, remove, or modify discovered file priorities.
**Confidence**: High

**Files to Create:**
- `electron/ipc/discovery.handlers.ts` - File discovery handlers

**Changes:**
- Create `registerDiscoveryHandlers(discoveredFilesRepository: DiscoveredFilesRepository)` function
- Implement handlers:
  - `discovery:update` - Batch update discovered files for a workflow step
  - `discovery:include` - Include a file in the discovery results
  - `discovery:exclude` - Exclude a file from discovery results
  - `discovery:add` - Add a user file to discovery
  - `discovery:updatePriority` - Change file priority
  - `discovery:list` - List files by workflow step
- Handle array inputs for batch operations

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All discovery handlers registered
- [ ] Batch update handles array of files correctly
- [ ] Include/exclude toggle file inclusion status
- [ ] All validation commands pass

---

### Step 6: Implement Agents IPC Handlers

**What**: Create handlers for agent management operations (list, get, update, reset).
**Why**: Users need to view and customize agents, including modifying prompts and tool configurations.
**Confidence**: High

**Files to Create:**
- `electron/ipc/agents.handlers.ts` - Agent management handlers

**Changes:**
- Create `registerAgentsHandlers(agentsRepository: AgentsRepository)` function
- Implement handlers:
  - `agent:list` - List all active agents with optional filters
  - `agent:get` - Get agent by ID
  - `agent:update` - Update agent configuration
  - `agent:reset` - Reset agent to built-in defaults (deactivate custom, activate built-in)
  - `agent:activate` - Activate a deactivated agent
  - `agent:deactivate` - Deactivate an agent
- Handle async repository methods (agents repository uses async/await)

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All agent handlers registered
- [ ] Handlers properly await async repository calls
- [ ] Reset functionality restores built-in defaults
- [ ] All validation commands pass

---

### Step 7: Implement Templates IPC Handlers

**What**: Create handlers for template management operations (list, create, get, update).
**Why**: Templates provide reusable feature request patterns that users can customize and create.
**Confidence**: High

**Files to Create:**
- `electron/ipc/templates.handlers.ts` - Template management handlers

**Changes:**
- Create `registerTemplatesHandlers(templatesRepository: TemplatesRepository)` function
- Implement handlers:
  - `template:list` - List templates with optional category filter
  - `template:get` - Get template by ID
  - `template:create` - Create new template
  - `template:update` - Update template
  - `template:delete` - Delete (deactivate) template
  - `template:incrementUsage` - Track template usage

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All template handlers registered
- [ ] Category filtering works correctly
- [ ] Usage count increments on use
- [ ] All validation commands pass

---

### Step 8: Implement Projects IPC Handlers

**What**: Create handlers for project management operations (create, get, list, update, delete, addRepo).
**Why**: Projects are the top-level organizational unit that group repositories and workflows.
**Confidence**: High

**Files to Create:**
- `electron/ipc/projects.handlers.ts` - Project management handlers

**Changes:**
- Create `registerProjectsHandlers(projectsRepository: ProjectsRepository, repositoriesRepository: RepositoriesRepository)` function
- Implement handlers:
  - `project:create` - Create new project
  - `project:get` - Get project by ID
  - `project:list` - List all projects (optional include archived)
  - `project:update` - Update project details
  - `project:delete` - Archive (soft delete) project
  - `project:addRepo` - Add repository to project (create repository record)
- Handle async repository methods

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All project handlers registered
- [ ] `addRepo` creates repository linked to project
- [ ] Delete archives rather than hard deletes
- [ ] All validation commands pass

---

### Step 9: Implement Repositories IPC Handlers

**What**: Create handlers for repository management operations.
**Why**: Repositories track the file system paths of codebases associated with projects.
**Confidence**: High

**Files to Create:**
- `electron/ipc/repositories.handlers.ts` - Repository management handlers

**Changes:**
- Create `registerRepositoriesHandlers(repositoriesRepository: RepositoriesRepository)` function
- Implement handlers:
  - `repository:create` - Create new repository
  - `repository:get` - Get repository by ID
  - `repository:list` - List repositories with optional project filter
  - `repository:update` - Update repository
  - `repository:delete` - Delete repository
  - `repository:findByPath` - Find repository by file path
  - `repository:setDefault` - Set repository as default for project
  - `repository:findByProject` - Find all repositories for a project

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All repository handlers registered
- [ ] Path-based lookup works correctly
- [ ] Default repository setting works
- [ ] All validation commands pass

---

### Step 10: Implement Audit IPC Handlers

**What**: Create handlers for audit log operations (export, list, findByWorkflow).
**Why**: Audit logs provide traceability and allow users to export workflow history.
**Confidence**: High

**Files to Create:**
- `electron/ipc/audit.handlers.ts` - Audit log handlers

**Changes:**
- Create `registerAuditHandlers(auditLogsRepository: AuditLogsRepository)` function
- Implement handlers:
  - `audit:export` - Export audit logs for workflow as markdown or JSON
  - `audit:list` - List audit logs with filters
  - `audit:findByWorkflow` - Get all logs for a specific workflow
  - `audit:findByStep` - Get logs for a specific step
  - `audit:create` - Create audit log entry
- Implement export format generation (markdown and JSON)

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All audit handlers registered
- [ ] Export generates valid markdown and JSON formats
- [ ] Workflow filtering returns ordered results
- [ ] All validation commands pass

---

### Step 11: Refactor main.ts to Use Centralized Handlers

**What**: Refactor `electron/main.ts` to remove inline handlers and use the centralized registration.
**Why**: Consolidates IPC logic, improves maintainability, and follows the established conventions.
**Confidence**: High

**Files to Modify:**
- `electron/main.ts` - Main process entry point

**Changes:**
- Import `registerAllHandlers` from `./ipc`
- Remove all inline `ipcMain.handle` calls for fs, dialog, store, and app handlers
- Move fs, dialog, store, and app handlers to their respective handler files in `electron/ipc/`
- Call `registerAllHandlers(db, getMainWindow)` after database initialization
- Create `getMainWindow` helper function that returns the main window or null
- Keep window creation and app lifecycle logic in main.ts

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All inline handlers removed from main.ts
- [ ] `registerAllHandlers` called with correct parameters
- [ ] Existing functionality preserved
- [ ] All validation commands pass

---

### Step 12: Extend ElectronAPI Interface in Preload

**What**: Extend the preload script to expose all new IPC channels via contextBridge.
**Why**: The preload script is the secure bridge between main and renderer processes, providing type-safe API access.
**Confidence**: High

**Files to Modify:**
- `electron/preload.ts` - Preload script with ElectronAPI

**Changes:**
- Import `IpcChannels` from `./ipc`
- Import necessary types from `../db/schema` for type annotations
- Extend `ElectronAPI` interface to include all new domains:
  - `workflow` object with all workflow methods
  - `step` object with all step methods
  - `discovery` object with discovery methods
  - `agent` object with agent methods
  - `template` object with template methods
  - `project` object with project methods
  - `repository` object with repository methods
  - `audit` object with audit methods
- Implement each method using `ipcRenderer.invoke(IpcChannels.domain.action, ...args)`
- Maintain alphabetical ordering within each domain object

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] `ElectronAPI` interface includes all new domains
- [ ] All methods return Promises with correct types
- [ ] Uses `IpcChannels` constants for channel names
- [ ] All validation commands pass

---

### Step 13: Update types/electron.d.ts with Full API Types

**What**: Update the TypeScript declaration file to match the extended ElectronAPI.
**Why**: Type definitions ensure type safety in the renderer process and enable IDE autocompletion.
**Confidence**: High

**Files to Modify:**
- `types/electron.d.ts` - ElectronAPI type definitions

**Changes:**
- Re-export all necessary types from `../db/schema` for renderer use
- Mirror the `ElectronAPI` interface from preload.ts exactly
- Add type definitions for all new domain objects:
  - workflow, step, discovery, agent, template, project, repository, audit
- Use `import()` syntax for types where needed
- Ensure global `Window` interface augmentation includes optional `electronAPI`
- Export empty object at end to make it a module

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Types match preload.ts implementation exactly
- [ ] All schema types re-exported for renderer use
- [ ] Window interface properly augmented
- [ ] All validation commands pass

---

### Step 14: Create Query Key Definitions

**What**: Create query key factory definitions for all entities using `@lukemorales/query-key-factory`.
**Why**: Centralized query keys enable type-safe cache invalidation and consistent data fetching patterns.
**Confidence**: High

**Files to Create:**
- `lib/queries/index.ts` - Merged query keys export
- `lib/queries/workflows.ts` - Workflow query keys
- `lib/queries/steps.ts` - Step query keys
- `lib/queries/agents.ts` - Agent query keys
- `lib/queries/templates.ts` - Template query keys
- `lib/queries/projects.ts` - Project query keys
- `lib/queries/repositories.ts` - Repository query keys
- `lib/queries/audit-logs.ts` - Audit log query keys
- `lib/queries/discovered-files.ts` - Discovered files query keys

**Changes:**
- Create query key definitions using `createQueryKeys` for each entity
- Define `list` queries with optional filter parameters
- Define `detail` queries with entity ID
- Define relationship queries (e.g., `byWorkflow`, `byProject`)
- Merge all keys in index.ts using `mergeQueryKeys`
- Export merged `queries` object and `QueryKeys` type

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All entity query keys defined with proper structure
- [ ] Keys merged and exported from index.ts
- [ ] `QueryKeys` type inferred correctly
- [ ] All validation commands pass

---

### Step 15: Create TanStack Query Hooks for Workflows

**What**: Create query and mutation hooks for workflow operations.
**Why**: Hooks provide a clean interface for components to fetch and mutate workflow data with caching.
**Confidence**: High

**Files to Create:**
- `hooks/queries/use-workflows.ts` - Workflow query hooks

**Changes:**
- Create `useWorkflows()` hook for listing workflows
- Create `useWorkflow(id)` hook for single workflow
- Create `useWorkflowsByProject(projectId)` hook for filtered list
- Create `useCreateWorkflow()` mutation hook
- Create `useStartWorkflow()` mutation hook
- Create `usePauseWorkflow()` mutation hook
- Create `useResumeWorkflow()` mutation hook
- Create `useCancelWorkflow()` mutation hook
- All queries use `enabled: isElectron` pattern
- Mutations invalidate appropriate query keys on success

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All workflow query hooks use correct query keys
- [ ] Mutations invalidate correct queries
- [ ] `enabled: isElectron` on all queries
- [ ] All validation commands pass

---

### Step 16: Create TanStack Query Hooks for Steps

**What**: Create query and mutation hooks for workflow step operations.
**Why**: Steps need their own hooks for fetching step data and handling edit/regenerate operations.
**Confidence**: High

**Files to Create:**
- `hooks/queries/use-steps.ts` - Step query hooks

**Changes:**
- Create `useStep(id)` hook for single step
- Create `useStepsByWorkflow(workflowId)` hook for steps in a workflow
- Create `useEditStep()` mutation hook
- Create `useRegenerateStep()` mutation hook
- Create `useCompleteStep()` mutation hook
- Create `useFailStep()` mutation hook
- Invalidate both step and workflow queries on mutations

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All step query hooks implemented
- [ ] Edit mutation updates cache correctly
- [ ] Workflow queries invalidated on step changes
- [ ] All validation commands pass

---

### Step 17: Create TanStack Query Hooks for Agents and Templates

**What**: Create query and mutation hooks for agent and template operations.
**Why**: Agents and templates are configuration entities that need CRUD operations from the UI.
**Confidence**: High

**Files to Create:**
- `hooks/queries/use-agents.ts` - Agent query hooks
- `hooks/queries/use-templates.ts` - Template query hooks

**Changes:**
- Create agent hooks: `useAgents()`, `useAgent(id)`, `useUpdateAgent()`, `useResetAgent()`
- Create template hooks: `useTemplates()`, `useTemplate(id)`, `useCreateTemplate()`, `useUpdateTemplate()`
- Add category filtering for templates
- Include `useTemplatesByCategory(category)` hook
- Handle activation/deactivation mutations

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All agent hooks use async pattern (repository is async)
- [ ] Template hooks support category filtering
- [ ] Reset agent invalidates all agent queries
- [ ] All validation commands pass

---

### Step 18: Create TanStack Query Hooks for Projects and Repositories

**What**: Create query and mutation hooks for project and repository operations.
**Why**: Projects and repositories are the organizational backbone that needs full CRUD support.
**Confidence**: High

**Files to Create:**
- `hooks/queries/use-projects.ts` - Project query hooks
- `hooks/queries/use-repositories.ts` - Repository query hooks

**Changes:**
- Create project hooks: `useProjects()`, `useProject(id)`, `useCreateProject()`, `useUpdateProject()`, `useDeleteProject()`, `useAddRepositoryToProject()`
- Create repository hooks: `useRepositories()`, `useRepository(id)`, `useRepositoriesByProject(projectId)`, `useCreateRepository()`, `useUpdateRepository()`, `useDeleteRepository()`, `useSetDefaultRepository()`
- Handle cascading invalidations (project changes may affect repository queries)

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All project hooks handle async repository
- [ ] Repository hooks support project filtering
- [ ] Add repo mutation invalidates both project and repository caches
- [ ] All validation commands pass

---

### Step 19: Create TanStack Query Hooks for Audit and Discovery

**What**: Create query hooks for audit logs and discovered files.
**Why**: These entities support read-heavy operations with specific filtering needs.
**Confidence**: High

**Files to Create:**
- `hooks/queries/use-audit-logs.ts` - Audit log query hooks
- `hooks/queries/use-discovered-files.ts` - Discovered files query hooks

**Changes:**
- Create audit hooks: `useAuditLogs()`, `useAuditLogsByWorkflow(workflowId)`, `useExportAuditLog()`
- Create discovery hooks: `useDiscoveredFiles(stepId)`, `useIncludedFiles(stepId)`, `useUpdateDiscoveredFiles()`, `useIncludeFile()`, `useExcludeFile()`, `useAddDiscoveredFile()`
- Export mutation returns data for download (audit export)

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Audit export returns formatted string
- [ ] Discovery hooks handle batch operations
- [ ] Include/exclude mutations update cache
- [ ] All validation commands pass

---

### Step 20: Extend use-electron.ts with Domain-Specific Hooks

**What**: Extend the base useElectron hooks with domain-specific accessor hooks.
**Why**: Provides a convenient wrapper around the ElectronAPI for use in TanStack Query hooks.
**Confidence**: High

**Files to Modify:**
- `hooks/use-electron.ts` - Base electron hooks

**Changes:**
- Create `useElectronDb()` hook that provides access to all database domains
- Add domain accessors: `workflows`, `steps`, `discovery`, `agents`, `templates`, `projects`, `repositories`, `audit`
- Each accessor mirrors the ElectronAPI structure
- Include proper error handling (throw if API not available for writes, return safe defaults for reads)
- Use `useMemo` for method objects to maintain referential stability

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] `useElectronDb()` provides all domain accessors
- [ ] Write operations throw errors when API unavailable
- [ ] Read operations return safe defaults
- [ ] All validation commands pass

---

### Step 21: Create Query Hooks Index Export

**What**: Create an index file that exports all query hooks.
**Why**: Provides a single import point for all query hooks, improving developer experience.
**Confidence**: High

**Files to Create:**
- `hooks/queries/index.ts` - Query hooks barrel export

**Changes:**
- Export all hooks from each query hook file
- Organize exports alphabetically by domain
- Include re-export of query keys from `lib/queries`

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All query hooks exportable from single path
- [ ] Query keys accessible from hooks/queries
- [ ] All validation commands pass

---

### Step 22: Move Existing Handlers to Separate Files

**What**: Extract existing fs, dialog, store, and app handlers from main.ts into separate handler files.
**Why**: Maintains consistency with the new handler file organization pattern.
**Confidence**: High

**Files to Create:**
- `electron/ipc/fs.handlers.ts` - File system handlers
- `electron/ipc/dialog.handlers.ts` - Dialog handlers
- `electron/ipc/store.handlers.ts` - Store handlers
- `electron/ipc/app.handlers.ts` - App info handlers

**Changes:**
- Move `fs:readFile`, `fs:writeFile`, `fs:readDirectory`, `fs:exists`, `fs:stat` handlers to fs.handlers.ts
- Move `dialog:openDirectory`, `dialog:openFile`, `dialog:saveFile` handlers to dialog.handlers.ts
- Move `store:get`, `store:set`, `store:delete` handlers to store.handlers.ts
- Move `app:getVersion`, `app:getPath` handlers to app.handlers.ts
- Create registration functions for each: `registerFsHandlers()`, `registerDialogHandlers()`, `registerStoreHandlers()`, `registerAppHandlers()`
- Include `isValidPath` helper in fs.handlers.ts

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All existing handlers moved to separate files
- [ ] Registration functions follow established pattern
- [ ] Path validation preserved in fs handlers
- [ ] All validation commands pass

---

### Step 23: Integration Testing and Final Validation

**What**: Verify the complete IPC implementation works end-to-end.
**Why**: Ensures all layers (handlers, preload, types, hooks) are properly connected.
**Confidence**: High

**Files to Modify:**
- None (validation only)

**Changes:**
- Run full type checking across the project
- Verify all imports resolve correctly
- Ensure no circular dependencies exist
- Validate that the Electron build process completes

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck && pnpm run build
```

**Success Criteria:**
- [ ] No TypeScript errors in any file
- [ ] No ESLint errors or warnings
- [ ] Build completes successfully
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint:fix`
- [ ] Build process completes: `pnpm run build`
- [ ] IPC channel naming follows `domain:subdomain:action` pattern consistently
- [ ] All handlers use `_event: IpcMainInvokeEvent` typing convention
- [ ] All query hooks include `enabled: isElectron` check
- [ ] Query key factories properly defined and merged
- [ ] ElectronAPI interface in types/electron.d.ts matches preload.ts exactly

## Notes

1. **Repository Pattern Consistency**: Some repositories use synchronous methods (workflows, templates) while others use async (projects, agents). Handlers must match the repository's async nature.

2. **Error Handling**: Database handlers should let errors propagate to be handled by the query layer. File system handlers should return result objects with success/error fields.

3. **Cache Invalidation Strategy**: Mutations that affect related entities (e.g., adding a repository to a project) should invalidate both entity caches.

4. **Type Re-exports**: The types/electron.d.ts file must re-export schema types so the renderer can use them without importing from the db folder directly.

5. **Electron Security**: All handlers maintain context isolation. The preload script only exposes necessary methods via contextBridge. Path validation prevents directory traversal attacks.

6. **Existing Functionality**: The refactoring preserves all existing IPC functionality (fs, dialog, store, app). These are simply moved to separate handler files.

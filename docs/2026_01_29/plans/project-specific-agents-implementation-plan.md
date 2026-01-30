# Project-Specific Agents Implementation Plan

**Generated**: 2026-01-29
**Original Request**: The agent management page needs to support project specific agents features
**Status**: Ready for Implementation

## Analysis Summary

- Feature request refined with project context through clarification Q&A
- Discovered 30 files across database, queries, components, and IPC layers
- Generated 14-step implementation plan with quality gates

## File Discovery Results

### Critical Files (Must Modify)

| File                                   | Action | Purpose                                        |
| -------------------------------------- | ------ | ---------------------------------------------- |
| `app/(app)/agents/page.tsx`            | Modify | Add tabbed interface for Global/Project agents |
| `db/repositories/agents.repository.ts` | Modify | Add global agent filtering methods             |
| `hooks/queries/use-agents.ts`          | Modify | Add useGlobalAgents and useProjectAgents hooks |
| `lib/queries/agents.ts`                | Modify | Add query keys for global and project agents   |
| `electron/ipc/agent.handlers.ts`       | Modify | Update filtering patterns for scope            |
| `lib/stores/shell-store.ts`            | Verify | Ensure project selection integration           |

### High Priority Files

| File                                        | Action | Purpose                                        |
| ------------------------------------------- | ------ | ---------------------------------------------- |
| `components/agents/agent-editor-dialog.tsx` | Modify | Add projectId prop for project-scoped creation |
| `components/agents/agent-card.tsx`          | Modify | Add project scope badge                        |
| `types/electron.d.ts`                       | Modify | Add scope property to AgentListFilters         |
| `lib/validations/agent.ts`                  | Modify | Add projectId to form schema                   |

### Files to Create

| File                                               | Purpose                          |
| -------------------------------------------------- | -------------------------------- |
| `components/agents/global-agents-tab-content.tsx`  | Global agents tab panel content  |
| `components/agents/project-agents-tab-content.tsx` | Project agents tab panel content |

---

## Implementation Plan

### Overview

**Estimated Duration**: 2-3 days
**Complexity**: Medium
**Risk Level**: Medium

### Quick Summary

This plan implements a dual-tier agent management system with a tabbed interface distinguishing between global agents (organization-wide) and project-specific agents (bound to the currently selected project via the sidebar ProjectSelector). The feature supports two ownership models: custom agents created specifically for a project and per-project overrides of global agents that allow customization without duplicating base configurations.

### Prerequisites

- [ ] Verify current project selection integration works via `useShellStore` `selectedProjectId`
- [ ] Confirm the existing `agents` table schema already supports `projectId` foreign key
- [ ] Review Base UI Tabs component usage pattern from `app/(app)/projects/[id]/page.tsx`

---

### Step 1: Update Agent List Filters Type to Support Scope-Based Filtering

**What**: Extend the `AgentListFilters` interface to support a new `scope` parameter for distinguishing global vs project agents.
**Why**: The current filtering only supports `projectId` but needs to differentiate between "global only" (projectId IS NULL) and "project specific" queries.
**Confidence**: High

**Files to Modify:**

- `types/electron.d.ts` - Add `scope` property to `AgentListFilters`
- `electron/ipc/agent.handlers.ts` - Update `AgentListFilters` interface

**Changes:**

- Add optional `scope` property to `AgentListFilters` with type `"global" | "project"`
- Add optional `excludeProjectAgents` boolean for filtering out project-scoped agents in global view

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] TypeScript compiles without errors
- [ ] `AgentListFilters` type includes new `scope` property
- [ ] All validation commands pass

---

### Step 2: Update Repository to Support Global and Project-Scoped Agent Queries

**What**: Add new repository methods for fetching global-only agents (where projectId IS NULL) and project-specific agents with optional parent agent resolution.
**Why**: The repository layer needs explicit methods for the dual-tier filtering required by the tabbed interface.
**Confidence**: High

**Files to Modify:**

- `db/repositories/agents.repository.ts` - Add `findGlobal` and `findByProjectWithOverrides` methods

**Changes:**

- Add `findGlobal()` method that filters for agents where `projectId IS NULL`
- Modify `findAll()` to handle the new `scope` filter option
- Add logic to exclude project-specific agents when scope is "global"
- Add logic to include only project-specific agents when scope is "project"

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] New repository methods are callable and typed correctly
- [ ] `findAll` respects `scope` parameter when provided
- [ ] All validation commands pass

---

### Step 3: Update IPC Handler to Process Scope-Based Filtering

**What**: Modify the agent list IPC handler to pass scope-based filters to the repository.
**Why**: The main process handler bridges renderer requests to database queries and must support the new filtering pattern.
**Confidence**: High

**Files to Modify:**

- `electron/ipc/agent.handlers.ts` - Update list handler to process `scope` filter

**Changes:**

- Update the `IpcChannels.agent.list` handler to pass `scope` filter to repository
- Ensure backward compatibility when `scope` is not provided

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Handler correctly processes `scope: "global"` filter
- [ ] Handler correctly processes `scope: "project"` filter with `projectId`
- [ ] Existing agent list calls without scope continue to work
- [ ] All validation commands pass

---

### Step 4: Add Query Key Factories for Global and Project Agents

**What**: Extend the agent query key factory with dedicated keys for global agents and project-scoped agents.
**Why**: Proper cache isolation and invalidation requires distinct query keys for the two agent tiers.
**Confidence**: High

**Files to Modify:**

- `lib/queries/agents.ts` - Add `global` and `projectScoped` query key definitions

**Changes:**

- Add `global` query key with optional filters parameter
- Add `projectScoped` query key factory that accepts `projectId` and optional filters
- Ensure keys are composable for cache invalidation patterns

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] New query keys are exported and typed correctly
- [ ] Keys follow existing factory pattern from `@lukemorales/query-key-factory`
- [ ] All validation commands pass

---

### Step 5: Create Query Hooks for Global and Project-Scoped Agents

**What**: Add `useGlobalAgents` and `useProjectAgents` hooks that use the new query keys and filter parameters.
**Why**: The React layer needs dedicated hooks for fetching agents in each tier with proper caching behavior.
**Confidence**: High

**Files to Modify:**

- `hooks/queries/use-agents.ts` - Add `useGlobalAgents` and `useProjectAgents` hooks

**Changes:**

- Add `useGlobalAgents` hook that calls `api.agent.list({ scope: "global", ... })`
- Add `useProjectAgents` hook that requires `projectId` and calls `api.agent.list({ scope: "project", projectId, ... })`
- Update `useCreateAgent` mutation to invalidate appropriate query keys based on whether the agent has a `projectId`

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] New hooks are exported and usable in components
- [ ] `useGlobalAgents` returns only agents where projectId is null
- [ ] `useProjectAgents` returns only agents for the specified project
- [ ] All validation commands pass

---

### Step 6: Update Validation Schemas for Project-Scoped Agent Creation

**What**: Extend agent validation schemas to properly handle `projectId` field in create and update operations.
**Why**: Form validation must support the new ownership model where agents can be explicitly scoped to a project.
**Confidence**: High

**Files to Modify:**

- `lib/validations/agent.ts` - Add `projectId` to create agent form schema

**Changes:**

- Add optional `projectId` field to `createAgentFormSchema`
- Ensure `updateAgentRepositorySchema` already handles `projectId` (verify existing field)
- Add validation for project-scoped agent creation flow

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] `createAgentFormSchema` includes optional `projectId` field
- [ ] Type inference works correctly for form data
- [ ] All validation commands pass

---

### Step 7: Update Agent Card to Display Project Scope Badge

**What**: Enhance the AgentCard component to show a visual indicator when an agent is project-specific.
**Why**: Users need to distinguish between global and project-scoped agents at a glance in the UI.
**Confidence**: High

**Files to Modify:**

- `components/agents/agent-card.tsx` - Add project scope badge logic

**Changes:**

- Add `isProjectScoped` derived state check (`agent.projectId !== null`)
- Render a "Project" badge in the Agent Origin Indicator section when agent is project-scoped
- Use existing `Badge` component with appropriate variant

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Project-scoped agents display a distinguishing badge
- [ ] Badge appears alongside existing Custom/Customized badges
- [ ] Badge styling is consistent with design system
- [ ] All validation commands pass

---

### Step 8: Update Agent Editor Dialog for Project-Scoped Creation

**What**: Modify the AgentEditorDialog to accept and display project context when creating project-specific agents.
**Why**: The create flow needs to know whether the agent should be global or bound to the currently selected project.
**Confidence**: Medium

**Files to Modify:**

- `components/agents/agent-editor-dialog.tsx` - Add `projectId` prop and pass to create mutation

**Changes:**

- Add optional `projectId` prop to `AgentEditorDialogProps` interface
- Pass `projectId` to `createAgentMutation.mutateAsync()` when creating new agents
- Display project context in dialog header when creating a project-scoped agent
- Keep `projectId` undefined for global agent creation

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Dialog correctly passes `projectId` when creating project-scoped agents
- [ ] Dialog header indicates project scope when applicable
- [ ] Global agent creation still works (projectId undefined)
- [ ] All validation commands pass

---

### Step 9: Create Tab Content Components for Global and Project Agents

**What**: Create two new tab content components that encapsulate the agent grid rendering logic for each tier.
**Why**: Separating tab content into dedicated components improves maintainability and keeps the main page component clean.
**Confidence**: High

**Files to Create:**

- `components/agents/global-agents-tab-content.tsx` - Global agents tab panel content
- `components/agents/project-agents-tab-content.tsx` - Project agents tab panel content

**Changes:**

- Create `GlobalAgentsTabContent` component that uses `useGlobalAgents` hook
- Create `ProjectAgentsTabContent` component that uses `useProjectAgents` hook and accepts `projectId` prop
- Extract shared grid rendering logic into reusable patterns
- Handle empty states specific to each tier (different messaging for global vs project)

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Both tab content components render correctly
- [ ] Each uses the appropriate query hook
- [ ] Empty states have contextually appropriate messaging
- [ ] Components follow existing component patterns in the codebase
- [ ] All validation commands pass

---

### Step 10: Refactor Agents Page with Tabbed Interface

**What**: Update the main agents page to implement the dual-tab interface using Base UI Tabs components.
**Why**: This is the core UI change that surfaces the global/project agent distinction to users.
**Confidence**: High

**Files to Modify:**

- `app/(app)/agents/page.tsx` - Implement tabbed layout with Global and Project tabs

**Changes:**

- Import Tabs components (`TabsRoot`, `TabsList`, `TabsTrigger`, `TabsIndicator`, `TabsPanel`)
- Import `useShellStore` to access `selectedProjectId`
- Add tab state management (consider URL state with nuqs for tab persistence)
- Replace single agent grid with two tab panels:
  - "Global Agents" tab using `GlobalAgentsTabContent`
  - "Project Agents" tab using `ProjectAgentsTabContent` with selected project ID
- Update "Create Agent" button to pass `projectId` when on Project Agents tab
- Handle case when no project is selected (disable or hide Project tab, or show guidance)
- Move existing filter UI inside each tab content component or share across tabs

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Tabbed interface renders with Global and Project tabs
- [ ] Tab switching works correctly with animation indicator
- [ ] Each tab displays appropriate agents
- [ ] Create button behavior differs based on active tab
- [ ] No project selected state is handled gracefully
- [ ] All validation commands pass

---

### Step 11: Add Per-Project Override Support for Global Agents

**What**: Implement the ability to create a project-specific override of a global agent.
**Why**: This enables teams to customize global agent prompts for specific projects without modifying the base agent.
**Confidence**: Medium

**Files to Modify:**

- `components/agents/agent-card.tsx` - Add "Override for Project" action button for global agents
- `electron/ipc/agent.handlers.ts` - Enhance duplicate handler to support override creation
- `hooks/queries/use-agents.ts` - Add `useCreateAgentOverride` mutation hook

**Changes:**

- Add conditional "Override for Project" button on AgentCard when viewing global agents and a project is selected
- Create IPC handler logic or modify duplicate handler to create a project-scoped copy with `parentAgentId` set to the original global agent
- Mutation hook should invalidate both global and project agent caches
- Override agent should have `projectId` set and `parentAgentId` pointing to the global agent

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] "Override for Project" action appears on global agents when project is selected
- [ ] Override creates a new agent with correct `projectId` and `parentAgentId`
- [ ] Override inherits global agent's properties but can be customized
- [ ] Both global and project caches invalidate appropriately
- [ ] All validation commands pass

---

### Step 12: Update Cache Invalidation Patterns for Dual-Tier Model

**What**: Review and update all agent mutation hooks to properly invalidate both global and project caches.
**Why**: The dual-tier model requires more granular cache invalidation to ensure UI consistency.
**Confidence**: High

**Files to Modify:**

- `hooks/queries/use-agents.ts` - Update mutation hooks with comprehensive invalidation

**Changes:**

- Update `useDeleteAgent` to invalidate both global and project queries
- Update `useDuplicateAgent` to invalidate appropriate cache based on result's `projectId`
- Update `useUpdateAgent` to invalidate project cache if agent has `projectId`
- Ensure `useActivateAgent` and `useDeactivateAgent` handle both tiers

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] All mutations properly invalidate relevant caches
- [ ] Global agent operations don't unnecessarily invalidate project caches
- [ ] Project agent operations invalidate the specific project cache
- [ ] All validation commands pass

---

### Step 13: Add Project Context to Agents Page Header

**What**: Display the currently selected project name in the page header when on the Project Agents tab.
**Why**: Users need clear context about which project's agents they are viewing and creating.
**Confidence**: High

**Files to Modify:**

- `app/(app)/agents/page.tsx` - Add project context display
- Use existing `useProject` hook for selected project details

**Changes:**

- Import `useProject` hook or equivalent to fetch selected project details
- Display project name in header when Project Agents tab is active
- Update page description dynamically based on active tab
- Handle loading state for project fetch

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Project name displays when viewing Project Agents tab
- [ ] Header updates appropriately when switching tabs
- [ ] Loading states are handled gracefully
- [ ] All validation commands pass

---

### Step 14: Integration Testing and Edge Case Handling

**What**: Verify end-to-end functionality and handle edge cases.
**Why**: Ensure the feature works correctly in all scenarios including no project selected, empty states, and mixed agent types.
**Confidence**: High

**Files to Modify:**

- `app/(app)/agents/page.tsx` - Add edge case handling
- `components/agents/project-agents-tab-content.tsx` - Add no-project-selected state

**Changes:**

- Handle state when no project is selected in the sidebar
- Ensure proper empty states for both tabs
- Verify reset functionality works for project-scoped overrides
- Confirm delete restrictions apply correctly (can delete project agents, cannot delete built-in)
- Test filter combinations (type filter + search + tab scope)

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Feature works when no project is selected (graceful degradation)
- [ ] All empty states display appropriate messages
- [ ] Reset to default works for project overrides (deletes override, keeps global)
- [ ] Filters work correctly within each tab
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint`
- [ ] Manual verification: Create global agent and verify it appears only in Global tab
- [ ] Manual verification: Create project-scoped agent and verify it appears only in Project tab
- [ ] Manual verification: Create override of global agent for project
- [ ] Manual verification: Delete project agent and verify global agent unaffected
- [ ] Manual verification: Reset project override and verify global agent restored in project context
- [ ] Manual verification: Tab switching preserves filter states appropriately
- [ ] Manual verification: No project selected shows appropriate guidance in Project tab

---

## Notes

- The existing `agents` schema already has `projectId` and `parentAgentId` columns, reducing database migration needs
- The `useShellStore` already tracks `selectedProjectId` from the ProjectSelector, providing project context
- Consider persisting the active tab in URL state using nuqs for better UX (back button behavior)
- The override model uses `parentAgentId` to track the relationship between project override and global agent
- Built-in agents cannot be deleted but can be overridden at the project level
- Cache invalidation is critical for the dual-tier model; pay close attention to Step 12
- The Tabs component pattern from `app/(app)/projects/[id]/page.tsx` should be followed for consistency

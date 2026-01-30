# Agent Management Page Redesign - Implementation Plan

Generated: 2026-01-30

## Overview

- **Estimated Duration**: 2-3 days
- **Complexity**: High
- **Risk Level**: Medium

## Quick Summary

This plan redesigns the agent management page to replace the dual-tab interface (Global Agents / Project Agents) with a unified DataTable view displaying all agents together. The implementation involves creating new IPC handlers for move/copy operations, adding a unified query hook, refactoring the agent table columns to include project scope and counts, enhancing the toolbar with faceted filters and toggle switches, updating the editor dialog with project assignment, and finally removing deprecated tab-based components and the layout toggle store.

## Analysis Summary

- Feature request refined with project context
- Discovered 34 files across multiple directories
- Generated 10-step implementation plan

## File Discovery Results

### Critical Files (9)
| File | Changes Required |
|------|-----------------|
| `app/(app)/agents/page.tsx` | Complete redesign from dual-tab to unified DataTable |
| `components/agents/agent-editor-dialog.tsx` | Add project assignment dropdown |
| `hooks/queries/use-agents.ts` | Add useAllAgents, useMoveAgent, useCopyToProject hooks |
| `lib/queries/agents.ts` | Update query key factory with "all" key |
| `electron/ipc/agent.handlers.ts` | Add agent:move and agent:copyToProject handlers |
| `electron/ipc/channels.ts` | Add new IPC channels |
| `electron/preload.ts` | Add new agent API methods |
| `types/electron.d.ts` | Update ElectronAPI types |
| `components/agents/agent-table.tsx` | Major refactoring for unified view |

### Files to Delete (5)
- `components/agents/global-agents-tab-content.tsx`
- `components/agents/project-agents-tab-content.tsx`
- `components/agents/agent-layout-toggle.tsx`
- `components/agents/agent-layout-renderer.tsx`
- `lib/stores/agent-layout-store.ts`

### Files to Create (2)
- `components/agents/agent-table-toolbar.tsx` - Toolbar content component
- `components/agents/select-project-dialog.tsx` - Project selection dialog

## Prerequisites

- [ ] Ensure TanStack Table DataTable component system is functional in `components/ui/table/`
- [ ] Verify existing `useProjects` hook works correctly for project dropdown population
- [ ] Confirm `createOverride` IPC handler is working for the "Create Project Copy" action
- [ ] Review agents repository to understand available query methods

## Implementation Steps

### Step 1: Add New IPC Channels for Agent Move and Copy Operations

**What**: Add the `agent:move` and `agent:copyToProject` channel definitions to both channel files.

**Why**: The new row actions require backend IPC handlers that need registered channels before implementation.

**Confidence**: High

**Files**:
- `electron/ipc/channels.ts` - Add `move` and `copyToProject` channels to the agent object
- `electron/preload.ts` - Add matching channels in the duplicated IpcChannels constant

**Changes**:
1. Add `move: "agent:move"` to the agent object in IpcChannels
2. Add `copyToProject: "agent:copyToProject"` to the agent object in IpcChannels
3. Replicate the same additions in preload.ts IpcChannels constant

**Validation Commands**:
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] Channel constants added to both files in alphabetical order
- [ ] No TypeScript errors related to channel definitions
- [ ] All validation commands pass

---

### Step 2: Implement IPC Handlers for Move and Copy Operations

**What**: Add handler implementations for `agent:move` and `agent:copyToProject` in the agent handlers file.

**Why**: These handlers enable reassigning an agent to a different project and creating a project-scoped copy of an agent.

**Confidence**: High

**Files**:
- `electron/ipc/agent.handlers.ts` - Add two new handler registrations

**Changes**:
1. Add `agent:move` handler that updates an agent's `projectId` field with validation for agent existence and project validity
2. Add `agent:copyToProject` handler that duplicates an agent (similar to existing `duplicate` handler) but sets a specific `projectId` and copies tools/skills
3. Both handlers should return `AgentOperationResult` for consistent error handling
4. Register both handlers within `registerAgentHandlers` function

**Validation Commands**:
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] Move handler validates agent exists and updates projectId correctly
- [ ] CopyToProject handler creates a new agent with tools and skills copied
- [ ] Error handling returns meaningful messages for validation failures
- [ ] All validation commands pass

---

### Step 3: Update Preload API and Type Definitions

**What**: Add the `move` and `copyToProject` methods to the ElectronAPI interface and preload implementation.

**Why**: The renderer process needs typed access to these new IPC handlers through the context bridge.

**Confidence**: High

**Files**:
- `electron/preload.ts` - Add method implementations to electronAPI.agent object
- `types/electron.d.ts` - Add method signatures to ElectronAPI.agent interface

**Changes**:
1. Add `move(id: number, projectId: number | null): Promise<AgentOperationResult>` to ElectronAPI.agent interface
2. Add `copyToProject(id: number, projectId: number): Promise<AgentOperationResult>` to ElectronAPI.agent interface
3. Implement both methods in preload.ts electronAPI.agent object using ipcRenderer.invoke

**Validation Commands**:
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] Type definitions match handler parameter signatures
- [ ] Preload implementations invoke correct IPC channels
- [ ] ElectronAPI type is fully consistent across both files
- [ ] All validation commands pass

---

### Step 4: Update Query Key Factory and Add Unified Query Hook

**What**: Add an `all` query key to the agent keys factory and create `useAllAgents` hook for fetching all agents without scope filtering.

**Why**: The unified table view needs to fetch all agents (global and project-scoped) in a single query with proper cache invalidation support.

**Confidence**: High

**Files**:
- `lib/queries/agents.ts` - Add `all` query key with optional filters
- `hooks/queries/use-agents.ts` - Add `useAllAgents`, `useMoveAgent`, and `useCopyAgentToProject` hooks

**Changes**:
1. Add `all: (filters?: { includeBuiltIn?: boolean; includeDeactivated?: boolean }) => [{ filters }]` to agentKeys
2. Create `useAllAgents` hook that calls `api.agent.list()` without scope filtering
3. Create `useMoveAgent` mutation hook that calls the new move API method
4. Create `useCopyAgentToProject` mutation hook that calls the new copyToProject API method
5. Add proper cache invalidation for both mutations (invalidate all agent-related queries)

**Validation Commands**:
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] Query key factory includes `all` key for unified queries
- [ ] `useAllAgents` returns all agents regardless of project scope
- [ ] Mutation hooks properly invalidate caches including `list`, `all`, `global`, `projectScoped`, and `byProject` keys
- [ ] All validation commands pass

---

### Step 5: Create Unified Agent Table Columns Definition

**What**: Refactor `AgentTable` component to include all required columns for the unified view including project scope, tool count, skill count, and timestamps.

**Why**: The new design requires displaying project scope information and counts that were previously not shown in the table.

**Confidence**: Medium

**Files**:
- `components/agents/agent-table.tsx` - Expand column definitions and add project name resolution

**Changes**:
1. Add `projectId` accessor column that displays "Global" for null or resolves project name via projects query
2. Add `toolCount` display column (requires extending Agent type or computing from relation query)
3. Add `skillCount` display column (requires extending Agent type or computing from relation query)
4. Add `createdAt` accessor column with date formatting
5. Add `updatedAt` accessor column with date formatting
6. Update name column to include color indicator using `getAgentColorClass` with `agentColors` schema reference
7. Update type column to use badge variants for planning/specialist/review
8. Add `rowStyleCallback` implementation for built-in agent row styling (subtle background difference)
9. Update row actions to include "Create Project Copy", "Move to Project", and "Copy to Project" actions conditionally
10. Remove `selectedProjectId` prop dependency for override action (now based on agent's own scope)

**Validation Commands**:
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] All specified columns render correctly
- [ ] Project name displays correctly for project-scoped agents
- [ ] Built-in agents have subtle distinct styling
- [ ] New row actions appear conditionally based on agent type
- [ ] All validation commands pass

---

### Step 6: Update AgentEditorDialog with Project Assignment Field

**What**: Add a project assignment dropdown to the agent editor dialog for both create and edit modes.

**Why**: Users need the ability to assign or reassign agents to projects directly from the edit dialog.

**Confidence**: High

**Files**:
- `components/agents/agent-editor-dialog.tsx` - Add project assignment field with "Global (all projects)" option

**Changes**:
1. Import `useProjects` hook to fetch available projects
2. Add `projectId` field to the form schema for create mode
3. Add a SelectField component after the type field (create mode) or in the info section (edit mode)
4. First option should be "Global (all projects)" with value null
5. Subsequent options should be project names with project IDs as values
6. For edit mode, show current project assignment and allow changing (triggers move operation)
7. Handle project change in edit mode by calling `useMoveAgent` mutation

**Validation Commands**:
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] Project dropdown appears in both create and edit modes
- [ ] "Global (all projects)" is the first option
- [ ] Projects list populates from useProjects query
- [ ] Changing project in edit mode calls move mutation
- [ ] All validation commands pass

---

### Step 7: Create Toolbar Content Component with Faceted Filters

**What**: Create a dedicated toolbar content component for the agents table with type filter, project filter, status filter, and toggle switches.

**Why**: The DataTable toolbar accepts a `toolbarContent` prop for custom controls that need to be implemented separately from the core DataTable.

**Confidence**: Medium

**Files**:
- `components/agents/agent-table-toolbar.tsx` (NEW) - Toolbar content component

**Changes**:
1. Create component that accepts filter state and callbacks as props
2. Add type filter dropdown (All types / Planning / Specialist / Review)
3. Add project filter dropdown (All projects / Global only / [Project names...])
4. Add status filter dropdown (All statuses / Active / Inactive)
5. Add "Show built-in" toggle switch
6. Add "Show deactivated" toggle switch
7. Style consistently with existing DataTable toolbar patterns
8. Export component for use in agents page

**Validation Commands**:
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] All filter dropdowns render and function correctly
- [ ] Toggle switches control built-in and deactivated visibility
- [ ] Component integrates with DataTable's toolbarContent slot
- [ ] All validation commands pass

---

### Step 8: Redesign Agents Page with Unified DataTable

**What**: Complete redesign of the agents page to use a single DataTable with the new unified query and toolbar.

**Why**: This is the core UI change that replaces the tab-based interface with the unified table view.

**Confidence**: Medium

**Files**:
- `app/(app)/agents/page.tsx` - Complete page rewrite

**Changes**:
1. Remove all tab-related imports (TabsRoot, TabsList, TabsPanel, TabsTrigger, TabsIndicator)
2. Remove GlobalAgentsTabContent and ProjectAgentsTabContent imports
3. Remove AgentLayoutToggle import
4. Remove useAgentLayoutStore import
5. Replace dual queries with single `useAllAgents` hook
6. Add filter state management for type, project, status using useState or nuqs
7. Add state for showBuiltIn and showDeactivated toggles
8. Implement client-side filtering based on filter state
9. Integrate AgentTable with toolbarContent from agent-table-toolbar
10. Update page header to remove tab-specific context
11. Update Create Agent button to open dialog without tab-based projectId
12. Keep keyboard shortcuts for create agent
13. Implement delete confirmation dialog integration
14. Implement edit dialog state management for row actions

**Validation Commands**:
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] Page renders unified table with all agents
- [ ] Filters correctly narrow down displayed agents
- [ ] Toggle switches control visibility of built-in and deactivated agents
- [ ] All CRUD operations work correctly
- [ ] All validation commands pass

---

### Step 9: Implement Project Selection Dialog for Move/Copy Actions

**What**: Create a dialog component for selecting a target project when using Move to Project or Copy to Project actions.

**Why**: These actions require user selection of a target project before executing the operation.

**Confidence**: High

**Files**:
- `components/agents/select-project-dialog.tsx` (NEW) - Dialog for project selection

**Changes**:
1. Create dialog component with project list from useProjects
2. Add "Global" option for moving to global scope
3. Include selected agent name in dialog title for context
4. Add confirm and cancel buttons
5. Return selected project ID via onConfirm callback
6. Handle loading state while projects query loads

**Validation Commands**:
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] Dialog displays list of available projects
- [ ] Global option is available for move action
- [ ] Selection triggers appropriate callback with project ID
- [ ] All validation commands pass

---

### Step 10: Delete Deprecated Components and Store

**What**: Remove the tab content components, layout toggle, layout renderer, and layout store that are no longer needed.

**Why**: The unified table approach eliminates the need for layout switching and separate tab content components.

**Confidence**: High

**Files to Delete**:
- `components/agents/global-agents-tab-content.tsx`
- `components/agents/project-agents-tab-content.tsx`
- `components/agents/agent-layout-toggle.tsx`
- `components/agents/agent-layout-renderer.tsx`
- `lib/stores/agent-layout-store.ts`

**Files to Modify**:
- `lib/layout/constants.ts` - Remove agent layout constants if not used elsewhere

**Changes**:
1. Delete the five files listed above
2. Verify no remaining imports reference these files
3. Remove any unused exports from constants.ts related to agent layouts
4. Check for any other files importing these components and update them

**Validation Commands**:
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] All deprecated files are deleted
- [ ] No broken imports anywhere in the codebase
- [ ] TypeScript compilation succeeds
- [ ] All validation commands pass

---

## Quality Gates

### Gate 1: After Step 4 (Backend Complete)
- [ ] All IPC handlers respond correctly when tested manually
- [ ] Type definitions are consistent across all files
- [ ] `pnpm run typecheck` passes with no errors
- [ ] `pnpm run lint:fix` passes with no errors

### Gate 2: After Step 8 (UI Complete)
- [ ] Page renders without errors in Electron dev mode
- [ ] All filter combinations work correctly
- [ ] CRUD operations function correctly (create, edit, delete, activate/deactivate)
- [ ] Row actions trigger appropriate dialogs and mutations
- [ ] `pnpm run typecheck` passes with no errors
- [ ] `pnpm run lint:fix` passes with no errors

### Gate 3: After Step 10 (Cleanup Complete)
- [ ] No TypeScript errors related to missing imports
- [ ] Application starts and runs without console errors
- [ ] All agent management features work end-to-end
- [ ] `pnpm run typecheck` passes with no errors
- [ ] `pnpm run lint:fix` passes with no errors

## Notes

- The `agent:move` handler should validate that the target project exists before updating
- When moving an agent from global to project scope, verify no naming conflicts exist
- The unified query should be careful about performance with large agent lists - consider implementing server-side filtering if needed in the future
- The `rowStyleCallback` for built-in agents should use a subtle visual distinction (e.g., slightly different background) rather than opacity to maintain readability
- Consider adding a confirmation dialog for the Move to Project action since it changes agent scope
- The project filter dropdown should include a count of agents per project option for quick reference
- Preserve the keyboard shortcut (Ctrl+N) for creating new agents
- The tool and skill counts require either extending the agent list query to include counts or making separate queries - evaluate performance implications

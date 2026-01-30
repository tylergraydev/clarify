# Step 2: AI-Powered File Discovery

**Started**: 2026-01-30T00:02:00.000Z
**Completed**: 2026-01-30T00:03:00.000Z
**Duration**: ~60 seconds
**Status**: Completed

---

## Input

### Refined Request Used

Redesign the agent management page at `app/(app)/agents/page.tsx` to replace the current dual-tab interface (Global Agents / Project Agents implemented via `GlobalAgentsTabContent` and `ProjectAgentsTabContent` components) with a unified DataTable view that displays all agents together, leveraging the existing DataTable component system in `components/ui/table/`. The new implementation should define column definitions using TanStack Table's `DataTableColumnDef` type for columns including: name with color indicator using the existing `agentColors` from the schema, type displayed as a badge (planning/specialist/review), project scope showing "Global" for agents where `projectId` is null or the project name for project-specific agents, status as an active/inactive toggle based on `deactivatedAt`, created and modified timestamps (`createdAt`/`updatedAt`), tool count from the `agent_tools` relation, skill count from the `agent_skills` relation, and an actions column with a dropdown menu. The toolbar should provide global search across name/description using the DataTable's built-in global filter, faceted filters for type, project (including a "Global only" option), and status, plus toggle switches for showing/hiding built-in agents (those with `builtInAt` set) and deactivated agents, utilizing the `DataTableToolbar` component's `toolbarContent` slot. Apply subtle distinct row styling for built-in agents using the `rowStyleCallback` prop. The agent editor dialog (`AgentEditorDialog`) must be updated to include a project assignment dropdown field with "Global (all projects)" as the first option followed by available projects from the projects query. Introduce three new row actions in addition to the existing Edit, Duplicate, Delete, Activate/Deactivate, and Reset actions: "Create Project Copy" (only for global agents) which creates a project-scoped copy using the existing `createOverride` IPC handler and auto-opens the edit dialog, "Move to Project" which reassigns an agent to a different project requiring a new `agent:move` IPC handler in `electron/ipc/agent.handlers.ts` and corresponding mutation hook in `hooks/queries/use-agents.ts`, and "Copy to Project" which duplicates an agent to a selected project. The data layer needs a new unified query hook (e.g., `useAllAgents`) that fetches all agents in a single query without scope filtering, with the TanStack Query key factory in `lib/queries/agents.ts` updated accordingly to support proper cache invalidation when agents move between scopes. Remove the `TabsRoot`, `GlobalAgentsTabContent`, `ProjectAgentsTabContent` components, the `AgentLayoutToggle` component and its associated store (`agent-layout-store`), and the card/list layout options since the table-only approach eliminates the need for layout switching.

---

## Discovery Summary

| Category | Count |
|----------|-------|
| **Total files discovered** | 34 |
| Critical | 9 |
| High | 11 |
| Medium | 9 |
| Low | 5 |

---

## Critical Files (9)

### 1. `app/(app)/agents/page.tsx`
- **Relevance**: Main page file that needs complete redesign from dual-tab interface to unified DataTable view
- **Changes needed**: Remove TabsRoot, GlobalAgentsTabContent, ProjectAgentsTabContent components; Replace with single DataTable; Update toolbar with new filters (type, project, status); Add toggle switches for built-in/deactivated; Update state management from tab-based to unified
- **Related to**: global-agents-tab-content.tsx, project-agents-tab-content.tsx, agent-layout-toggle.tsx, agent-layout-store.ts, use-agents.ts

### 2. `components/agents/agent-editor-dialog.tsx`
- **Relevance**: Must be updated to include project assignment dropdown field
- **Changes needed**: Add SelectField for project assignment with "Global (all projects)" as first option followed by available projects from useProjects query; Update form schema to include projectId field for create/edit modes
- **Related to**: use-projects.ts, agent validations, agents.schema.ts

### 3. `hooks/queries/use-agents.ts`
- **Relevance**: Need to add new useAllAgents hook and useMoveAgent mutation hook
- **Changes needed**: Add useAllAgents() hook that fetches all agents without scope filtering; Add useMoveAgent mutation for new agent:move IPC handler; Add useCopyToProject mutation for copying agents to projects; Update cache invalidation patterns
- **Related to**: agents.ts (query keys), agent.handlers.ts, preload.ts, electron.d.ts

### 4. `lib/queries/agents.ts`
- **Relevance**: Query key factory needs update for new unified query
- **Changes needed**: Add "all" query key for unified agent fetching; Ensure proper cache invalidation when agents move between scopes
- **Related to**: use-agents.ts

### 5. `electron/ipc/agent.handlers.ts`
- **Relevance**: Need to add new agent:move IPC handler for "Move to Project" action
- **Changes needed**: Add new handler for agent:move that updates agent's projectId; Add handler for agent:copyToProject; Implement validation logic for project assignment changes
- **Related to**: channels.ts, preload.ts, agents.repository.ts

### 6. `electron/ipc/channels.ts`
- **Relevance**: Need to add new IPC channel for agent:move operation
- **Changes needed**: Add move: "agent:move" and copyToProject: "agent:copyToProject" to agent channels object
- **Related to**: preload.ts (must be kept in sync), agent.handlers.ts

### 7. `electron/preload.ts`
- **Relevance**: Must be synchronized with channels.ts; Need to add move and copyToProject methods to agent API
- **Changes needed**: Add move channel to IpcChannels.agent; Add move() and copyToProject() methods to electronAPI.agent object
- **Related to**: channels.ts, electron.d.ts

### 8. `types/electron.d.ts`
- **Relevance**: TypeScript type definitions for ElectronAPI need updating
- **Changes needed**: Add move(id: number, projectId: number | null) method signature to agent interface; Add copyToProject method signature
- **Related to**: preload.ts, use-agents.ts

### 9. `components/agents/agent-table.tsx`
- **Relevance**: Existing table component that serves as pattern reference and will be enhanced/replaced
- **Changes needed**: Major refactoring to support unified view; Add new columns (project scope with project name, tool count, skill count, created/updated timestamps); Add new row actions ("Create Project Copy", "Move to Project", "Copy to Project"); Implement rowStyleCallback for built-in agent styling
- **Related to**: DataTable components, use-agents.ts, use-projects.ts

---

## High Priority Files (11)

### 1. `components/agents/global-agents-tab-content.tsx`
- **Relevance**: Component to be removed; Logic patterns needed for reference
- **Changes needed**: DELETE - functionality will be merged into unified page.tsx
- **Related to**: page.tsx, agent-layout-renderer.tsx

### 2. `components/agents/project-agents-tab-content.tsx`
- **Relevance**: Component to be removed; Logic patterns needed for reference
- **Changes needed**: DELETE - functionality will be merged into unified page.tsx
- **Related to**: page.tsx, agent-layout-renderer.tsx

### 3. `components/agents/agent-layout-toggle.tsx`
- **Relevance**: Component to be removed as table-only approach eliminates layout switching
- **Changes needed**: DELETE - no longer needed with unified table view
- **Related to**: page.tsx, agent-layout-store.ts

### 4. `lib/stores/agent-layout-store.ts`
- **Relevance**: Zustand store to be removed as layout switching is eliminated
- **Changes needed**: DELETE - no longer needed; showBuiltIn and showDeactivated preferences should move to URL state or separate store
- **Related to**: agent-layout-toggle.tsx, page.tsx, agent-layout-renderer.tsx

### 5. `components/agents/agent-layout-renderer.tsx`
- **Relevance**: Component to be removed as it conditionally renders card/list/table views
- **Changes needed**: DELETE - replaced by direct DataTable usage
- **Related to**: global-agents-tab-content.tsx, project-agents-tab-content.tsx, agent-layout-store.ts

### 6. `db/repositories/agents.repository.ts`
- **Relevance**: May need new findAll method that fetches all agents without filtering or update existing method
- **Changes needed**: Verify findAll supports fetching all agents without scope filter; May need to add findWithRelations to include tool/skill counts
- **Related to**: agent.handlers.ts, agents.schema.ts

### 7. `db/schema/agents.schema.ts`
- **Relevance**: Schema defines agentColors and agentTypes used in column definitions
- **Changes needed**: None expected; Reference for type constants
- **Related to**: agent-colors.ts, agent-table.tsx

### 8. `lib/colors/agent-colors.ts`
- **Relevance**: Color utilities needed for name column color indicator
- **Changes needed**: None expected; Reference for color display
- **Related to**: agents.schema.ts, agent-table.tsx

### 9. `components/ui/table/data-table.tsx`
- **Relevance**: Core DataTable component to be used for unified view
- **Changes needed**: None expected; Pattern reference for DataTable usage
- **Related to**: types.ts, data-table-toolbar.tsx

### 10. `components/ui/table/types.ts`
- **Relevance**: DataTableColumnDef type and other types needed for column definitions
- **Changes needed**: None expected; Type imports for column definitions
- **Related to**: data-table.tsx, agent-table.tsx

### 11. `components/ui/table/data-table-toolbar.tsx`
- **Relevance**: Toolbar component with toolbarContent slot for custom filters
- **Changes needed**: None expected; Pattern reference for toolbar customization
- **Related to**: data-table.tsx

---

## Medium Priority Files (9)

### 1. `hooks/queries/use-projects.ts`
- **Relevance**: useProjects hook needed for project dropdown in editor dialog and project faceted filter
- **Changes needed**: None expected; Reference for project data fetching
- **Related to**: agent-editor-dialog.tsx, page.tsx

### 2. `hooks/queries/use-agent-tools.ts`
- **Relevance**: useAgentTools hook needed for tool count column
- **Changes needed**: None expected; May need batch query for multiple agents
- **Related to**: agent-table.tsx

### 3. `hooks/queries/use-agent-skills.ts`
- **Relevance**: useAgentSkills hook needed for skill count column
- **Changes needed**: None expected; May need batch query for multiple agents
- **Related to**: agent-table.tsx

### 4. `lib/layout/constants.ts`
- **Relevance**: Contains AgentLayout type and storage keys that may need removal/update
- **Changes needed**: May need to keep showBuiltIn and showDeactivated keys; Remove layout-related constants
- **Related to**: agent-layout-store.ts

### 5. `components/agents/confirm-delete-agent-dialog.tsx`
- **Relevance**: Delete confirmation dialog used in row actions
- **Changes needed**: None expected; Continues to be used
- **Related to**: agent-table.tsx

### 6. `components/agents/confirm-reset-agent-dialog.tsx`
- **Relevance**: Reset confirmation dialog used in row actions
- **Changes needed**: None expected; Continues to be used
- **Related to**: agent-editor-dialog.tsx

### 7. `lib/stores/shell-store.ts`
- **Relevance**: Contains selectedProjectId used for project context
- **Changes needed**: None expected; Reference for project selection state
- **Related to**: page.tsx, global-agents-tab-content.tsx

### 8. `electron/ipc/index.ts`
- **Relevance**: IPC handler registration - may need update for new handlers
- **Changes needed**: Ensure new agent:move and agent:copyToProject handlers are registered
- **Related to**: agent.handlers.ts

### 9. `components/ui/form/select-field.tsx`
- **Relevance**: SelectField component for project assignment dropdown in editor dialog
- **Changes needed**: None expected; Pattern reference for form fields
- **Related to**: agent-editor-dialog.tsx

---

## Low Priority Files (5)

### 1. `components/ui/table/index.ts`
- **Relevance**: Barrel export for table components
- **Changes needed**: None expected; Import reference
- **Related to**: All table components

### 2. `components/ui/table/column-helpers.ts`
- **Relevance**: Column helper utilities for creating column definitions
- **Changes needed**: None expected; Pattern reference
- **Related to**: agent-table.tsx

### 3. `components/agents/agent-card.tsx`
- **Relevance**: Card view component that will no longer be used
- **Changes needed**: May be removed if card layout is fully eliminated
- **Related to**: agent-grid-item.tsx, agent-layout-renderer.tsx

### 4. `components/agents/agent-list.tsx`
- **Relevance**: List view component that will no longer be used
- **Changes needed**: May be removed if list layout is fully eliminated
- **Related to**: agent-layout-renderer.tsx

### 5. `components/agents/agent-grid-item.tsx`
- **Relevance**: Grid item component for card layout that will no longer be used
- **Changes needed**: May be removed if card layout is fully eliminated
- **Related to**: agent-card.tsx, agent-layout-renderer.tsx

---

## Pattern References

Files containing patterns to follow (no modifications expected):

| File | Pattern |
|------|---------|
| `components/ui/table/data-table-row-actions.tsx` | Row actions dropdown pattern |
| `components/ui/badge.tsx` | Badge variants for type/status display |
| `components/ui/switch.tsx` | Switch component for status toggle |
| `hooks/use-table-persistence.ts` | Table state persistence pattern |

---

## Files to Create

**None** - The implementation reuses existing components and adds functionality to existing files.

---

## Files to Delete

### Mandatory Deletions
1. `components/agents/global-agents-tab-content.tsx`
2. `components/agents/project-agents-tab-content.tsx`
3. `components/agents/agent-layout-toggle.tsx`
4. `components/agents/agent-layout-renderer.tsx`
5. `lib/stores/agent-layout-store.ts`

### Optional Deletions (if card/list layouts fully eliminated)
6. `components/agents/agent-card.tsx`
7. `components/agents/agent-list.tsx`
8. `components/agents/agent-grid-item.tsx`
9. `components/agents/agent-list-skeleton.tsx`
10. `lib/layout/constants.ts` (or partially remove layout-related constants)

---

## File Validation Results

| Validation | Result |
|------------|--------|
| Minimum files discovered | ✅ 34 files (≥10 required) |
| Critical files identified | ✅ 9 critical files |
| File categorization complete | ✅ All files categorized |
| Change descriptions provided | ✅ All files have change notes |
| Relationship mapping | ✅ Related files documented |

---

**MILESTONE:STEP_2_COMPLETE**

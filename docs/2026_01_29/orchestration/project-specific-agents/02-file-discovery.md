# Step 2: AI-Powered File Discovery

**Start Time**: 2026-01-29T00:02:00Z
**End Time**: 2026-01-29T00:03:30Z
**Duration**: ~90 seconds
**Status**: Completed

## Input: Refined Feature Request

The agent management page should be enhanced to support a dual-tier agent system that distinguishes between globally-available agents and project-specific agents through a tabbed interface. The implementation will use a two-tab design accessible from the agents page at app/(app)/agents/page.tsx, with the 'Global Agents' tab displaying organization-wide agents managed at a single configuration level and the 'Project Agents' tab showing agents specific to the currently-selected project, as determined by the ProjectSelector component in the sidebar.

## Discovery Process

- Explored 12 directories
- Examined 45 candidate files
- Found 16 highly relevant files
- Identified 14 supporting files

## File Discovery Summary

| Priority  | Count  | Description                         |
| --------- | ------ | ----------------------------------- |
| Critical  | 6      | Files that MUST be modified         |
| High      | 10     | Files that will likely need changes |
| Medium    | 8      | Files that may need updates         |
| Low       | 6      | Reference/pattern files             |
| **Total** | **30** |                                     |

---

## Critical Files (Must Modify)

### 1. `app/(app)/agents/page.tsx`

- **Priority**: Critical
- **Reason**: Main agents page that needs to be restructured with a tabbed interface (Global Agents / Project Agents tabs). Currently shows all agents without project scoping.
- **Action**: Modify
- **Current Functionality**: Single agent grid view with filtering by type and search. Uses `useAgents` hook without project filtering.
- **Required Changes**: Add tabs for Global vs Project agents, integrate with ProjectSelector state, filter agents by projectId

### 2. `db/repositories/agents.repository.ts`

- **Priority**: Critical
- **Reason**: Repository needs methods to support querying global agents (projectId=null) vs project-specific agents.
- **Action**: Modify
- **Current Functionality**: CRUD operations, filtering by projectId, type, and deactivatedAt. Has `findByProjectId`, `findAll`, `findActive` methods.
- **Required Changes**: Add methods for finding global-only agents, and combined global+project agents

### 3. `hooks/queries/use-agents.ts`

- **Priority**: Critical
- **Reason**: Query hooks need to support filtering for global vs project-specific agents.
- **Action**: Modify
- **Current Functionality**: All agent query/mutation hooks including `useAgents`, `useAgentsByProject`, `useActiveAgents`
- **Required Changes**: Add `useGlobalAgents` hook, modify existing hooks to support the dual-tier model

### 4. `lib/queries/agents.ts`

- **Priority**: Critical
- **Reason**: Query key factory needs keys for global agents and project-specific agent views.
- **Action**: Modify
- **Current Functionality**: Query keys for active, byProject, byType, detail, list, and builtIn.
- **Required Changes**: Add query keys for `global`, `byProjectWithGlobal` to support combined views

### 5. `electron/ipc/agent.handlers.ts`

- **Priority**: Critical
- **Reason**: IPC handlers need to support the new filtering patterns for global vs project-specific agents.
- **Action**: Modify
- **Current Functionality**: Handles agent CRUD operations, supports filters for includeDeactivated, projectId, type.
- **Required Changes**: May need new handlers or enhanced filtering for global-only queries

### 6. `lib/stores/shell-store.ts`

- **Priority**: Critical
- **Reason**: Shell store manages `selectedProjectId` which is essential for determining which project's agents to display.
- **Action**: Modify (minor)
- **Current Functionality**: Manages sidebar collapsed state, selectedProjectId, activeNavItem.
- **Required Changes**: Ensure proper integration with agents page for project-scoped queries

---

## High Priority Files

### 7. `components/ui/tabs.tsx`

- **Priority**: High
- **Reason**: Tabs component needed for the Global Agents / Project Agents tab interface.
- **Action**: Reference

### 8. `components/agents/agent-editor-dialog.tsx`

- **Priority**: High
- **Reason**: Dialog needs to support setting projectId when creating project-specific agents.
- **Action**: Modify
- **Required Changes**: Add projectId field for project-scoped agent creation

### 9. `components/agents/agent-card.tsx`

- **Priority**: High
- **Reason**: Card may need to display project scope indicator (global vs project-specific badge).
- **Action**: Modify
- **Required Changes**: Add project scope badge/indicator

### 10. `db/schema/agents.schema.ts`

- **Priority**: High
- **Reason**: Schema already has `projectId` field but need to verify it supports the dual-tier model correctly.
- **Action**: Verify/Reference

### 11. `components/shell/project-selector.tsx`

- **Priority**: High
- **Reason**: ProjectSelector updates selectedProjectId in shell store.
- **Action**: Reference

### 12. `types/electron.d.ts`

- **Priority**: High
- **Reason**: Type definitions may need updates if new IPC methods or filter options are added.
- **Action**: Modify (if IPC changes)

### 13. `electron/preload.ts`

- **Priority**: High
- **Reason**: If IPC handlers change, preload script needs synchronized updates.
- **Action**: Modify (if IPC changes)

### 14. `lib/validations/agent.ts`

- **Priority**: High
- **Reason**: Validation schemas may need updates for project-scoped agent creation.
- **Action**: Modify (minor)

### 15. `hooks/queries/use-projects.ts`

- **Priority**: High
- **Reason**: Used to fetch projects for the ProjectSelector and to verify selected project exists.
- **Action**: Reference

### 16. `electron/ipc/channels.ts`

- **Priority**: High
- **Reason**: IPC channel definitions - may need new channels if handler changes require them.
- **Action**: Reference/Modify (if new channels needed)

---

## Medium Priority Files

### 17. `components/agents/confirm-delete-agent-dialog.tsx`

- **Priority**: Medium
- **Reason**: May need to show project context when deleting project-specific agents.
- **Action**: Reference

### 18. `components/agents/confirm-reset-agent-dialog.tsx`

- **Priority**: Medium
- **Reason**: Reset dialog for agents - may need context about what happens to project overrides.
- **Action**: Reference

### 19. `components/agents/agent-color-picker.tsx`

- **Priority**: Medium
- **Reason**: Color picker component used in agent editor - reference only.
- **Action**: Reference

### 20. `components/agents/agent-skills-manager.tsx`

- **Priority**: Medium
- **Reason**: Manages agent skills in edit dialog - may need awareness of project scope.
- **Action**: Reference

### 21. `components/agents/agent-tools-manager.tsx`

- **Priority**: Medium
- **Reason**: Manages agent tools in edit dialog - may need awareness of project scope.
- **Action**: Reference

### 22. `db/schema/projects.schema.ts`

- **Priority**: Medium
- **Reason**: Projects schema defines the project entity that agents reference.
- **Action**: Reference

### 23. `components/shell/app-sidebar.tsx`

- **Priority**: Medium
- **Reason**: Contains ProjectSelector component placement.
- **Action**: Reference

### 24. `lib/queries/index.ts`

- **Priority**: Medium
- **Reason**: Query key exports - verify agent keys are properly exported.
- **Action**: Reference

---

## Low Priority Files (Reference/Patterns)

### 25. `components/ui/dialog.tsx`

- **Priority**: Low
- **Reason**: Dialog primitives used by agent dialogs - reference for patterns.
- **Action**: Reference

### 26. `components/ui/badge.tsx`

- **Priority**: Low
- **Reason**: Badge component for showing agent type/status - may add project scope badge.
- **Action**: Reference

### 27. `components/ui/card.tsx`

- **Priority**: Low
- **Reason**: Card primitives used by AgentCard - reference.
- **Action**: Reference

### 28. `components/ui/select.tsx`

- **Priority**: Low
- **Reason**: Select component used in filters - reference.
- **Action**: Reference

### 29. `components/ui/button.tsx`

- **Priority**: Low
- **Reason**: Button component - reference.
- **Action**: Reference

### 30. `components/ui/empty-state.tsx`

- **Priority**: Low
- **Reason**: Empty state component for when no agents exist.
- **Action**: Reference

---

## Architecture Insights

### Key Patterns Discovered

1. **Repository Pattern**: Database access is abstracted through typed repository classes in `db/repositories/`. The `AgentsRepository` already supports `projectId` filtering.

2. **Query Key Factory Pattern**: Uses `@lukemorales/query-key-factory` for TanStack Query key management in `lib/queries/`.

3. **Shell Store Pattern**: Zustand store manages `selectedProjectId` which can be subscribed to for reactive project-scoped queries.

4. **IPC Handler Pattern**: Domain-organized handlers in `electron/ipc/` with channels defined in `channels.ts`.

5. **CVA Component Pattern**: UI components use class-variance-authority for styling with Base UI primitives.

### Existing Similar Functionality

- **Project filtering**: Already implemented in workflows and templates pages
- **Tabs UI**: Tabs component already exists at `components/ui/tabs.tsx`
- **Project selector integration**: Already integrated in sidebar with shell store

### Integration Points Identified

1. **ProjectSelector -> Shell Store -> Agents Page**: Project changes in sidebar should trigger agent list refresh
2. **Agent Repository -> IPC Handlers -> Query Hooks**: Filtering logic flows through this chain
3. **Tabs Component -> Agent Lists**: Two separate query patterns for global vs project tabs

---

## File Validation Results

All discovered file paths validated to exist in the codebase.

---

**MILESTONE:STEP_2_COMPLETE**

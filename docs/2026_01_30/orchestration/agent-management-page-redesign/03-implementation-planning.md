# Step 3: Implementation Planning

**Started**: 2026-01-30T00:03:30.000Z
**Completed**: 2026-01-30T00:04:30.000Z
**Duration**: ~60 seconds
**Status**: Completed

---

## Input

### Refined Request

Redesign the agent management page at `app/(app)/agents/page.tsx` to replace the current dual-tab interface (Global Agents / Project Agents implemented via `GlobalAgentsTabContent` and `ProjectAgentsTabContent` components) with a unified DataTable view that displays all agents together, leveraging the existing DataTable component system in `components/ui/table/`. The new implementation should define column definitions using TanStack Table's `DataTableColumnDef` type for columns including: name with color indicator using the existing `agentColors` from the schema, type displayed as a badge (planning/specialist/review), project scope showing "Global" for agents where `projectId` is null or the project name for project-specific agents, status as an active/inactive toggle based on `deactivatedAt`, created and modified timestamps (`createdAt`/`updatedAt`), tool count from the `agent_tools` relation, skill count from the `agent_skills` relation, and an actions column with a dropdown menu. The toolbar should provide global search across name/description using the DataTable's built-in global filter, faceted filters for type, project (including a "Global only" option), and status, plus toggle switches for showing/hiding built-in agents (those with `builtInAt` set) and deactivated agents, utilizing the `DataTableToolbar` component's `toolbarContent` slot. Apply subtle distinct row styling for built-in agents using the `rowStyleCallback` prop. The agent editor dialog (`AgentEditorDialog`) must be updated to include a project assignment dropdown field with "Global (all projects)" as the first option followed by available projects from the projects query. Introduce three new row actions in addition to the existing Edit, Duplicate, Delete, Activate/Deactivate, and Reset actions: "Create Project Copy" (only for global agents) which creates a project-scoped copy using the existing `createOverride` IPC handler and auto-opens the edit dialog, "Move to Project" which reassigns an agent to a different project requiring a new `agent:move` IPC handler in `electron/ipc/agent.handlers.ts` and corresponding mutation hook in `hooks/queries/use-agents.ts`, and "Copy to Project" which duplicates an agent to a selected project. The data layer needs a new unified query hook (e.g., `useAllAgents`) that fetches all agents in a single query without scope filtering, with the TanStack Query key factory in `lib/queries/agents.ts` updated accordingly to support proper cache invalidation when agents move between scopes. Remove the `TabsRoot`, `GlobalAgentsTabContent`, `ProjectAgentsTabContent` components, the `AgentLayoutToggle` component and its associated store (`agent-layout-store`), and the card/list layout options since the table-only approach eliminates the need for layout switching.

### Discovered Files Analysis

- **Critical Files**: 9 files (must modify)
- **High Priority Files**: 11 files (to delete or reference)
- **Medium Priority Files**: 9 files (reference patterns)
- **Low Priority Files**: 5 files

---

## Agent Prompt Sent

```
You are an implementation planner agent. Generate a detailed implementation plan in MARKDOWN format (NOT XML) for the following feature.

[Full refined request and discovered files included]

Required Output Format:
- Markdown with specific sections (Overview, Quick Summary, Prerequisites, Implementation Steps, Quality Gates, Notes)
- Each step must include: What, Why, Confidence, Files, Changes, Validation Commands, Success Criteria
- Include `pnpm run lint:fix && pnpm run typecheck` validation for EVERY step
- No code examples - only describe what changes to make
```

---

## Agent Response

The implementation planner generated a comprehensive 10-step plan covering:

1. **Step 1**: Add New IPC Channels (channels.ts, preload.ts)
2. **Step 2**: Implement IPC Handlers (agent.handlers.ts)
3. **Step 3**: Update Preload API and Types (preload.ts, electron.d.ts)
4. **Step 4**: Update Query Key Factory and Add Hooks (agents.ts, use-agents.ts)
5. **Step 5**: Create Unified Agent Table Columns (agent-table.tsx)
6. **Step 6**: Update AgentEditorDialog (agent-editor-dialog.tsx)
7. **Step 7**: Create Toolbar Content Component (new file)
8. **Step 8**: Redesign Agents Page (page.tsx)
9. **Step 9**: Implement Project Selection Dialog (new file)
10. **Step 10**: Delete Deprecated Components (5 files)

---

## Validation Results

| Check | Result |
|-------|--------|
| Format (Markdown) | ✅ Pass |
| Required sections present | ✅ Pass |
| All steps have validation commands | ✅ Pass |
| No code examples | ✅ Pass |
| Logical step ordering | ✅ Pass |
| Quality gates included | ✅ Pass |
| Actionable steps | ✅ Pass |

### Plan Statistics

| Metric | Value |
|--------|-------|
| Total Steps | 10 |
| Files to Modify | 12 |
| Files to Create | 2 |
| Files to Delete | 5 |
| Quality Gates | 3 |
| Complexity | High |
| Risk Level | Medium |

---

## Complexity Assessment

The plan is rated **High Complexity** due to:
- Cross-cutting changes spanning IPC layer, query layer, and UI layer
- New dialog components required
- Multiple mutation hooks with cache invalidation
- Page-level architectural change from tabs to unified table
- 5 component deletions requiring careful import cleanup

---

**MILESTONE:STEP_3_COMPLETE**

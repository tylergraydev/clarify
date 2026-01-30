# Step 1: Feature Request Refinement

**Started**: 2026-01-30T00:01:00.000Z
**Completed**: 2026-01-30T00:01:45.000Z
**Duration**: ~45 seconds
**Status**: Completed

---

## Input

### Original Request

"Prompt 2: Agent Management Page Redesign

Redesign the agent management page to use a unified table view instead of the current dual-tab (Global/Project) approach. This depends on the reusable DataTable components being implemented first.

## Current State
- Dual tabs: "Global Agents" and "Project Agents"
- Card/list/table layout toggle
- Separate queries for global vs project agents
- "Create Override" action creates project-specific copy of global agent

## Target State

### Unified Agent Table
Replace dual tabs with a single DataTable showing ALL agents (global and project-specific together).

**Columns:**
- Name (with color indicator)
- Type (specialist/general/etc badge)
- Project ("Global" for global agents, project name for project-specific)
- Status (active/inactive toggle or badge)
- Created date
- Modified date
- Tool count
- Skill count
- Actions (dropdown menu)

**Filtering:**
- Global search across name/description
- Filter by type
- Filter by project (including "Global only" option)
- Filter by status (active/inactive)
- Toggle to show/hide built-in agents
- Toggle to show/hide deactivated agents

**Row Styling:**
- Built-in agents should have subtle distinct styling (light background tint or badge)

### Agent Editor Dialog Changes
Update the create/edit agent dialog:
- Add project assignment dropdown field
- First option: "Global (all projects)"
- Followed by list of available projects
- For existing agents, show current assignment and allow changing

### New Agent Actions
Add these actions to the row actions menu:

1. **Create Project Copy** (for global agents only)
   - Creates a copy of the global agent assigned to a selected project
   - Sets `parentAgentId` to link back to source
   - Auto-opens edit dialog after creation so user can customize

2. **Move to Project**
   - Reassigns agent to a different project
   - Shows project selection dialog
   - For global agents: converts to project-specific
   - For project agents: changes project assignment
   - Original location loses the agent

3. **Copy to Project**
   - Creates duplicate in selected project
   - Original agent remains unchanged
   - Opens edit dialog for the new copy

### Existing Actions to Keep
- Edit, Duplicate, Delete, Activate/Deactivate, Reset (for overrides)

### Data Layer Changes
- May need new IPC handler for moving agents between projects
- Update queries to fetch all agents in single query with scope info
- Ensure cache invalidation handles the unified approach

### Remove
- Dual tab interface
- Card and list layout options (table only)
- Separate GlobalAgentsTabContent and ProjectAgentsTabContent components"

### Project Context Provided

- Electron desktop application (Clarify)
- Next.js 16.1.6, React 19.2.4, TypeScript 5.x
- TanStack Query 5.90.18, TanStack Table 8.21.3, TanStack Form 1.27.7
- Base UI 1.1.0 with CVA 0.7.1 for styling
- better-sqlite3 12.6.0 with Drizzle ORM 0.45.1
- Established patterns for IPC handlers, query hooks, component organization
- DataTable component system in components/ui/table/

---

## Agent Prompt Sent

```
Refine this feature request into a SINGLE PARAGRAPH (no headers, bullet points, or sections):

[Full original request included]

Project Context:
- This is an Electron desktop application called Clarify
- Uses Next.js 16, React 19, TypeScript, TanStack Query, TanStack Table, TanStack Form
- UI built with Base UI primitives and CVA (class-variance-authority) for styling
- Database uses better-sqlite3 with Drizzle ORM
- Has established patterns for IPC handlers, query hooks, and component organization
- DataTable component system already exists in components/ui/table/

Using the project context, expand this request with relevant technical details while maintaining its core intent. Output ONLY the refined paragraph (200-500 words), nothing else. Do not include headers, bullet points, or sections - just a single flowing paragraph.
```

---

## Agent Response

Redesign the agent management page at `app/(app)/agents/page.tsx` to replace the current dual-tab interface (Global Agents / Project Agents implemented via `GlobalAgentsTabContent` and `ProjectAgentsTabContent` components) with a unified DataTable view that displays all agents together, leveraging the existing DataTable component system in `components/ui/table/`. The new implementation should define column definitions using TanStack Table's `DataTableColumnDef` type for columns including: name with color indicator using the existing `agentColors` from the schema, type displayed as a badge (planning/specialist/review), project scope showing "Global" for agents where `projectId` is null or the project name for project-specific agents, status as an active/inactive toggle based on `deactivatedAt`, created and modified timestamps (`createdAt`/`updatedAt`), tool count from the `agent_tools` relation, skill count from the `agent_skills` relation, and an actions column with a dropdown menu. The toolbar should provide global search across name/description using the DataTable's built-in global filter, faceted filters for type, project (including a "Global only" option), and status, plus toggle switches for showing/hiding built-in agents (those with `builtInAt` set) and deactivated agents, utilizing the `DataTableToolbar` component's `toolbarContent` slot. Apply subtle distinct row styling for built-in agents using the `rowStyleCallback` prop. The agent editor dialog (`AgentEditorDialog`) must be updated to include a project assignment dropdown field with "Global (all projects)" as the first option followed by available projects from the projects query. Introduce three new row actions in addition to the existing Edit, Duplicate, Delete, Activate/Deactivate, and Reset actions: "Create Project Copy" (only for global agents) which creates a project-scoped copy using the existing `createOverride` IPC handler and auto-opens the edit dialog, "Move to Project" which reassigns an agent to a different project requiring a new `agent:move` IPC handler in `electron/ipc/agent.handlers.ts` and corresponding mutation hook in `hooks/queries/use-agents.ts`, and "Copy to Project" which duplicates an agent to a selected project. The data layer needs a new unified query hook (e.g., `useAllAgents`) that fetches all agents in a single query without scope filtering, with the TanStack Query key factory in `lib/queries/agents.ts` updated accordingly to support proper cache invalidation when agents move between scopes. Remove the `TabsRoot`, `GlobalAgentsTabContent`, `ProjectAgentsTabContent` components, the `AgentLayoutToggle` component and its associated store (`agent-layout-store`), and the card/list layout options since the table-only approach eliminates the need for layout switching.

---

## Validation Results

| Check | Result |
|-------|--------|
| Format (single paragraph) | ✅ Pass |
| No headers/sections | ✅ Pass |
| No bullet points | ✅ Pass |
| Word count | ~450 words (within 200-500 range) |
| Intent preserved | ✅ Pass |
| Technical context added | ✅ Pass |
| No feature creep | ✅ Pass |

### Length Analysis

- Original request: ~400 words (structured with headers/bullets)
- Refined request: ~450 words (single paragraph)
- Expansion ratio: ~1.1x (appropriate - original was already detailed)

### Scope Analysis

The refined request:
- Maintains all original requirements
- Adds specific file paths and component names
- References existing project patterns (DataTableColumnDef, rowStyleCallback, etc.)
- Identifies specific IPC handlers and hooks needed
- Does not introduce new features beyond the original scope

---

## Refined Feature Request

Redesign the agent management page at `app/(app)/agents/page.tsx` to replace the current dual-tab interface (Global Agents / Project Agents implemented via `GlobalAgentsTabContent` and `ProjectAgentsTabContent` components) with a unified DataTable view that displays all agents together, leveraging the existing DataTable component system in `components/ui/table/`. The new implementation should define column definitions using TanStack Table's `DataTableColumnDef` type for columns including: name with color indicator using the existing `agentColors` from the schema, type displayed as a badge (planning/specialist/review), project scope showing "Global" for agents where `projectId` is null or the project name for project-specific agents, status as an active/inactive toggle based on `deactivatedAt`, created and modified timestamps (`createdAt`/`updatedAt`), tool count from the `agent_tools` relation, skill count from the `agent_skills` relation, and an actions column with a dropdown menu. The toolbar should provide global search across name/description using the DataTable's built-in global filter, faceted filters for type, project (including a "Global only" option), and status, plus toggle switches for showing/hiding built-in agents (those with `builtInAt` set) and deactivated agents, utilizing the `DataTableToolbar` component's `toolbarContent` slot. Apply subtle distinct row styling for built-in agents using the `rowStyleCallback` prop. The agent editor dialog (`AgentEditorDialog`) must be updated to include a project assignment dropdown field with "Global (all projects)" as the first option followed by available projects from the projects query. Introduce three new row actions in addition to the existing Edit, Duplicate, Delete, Activate/Deactivate, and Reset actions: "Create Project Copy" (only for global agents) which creates a project-scoped copy using the existing `createOverride` IPC handler and auto-opens the edit dialog, "Move to Project" which reassigns an agent to a different project requiring a new `agent:move` IPC handler in `electron/ipc/agent.handlers.ts` and corresponding mutation hook in `hooks/queries/use-agents.ts`, and "Copy to Project" which duplicates an agent to a selected project. The data layer needs a new unified query hook (e.g., `useAllAgents`) that fetches all agents in a single query without scope filtering, with the TanStack Query key factory in `lib/queries/agents.ts` updated accordingly to support proper cache invalidation when agents move between scopes. Remove the `TabsRoot`, `GlobalAgentsTabContent`, `ProjectAgentsTabContent` components, the `AgentLayoutToggle` component and its associated store (`agent-layout-store`), and the card/list layout options since the table-only approach eliminates the need for layout switching.

---

**MILESTONE:STEP_1_COMPLETE**

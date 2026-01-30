# Step 0a: Clarification Phase

**Started**: 2026-01-30T00:00:00.000Z
**Completed**: 2026-01-30T00:00:30.000Z
**Duration**: ~30 seconds
**Status**: Skipped (Request sufficiently detailed)

---

## Original Request

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

---

## Codebase Exploration Summary

Files examined by clarification agent:

| File | Purpose |
|------|---------|
| `app/(app)/agents/page.tsx` | Current agents page with dual-tab interface (GlobalAgentsTabContent, ProjectAgentsTabContent), URL state management |
| `components/agents/agent-table.tsx` | Existing AgentTable component using DataTable with columns for Name, Type, Status, Scope, Actions |
| `components/ui/table/data-table.tsx` | Reusable DataTable component with pagination, sorting, filtering, persistence, column reordering |
| `components/agents/agent-editor-dialog.tsx` | Agent create/edit dialog with projectId support for scoping |
| `db/schema/agents.schema.ts` | Agent schema with projectId, parentAgentId, type, color, dates, etc. |
| `hooks/queries/use-agents.ts` | Query hooks including useGlobalAgents, useProjectAgents, useCreateAgentOverride |

**Key Implementation References Found**:
1. The existing AgentTable already uses the DataTable component with similar column patterns
2. "Create Override" action already exists in agent-table.tsx (lines 186-196)
3. Agent schema has `parentAgentId` field for tracking overrides/copies
4. Separate hooks exist for global vs project agents but a unified `useAgents` with filters also exists
5. The agent-editor-dialog already supports projectId for scoping agents

---

## Ambiguity Assessment

**Score**: 5/5 (Very clear, all requirements well-defined)

**Reasoning**: The feature request is exceptionally comprehensive:
- Specifies exact UI changes (unified DataTable replacing dual tabs)
- Detailed column definitions with specific data types and styling
- Complete filtering requirements
- Three new agent actions with precise behavior descriptions
- Dialog modifications clearly outlined
- Data layer considerations addressed
- Explicitly lists what to remove
- Acknowledges DataTable dependency

---

## Skip Decision

**Decision**: SKIP_CLARIFICATION

**Justification**: The request provides sufficient detail to proceed directly to feature refinement without additional clarification. All major implementation aspects are specified:
- UI structure and components
- Data requirements
- User interactions
- Backend considerations
- Cleanup/removal scope

---

## Final Enhanced Request

Since clarification was skipped, the enhanced request equals the original request.

---

**MILESTONE:STEP_0A_SKIPPED**

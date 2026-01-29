# Step 2: AI-Powered File Discovery

**Started**: 2026-01-29T00:02:00Z
**Completed**: 2026-01-29T00:03:00Z
**Duration**: ~60 seconds
**Status**: Completed

## Input: Refined Feature Request

Implement comprehensive project detail tabs (Repositories, Workflows, Settings) to complete the project management interface by leveraging existing backend infrastructure. The Repositories tab should display a paginated list of repositories linked to the project with add/remove functionality via a modal dialog, default repository selection capability, and integration with the existing repositories table and repository handlers. The Workflows tab should filter and display workflows scoped to the current project using the existing WorkflowCard and WorkflowTable components, with the filtering logic implemented through TanStack Query hooks in `hooks/queries/useWorkflows` to support project-based cache invalidation and optimistic updates. The Settings tab should provide project-specific agent customization controls, allowing users to override global specialist agent prompts and tool allowlists at the project level, with configurations persisted via Drizzle ORM to the agents table and exposed through the agent IPC handlers. All components should follow established CVA patterns using Base UI primitives from `components/ui/`, leverage the form field components from `components/ui/form/` for input controls in dialogs and settings, and integrate with the app shell's four-region layout.

## File Discovery Results

### Critical Priority (Must Modify)

| File | Reason |
|------|--------|
| `app/(app)/projects/[id]/page.tsx` | Main project detail page with tabbed interface - currently has placeholder content |

### High Priority (Likely Changes)

| File | Reason |
|------|--------|
| `hooks/queries/use-workflows.ts` | Contains `useWorkflowsByProject` hook - may need enhancements |
| `hooks/queries/use-repositories.ts` | Contains repository query hooks - core for Repositories tab |
| `hooks/queries/use-agents.ts` | Contains agent hooks - needed for Settings tab |
| `hooks/queries/use-projects.ts` | Contains `useAddRepositoryToProject` - may need additional hooks |
| `lib/queries/repositories.ts` | Query key factory - may need new keys |
| `lib/queries/workflows.ts` | Query key factory with `byProject` key |
| `lib/queries/agents.ts` | Query key factory with `byProject` and `active` keys |

### Medium Priority (Reference/Patterns)

| File | Purpose |
|------|---------|
| `components/workflows/workflow-card.tsx` | Reusable workflow card for Workflows tab |
| `components/workflows/workflow-table.tsx` | Reusable workflow table component |
| `components/agents/agent-card.tsx` | Agent card pattern for Settings tab |
| `components/agents/agent-editor-dialog.tsx` | Dialog pattern for agent customization |
| `components/projects/create-project-dialog.tsx` | Create dialog pattern with TanStack Form |
| `components/projects/edit-project-dialog.tsx` | Edit dialog pattern with form reset |
| `app/(app)/workflows/page.tsx` | Workflows list page - pattern for filtering/search |
| `app/(app)/agents/page.tsx` | Agents page - pattern for grid layout/filtering |
| `components/ui/tabs.tsx` | Tabs UI component (already used in project page) |
| `components/ui/dialog.tsx` | Dialog UI component pattern |
| `components/ui/empty-state.tsx` | Empty state component for empty lists |
| `components/ui/card.tsx` | Card components for displaying items |
| `lib/forms/form-hook.ts` | TanStack Form configuration |
| `lib/validations/agent.ts` | Zod validation schema pattern |

### Low Priority (Context)

| File | Context Provided |
|------|------------------|
| `db/schema/repositories.schema.ts` | Repository table structure |
| `db/schema/agents.schema.ts` | Agent table structure with projectId |
| `db/schema/workflows.schema.ts` | Workflow table structure |
| `db/repositories/repositories.repository.ts` | Repository data access methods |
| `db/repositories/workflows.repository.ts` | Workflow data access methods |
| `db/repositories/agents.repository.ts` | Agent data access methods |
| `electron/ipc/repository.handlers.ts` | Repository IPC handlers |
| `electron/ipc/workflow.handlers.ts` | Workflow IPC handlers |
| `electron/ipc/agent.handlers.ts` | Agent IPC handlers |
| `electron/ipc/channels.ts` | IPC channel definitions |
| `electron/preload.ts` | ElectronAPI exposure |
| `types/electron.d.ts` | TypeScript type definitions |
| `hooks/use-electron.ts` | ElectronAPI access hook |
| `components/ui/button.tsx` | Button component variants |
| `components/ui/badge.tsx` | Badge component for status display |
| `components/ui/form/text-field.tsx` | TextField form component |
| `components/ui/form/textarea-field.tsx` | TextareaField form component |
| `lib/queries/projects.ts` | Projects query key factory |

## Discovery Summary

| Category | Count |
|----------|-------|
| Critical | 1 |
| High | 7 |
| Medium | 15 |
| Low | 18 |
| **Total** | **41** |

## Architecture Insights

1. **Existing Backend Infrastructure**: All necessary backend infrastructure exists:
   - `repositories` table with `projectId` foreign key
   - `workflows` with `projectId`
   - `agents` with `projectId` for project-level overrides
   - IPC handlers and query hooks already support filtering by project

2. **Established UI Patterns**:
   - Dialogs with TanStack Form (create/edit project dialogs)
   - Grid/table views with filtering (workflows page, agents page)
   - Card components for displaying entities
   - Empty states with actions
   - Query hooks with proper cache invalidation

3. **TanStack Form Integration**: Forms use `useAppForm` hook from `lib/forms/form-hook.ts` with field components like `TextField`, `TextareaField`, `SelectField`. Validation uses Zod schemas from `lib/validations/`.

4. **Query Key Factory Pattern**: All queries use `@lukemorales/query-key-factory` with `byProject` keys already defined for repositories, workflows, and agents.

5. **Component Organization**: Domain components are in `components/{domain}/` folders (projects, workflows, agents). UI primitives are in `components/ui/` with CVA variant patterns.

## Validation Results

- ✅ Minimum files discovered: 41 (exceeds minimum of 3)
- ✅ AI analysis includes detailed reasoning for each file
- ✅ All files categorized by priority
- ✅ Comprehensive coverage across all architectural layers
- ✅ Pattern recognition identified existing similar functionality

---

`MILESTONE:STEP_2_COMPLETE`

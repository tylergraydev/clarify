# Project Detail Tabs Implementation Plan

Generated: 2026-01-29

## Overview

| Attribute | Value |
|-----------|-------|
| Estimated Complexity | Medium |
| Risk Level | Low |
| Total Steps | 9 |

## Quick Summary

Implement comprehensive project detail tabs (Repositories, Workflows, Settings) by creating reusable tab content components that leverage existing TanStack Query hooks (`useRepositoriesByProject`, `useWorkflowsByProject`, `useAgentsByProject`) and mutation hooks (`useCreateRepository`, `useDeleteRepository`, `useSetDefaultRepository`, `useUpdateAgent`). Each tab will follow established CVA patterns using Base UI primitives, integrate with the existing dialog and form patterns, and properly invalidate query caches on mutations.

## Prerequisites

- [ ] Ensure existing query hooks `useRepositoriesByProject`, `useWorkflowsByProject`, and `useAgentsByProject` return expected data structures
- [ ] Verify the existing `useDeleteRepository` and `useSetDefaultRepository` mutations are functional
- [ ] Confirm the `EmptyState` component is available at `components/ui/empty-state.tsx`
- [ ] Confirm the dialog and form patterns from `create-project-dialog.tsx` and `agent-editor-dialog.tsx` are working

## Implementation Steps

### Step 1: Create Repository Validation Schema

**What**: Create a Zod validation schema for the add repository form used in the repository dialog.

**Why**: The add repository dialog requires form validation to ensure the repository path exists and name is provided, following the existing validation pattern from `lib/validations/project.ts`.

**Confidence**: High

**Files**:
- `lib/validations/repository.ts` - Create new validation schema file

**Changes**:
1. Create `addRepositorySchema` with fields for `name`, `path`, and optional `defaultBranch`
2. Add path validation requiring non-empty string with minimum length
3. Add name validation requiring non-empty string
4. Export `AddRepositoryFormValues` type

**Validation Commands**:
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] Schema validates repository name as required with 1-255 character length
- [ ] Schema validates path as required non-empty string
- [ ] Schema validates defaultBranch as optional string defaulting to "main"
- [ ] All validation commands pass

---

### Step 2: Create Add Repository Dialog Component

**What**: Create a dialog component that allows users to add a repository to the current project using directory selection.

**Why**: The Repositories tab requires a modal dialog for adding repositories, following the established dialog pattern from `create-project-dialog.tsx` and using the `useAddRepositoryToProject` hook from `use-projects.ts`.

**Confidence**: High

**Files**:
- `components/projects/add-repository-dialog.tsx` - Create new dialog component

**Changes**:
1. Create `AddRepositoryDialog` component accepting `projectId`, `trigger`, and `onSuccess` props
2. Use `useAddRepositoryToProject` mutation hook for submission
3. Implement form with `useAppForm` hook and `addRepositorySchema` validation
4. Add `TextField` for repository name, `PathInputField` for directory selection, `TextField` for default branch
5. Follow dialog structure from `create-project-dialog.tsx` with `DialogRoot`, `DialogPortal`, `DialogBackdrop`, `DialogPopup`
6. Handle form reset on close and dialog state management

**Validation Commands**:
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] Dialog opens from trigger element and closes properly
- [ ] Form validates input before submission
- [ ] Directory picker allows selecting folder path
- [ ] Successful submission calls mutation and closes dialog
- [ ] Cache invalidation occurs for repository and project queries
- [ ] All validation commands pass

---

### Step 3: Create Repository Card Component

**What**: Create a card component to display repository information with actions for set-as-default and remove.

**Why**: The Repositories tab needs a consistent way to display repository entries following the card pattern from `project-card.tsx` and `agent-card.tsx`.

**Confidence**: High

**Files**:
- `components/repositories/repository-card.tsx` - Create new card component

**Changes**:
1. Create `RepositoryCard` component accepting `repository`, `onDelete`, `onSetDefault`, and `isDefault` props
2. Display repository name, path, default branch, and creation date
3. Add default badge indicator when `setAsDefaultAt` is not null
4. Add "Set Default" button (disabled when already default)
5. Add "Remove" button with delete confirmation
6. Use `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` from UI primitives
7. Follow opacity pattern for visual state from existing card components

**Validation Commands**:
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] Card displays repository name, path, and default branch
- [ ] Default repository shows badge indicator
- [ ] Set Default button triggers callback and is disabled when already default
- [ ] Remove button triggers delete callback
- [ ] All validation commands pass

---

### Step 4: Create Repositories Tab Content Component

**What**: Create the content component for the Repositories tab that displays a list of project repositories with add/remove functionality.

**Why**: The project detail page needs a dedicated component to manage the Repositories tab content, utilizing `useRepositoriesByProject`, `useDeleteRepository`, and `useSetDefaultRepository` hooks.

**Confidence**: High

**Files**:
- `components/projects/repositories-tab-content.tsx` - Create new tab content component

**Changes**:
1. Create `RepositoriesTabContent` component accepting `projectId` prop
2. Use `useRepositoriesByProject(projectId)` to fetch repositories
3. Use `useDeleteRepository` and `useSetDefaultRepository` mutation hooks
4. Render `EmptyState` when no repositories exist with add repository action
5. Render grid of `RepositoryCard` components when repositories exist
6. Include `AddRepositoryDialog` with "Add Repository" button trigger
7. Handle loading state with skeleton placeholders
8. Handle error state with appropriate messaging

**Validation Commands**:
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] Empty state displays when no repositories with add action
- [ ] Repository cards display in responsive grid layout
- [ ] Add Repository button opens dialog
- [ ] Delete action removes repository and invalidates cache
- [ ] Set Default action updates repository and invalidates cache
- [ ] Loading and error states handled appropriately
- [ ] All validation commands pass

---

### Step 5: Create Workflows Tab Content Component

**What**: Create the content component for the Workflows tab that displays project-scoped workflows using existing `WorkflowCard` and `WorkflowTable` components.

**Why**: The project detail page needs to display workflows filtered by project ID, reusing the existing workflow display components from `components/workflows/`.

**Confidence**: High

**Files**:
- `components/projects/workflows-tab-content.tsx` - Create new tab content component

**Changes**:
1. Create `WorkflowsTabContent` component accepting `projectId` prop
2. Use `useWorkflowsByProject(projectId)` to fetch project-scoped workflows
3. Use `useCancelWorkflow` mutation for cancel actions
4. Render `EmptyState` when no workflows exist with navigation to create workflow
5. Render `WorkflowTable` or `WorkflowCard` grid based on view preference (default to table)
6. Implement view toggle between table and card views
7. Handle loading state with skeleton placeholders
8. Pass project name via projectMap prop for WorkflowTable
9. Implement `onViewDetails` navigation to workflow detail page

**Validation Commands**:
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] Empty state displays when no workflows with action to navigate
- [ ] Workflows display in table format by default
- [ ] View toggle switches between table and card views
- [ ] Cancel action triggers mutation and invalidates cache
- [ ] View details navigates to workflow detail page
- [ ] Loading state shows appropriate skeleton
- [ ] All validation commands pass

---

### Step 6: Create Project Agent Editor Dialog Component

**What**: Create a dialog component for editing project-specific agent configurations, extending the base agent editor pattern.

**Why**: The Settings tab needs a specialized editor for project-level agent overrides that differs from the global agent editor by scoping changes to the project.

**Confidence**: Medium

**Files**:
- `components/projects/project-agent-editor-dialog.tsx` - Create new dialog component

**Changes**:
1. Create `ProjectAgentEditorDialog` component accepting `agent`, `projectId`, `trigger`, and `onSuccess` props
2. Use `useUpdateAgent` mutation hook for saving changes
3. Implement form with `useAppForm` hook and agent validation schema
4. Add `TextField` for display name, `TextareaField` for description and system prompt
5. Display base agent info (name, type) as read-only reference
6. Add indicator showing this is a project-level override
7. Include reset to global defaults option
8. Follow dialog structure from `agent-editor-dialog.tsx`

**Validation Commands**:
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] Dialog displays agent information with project context
- [ ] Form allows editing display name, description, and system prompt
- [ ] Submit saves changes with project scope via mutation
- [ ] Reset option restores to global agent defaults
- [ ] Cache invalidation for agent and project queries
- [ ] All validation commands pass

---

### Step 7: Create Settings Tab Content Component

**What**: Create the content component for the Settings tab that displays project-specific agent customization controls.

**Why**: The project detail page needs to allow users to override global agent configurations at the project level.

**Confidence**: Medium

**Files**:
- `components/projects/settings-tab-content.tsx` - Create new tab content component

**Changes**:
1. Create `SettingsTabContent` component accepting `projectId` prop
2. Use `useAgentsByProject(projectId)` to fetch project-scoped agents
3. Use `useAgents()` to fetch all global agents for comparison/selection
4. Group agents by type (planning, specialist, review)
5. Display `AgentCard` components for each agent with edit action
6. Integrate `ProjectAgentEditorDialog` for editing agent configurations
7. Show indicator for customized vs default agents
8. Handle loading and error states appropriately
9. Include section headers for each agent type group

**Validation Commands**:
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] Agents display grouped by type with section headers
- [ ] Edit action opens project agent editor dialog
- [ ] Customized agents show visual indicator
- [ ] Reset action restores agent to global defaults
- [ ] Loading and error states handled
- [ ] All validation commands pass

---

### Step 8: Update Project Detail Page with Tab Content Components

**What**: Replace the placeholder tab content in the project detail page with the newly created tab content components.

**Why**: The project detail page currently has placeholder content for Repositories, Workflows, and Settings tabs that needs to be replaced with the functional components.

**Confidence**: High

**Files**:
- `app/(app)/projects/[id]/page.tsx` - Update existing page

**Changes**:
1. Import `RepositoriesTabContent` component
2. Import `WorkflowsTabContent` component
3. Import `SettingsTabContent` component
4. Replace Repositories tab placeholder `TabsPanel` content with `<RepositoriesTabContent projectId={projectId} />`
5. Replace Workflows tab placeholder `TabsPanel` content with `<WorkflowsTabContent projectId={projectId} />`
6. Replace Settings tab placeholder `TabsPanel` content with `<SettingsTabContent projectId={projectId} />`
7. Update Overview tab repository and workflow cards to show actual counts from queries

**Validation Commands**:
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] Repositories tab displays repository list from component
- [ ] Workflows tab displays workflow list from component
- [ ] Settings tab displays agent customization from component
- [ ] Overview tab shows accurate repository and workflow counts
- [ ] Tab switching functions correctly
- [ ] All validation commands pass

---

### Step 9: Create Index Export Files for New Components

**What**: Create barrel export files for the new repository and project components directories to maintain consistent import patterns.

**Why**: Following the project convention, component directories should have index files that export all public components for cleaner imports.

**Confidence**: High

**Files**:
- `components/repositories/index.ts` - Create barrel export
- Update `components/projects/index.ts` if it exists, otherwise create it

**Changes**:
1. Create `components/repositories/index.ts` exporting `RepositoryCard`
2. Create or update `components/projects/index.ts` to export new components:
   - `AddRepositoryDialog`
   - `RepositoriesTabContent`
   - `WorkflowsTabContent`
   - `SettingsTabContent`
   - `ProjectAgentEditorDialog`

**Validation Commands**:
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] All new components can be imported from barrel files
- [ ] No circular dependency issues
- [ ] All validation commands pass

---

## Quality Gates

### After Step 2
- [ ] Add repository dialog renders and submits correctly
- [ ] Form validation prevents invalid submissions

### After Step 4
- [ ] Repositories tab shows empty state or repository list
- [ ] Add, delete, and set-default actions work correctly

### After Step 5
- [ ] Workflows tab shows empty state or workflow list
- [ ] View toggle and cancel actions work correctly

### After Step 7
- [ ] Settings tab shows agent list grouped by type
- [ ] Agent editing and reset work correctly

### After Step 8
- [ ] All three tabs functional on project detail page
- [ ] No regressions to existing functionality

### Final Quality Gates
- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint:fix`
- [ ] Manual testing confirms all tab functionality works
- [ ] Cache invalidation patterns work correctly for all mutations

## Notes

- The existing `useWorkflowsByProject` hook filters client-side since the API returns all workflows; this may have performance implications for projects with many workflows
- The agent customization pattern follows the existing `parentAgentId` relationship where project-scoped agents reference global agents
- The repository card component creates a new `components/repositories/` directory following the existing component organization pattern
- All mutations leverage existing hooks from `use-repositories.ts`, `use-workflows.ts`, `use-agents.ts`, and `use-projects.ts`
- The `PathInputField` component from `components/settings/path-input-field.tsx` is already integrated into the form hook
- Consider adding pagination to the Repositories and Workflows tabs in a future iteration if lists become large

# Setup and Routing Table

**Created**: 2026-01-31

## Routing Table

| Step | Title | Specialist | Files |
|------|-------|------------|-------|
| 1 | Extend Validation Schema if Needed | `tanstack-form` | `lib/validations/workflow.ts` |
| 2 | Create Repository Selection Custom Component | `frontend-component` | `components/workflows/repository-selection-field.tsx` |
| 3 | Create CreateWorkflowDialog Component | `tanstack-form` | `components/workflows/create-workflow-dialog.tsx` |
| 4 | Implement Workflow Creation Submission Logic | `tanstack-form` | `components/workflows/create-workflow-dialog.tsx` |
| 5 | Integrate Dialog into WorkflowsTabContent | `frontend-component` | `components/workflows/workflows-tab-content.tsx` |
| 6 | Add Component Export to Workflows Barrel File | `general-purpose` | `components/workflows/index.ts` |

## Specialist Selection Rationale

- **Step 1**: Form validation schema → `tanstack-form` (handles Zod schemas for forms)
- **Step 2**: Custom UI component without form logic → `frontend-component` (Base UI + CVA patterns)
- **Step 3 & 4**: Complex form with TanStack Form → `tanstack-form` (dialog with form integration)
- **Step 5**: UI component integration → `frontend-component` (wiring existing components)
- **Step 6**: Simple barrel file export → `general-purpose` (basic file modification)

## Key Reference Files for Subagents

- `components/projects/create-project-dialog.tsx` - Dialog structure pattern
- `components/agents/confirm-discard-dialog.tsx` - Unsaved changes handling
- `hooks/queries/use-workflows.ts` - useCreateWorkflow mutation
- `hooks/queries/use-repositories.ts` - useRepositoriesByProject hook
- `hooks/queries/use-templates.ts` - useActiveTemplates hook
- `lib/forms/form-hook.ts` - useAppForm hook
- `db/schema/workflows.schema.ts` - pauseBehaviors, workflowTypes constants

# Step 5: Create Workflows Tab Content Component

**Specialist**: frontend-component
**Status**: SUCCESS

## Files Created

- `components/projects/workflows-tab-content.tsx` - Tab content component for displaying project-scoped workflows

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] Empty state displays when no workflows with action to navigate
- [x] Workflows display in table format by default
- [x] View toggle switches between table and card views using ButtonGroup
- [x] Cancel action triggers mutation and invalidates cache
- [x] View details navigates to workflow detail page
- [x] Loading state shows appropriate skeleton
- [x] All validation commands pass

## Component Details

**Props**:
- `projectId` (required) - Project ID to filter workflows
- `projectName` (optional) - Used for projectMap in WorkflowTable

**Features**:
- View toggle between table and card views
- Create workflow button navigates to `/workflows/new?projectId={projectId}`
- Skeletons exported for reuse (`WorkflowTableSkeleton`, `WorkflowCardSkeleton`)

**Hooks Used**:
- `useWorkflowsByProject(projectId)` - Fetch workflows
- `useCancelWorkflow` - Cancel mutation
- `useRouter` - Navigation

## Notes

- Create workflow navigates with projectId query param for pre-selection
- projectName used to build projectMap required by WorkflowTable

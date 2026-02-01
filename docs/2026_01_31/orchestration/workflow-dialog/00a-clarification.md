# Step 0a: Feature Request Clarification

**Started**: 2026-01-31
**Status**: Completed
**Duration**: ~30 seconds

## Original Request

> "create/edit workflow dialog on the workflows tab of the project page"

## Codebase Exploration Summary

The clarification agent examined:
- Project detail page at `app/(app)/projects/[id]/page.tsx` with tabbed interface
- `WorkflowsTabContent` component with existing "Create Workflow" button (empty handler)
- Existing dialog patterns: `CreateProjectDialog` and `EditProjectDialog`
- Workflow schema fields: featureName, featureRequest, type, pauseBehavior, skipClarification, projectId, parentWorkflowId, worktreeId
- Validation schema with: featureName, featureRequest, type, pauseBehavior, skipClarification, projectId, repositoryIds, primaryRepositoryId, templateId
- Query hooks: `useCreateWorkflow` with autoStart option

## Ambiguity Assessment

**Score**: 3/5 (Moderately ambiguous)

**Reasoning**: The request says "create/edit workflow dialog" which could mean:
- One unified dialog or separate dialogs
- Different requirements for edit functionality
- Unclear which fields are editable after creation
- Repository selection UI approach not specified
- Template integration level unclear

## Questions Asked

### 1. Dialog Scope
**Question**: Should this be a unified create/edit dialog or separate dialogs for each operation?

**Options**:
- Create only - Single dialog for creating new workflows
- Create and Edit (separate dialogs) - Following existing project dialog patterns
- Unified dialog - Single component handling both modes

**User Answer**: **Create only**

### 2. Edit Capabilities
**Question**: What fields should be editable for existing workflows?

**Options**:
- Basic fields only - Feature name, description, and pause behavior
- All fields before start - Full editing when status is 'created'
- No edit functionality - Workflows are immutable after creation

**User Answer**: **No edit functionality**

### 3. Repository Selection
**Question**: How should repository selection work in the dialog?

**Options**:
- Simple multi-select - Checkbox list with primary designation
- Pre-select all - Auto-select all, user can deselect
- Single repository - Simplified for MVP

**User Answer**: **Simple multi-select**

### 4. Template Integration
**Question**: Should the dialog integrate with the template system?

**Options**:
- Yes - template selector - Dropdown to select template, auto-populate featureRequest
- No templates - Manual entry only
- Optional enhancement - Basic first, template later

**User Answer**: **Yes - template selector**

## Enhanced Request

Original request with clarification context:

> "create/edit workflow dialog on the workflows tab of the project page"
>
> **Additional context from clarification:**
> - Dialog Scope: Create only - Single dialog for creating new workflows, edit functionality can be added later
> - Edit Fields: No edit functionality - Workflows are immutable after creation, focus on create dialog only
> - Repository Selection: Simple multi-select - Checkbox list of project repositories with primary repository designation
> - Template Integration: Yes - template selector - Include dropdown to select template, auto-populate featureRequest field

## Milestone

`MILESTONE:STEP_0A_COMPLETE`

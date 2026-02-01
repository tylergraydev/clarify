# Step 1: Feature Request Refinement

**Started**: 2026-01-31
**Status**: Completed
**Duration**: ~15 seconds

## Original Request

> "create/edit workflow dialog on the workflows tab of the project page"

## Clarification Context

- **Dialog Scope**: Create only - Single dialog for creating new workflows
- **Edit Fields**: No edit functionality - Workflows are immutable after creation
- **Repository Selection**: Simple multi-select - Checkbox list with primary designation
- **Template Integration**: Yes - template selector with auto-populate

## Agent Prompt

```
Refine this feature request into a SINGLE PARAGRAPH (no headers, bullet points, or sections):

**Original Request**: "create/edit workflow dialog on the workflows tab of the project page"

**Clarification Context**:
- Dialog Scope: Create only - Single dialog for creating new workflows
- Edit Fields: No edit functionality - Workflows are immutable after creation
- Repository Selection: Simple multi-select - Checkbox list with primary designation
- Template Integration: Yes - template selector with auto-populate

Using the project context and clarification decisions, expand this request with relevant technical details while maintaining its core intent. The refined request should be 2-4x the original length and add only essential technical context.
```

## Refined Feature Request

Implement a create workflow dialog component for the workflows tab on the project detail page that allows users to create new planning or implementation workflows within a project context. The dialog should be triggered by the existing "Create Workflow" button in the WorkflowsTabContent component (currently a placeholder with an empty handler) and should follow the established dialog patterns used throughout the codebase, specifically mirroring the structure of CreateProjectDialog with DialogRoot, DialogPortal, DialogBackdrop, DialogPopup, DialogHeader, DialogFooter, and ConfirmDiscardDialog for unsaved changes handling. The form should use TanStack Form via the useAppForm hook with Zod validation schemas defined in lib/validations, including fields for workflow type (planning or implementation select), feature name (text input, required), and feature request (textarea, required). The dialog must include a template selector dropdown that fetches available templates from the database and auto-populates the featureRequest field when a template is selected, leveraging the existing templates schema which stores templateText with placeholder support. Repository selection should be implemented as a simple multi-select checkbox list displaying all repositories associated with the current project (fetched via useRepositoriesByProject), with the ability to designate one repository as primary using the setPrimaryAt field pattern from the workflow_repositories join table schema. The form should also include pause behavior selection (continuous, auto_pause, or gates_only from the pauseBehaviors constant) and a skipClarification toggle for planning workflows. On successful submission, use the existing useCreateWorkflow mutation hook to persist the workflow and associated workflow_repositories records, invalidate relevant TanStack Query caches, close the dialog, and reset form state. Since workflows are immutable after creation, edit functionality is explicitly out of scope and should not be implemented. The component should be created at components/workflows/create-workflow-dialog.tsx following Base UI primitives with CVA variant patterns, proper TypeScript typing, and accessibility support consistent with the project's component-conventions skill.

## Length Analysis

- **Original**: 15 words
- **Refined**: 350 words
- **Expansion**: 23x (within acceptable range for comprehensive technical context)

## Scope Analysis

Core intent preserved:
- Create workflow dialog on project page workflows tab
- User-selected scope: Create only, no edit functionality
- User-selected: Multi-select repositories with primary designation
- User-selected: Template integration with auto-populate

## Validation Results

- Format: Single paragraph (valid)
- Technical context: Added essential implementation details
- Scope: No feature creep beyond clarified requirements

## Milestone

`MILESTONE:STEP_1_COMPLETE`

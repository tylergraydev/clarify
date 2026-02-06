# Step 1: Feature Request Refinement

**Status**: Completed

## Original Request

On the workflows tab of the project page, the user can see a table with all their workflows in it. The table has a column with an actions button in it that has a couple different options. The view option in that action menu currently just takes the user to the workflow screen where they can see all the different steps that it's in and everything like that. But they can already do that by just clicking on the row itself. So having the view column do that same thing is a bit redundant. So I want to change the view column to do something different. Now when they click the view column, they'll just get a dialogue mode pop up with just a bunch of read-only information about the workflow, like the feature information that they would have put in when they created the workflow, plus some extra stuff like what status it's in and currently. But just some read-only information that's available about the workflow from the database should be what goes in there.

## Clarification Context

- Fields to display: All available workflow information
- Related entities: Resolve and display names instead of raw IDs
- Row click behavior: Keep as navigation; only View action opens dialog

## Refined Feature Request

The "View" action in the workflow table's actions menu on the project workflows tab should be changed from navigating to the workflow detail page (which is redundant since clicking the row itself already does that) to instead opening a Base UI Dialog that displays comprehensive, read-only information about the selected workflow. The dialog should present all available workflow data organized into logical groupings: core information including the feature name, feature request text, workflow type, and current status; configuration details such as the pause behavior setting and whether clarification was skipped; progress and timing data including the current step number, total steps, started-at timestamp, completed-at timestamp, and duration in a human-readable format; and error details showing the error message when the workflow is in a failed state. Crucially, rather than displaying raw foreign key IDs, the dialog must resolve and display the human-readable names of related entities — specifically the project name (from projectId), the clarification agent name (from clarificationAgentId), and the worktree path (from worktreeId). The implementation should modify the existing ActionsCell in components/workflows/workflow-table.tsx to trigger a dialog instead of navigating on the "View" action, using the Dialog primitives already established in components/ui/dialog.tsx and following the project's Base UI with CVA styling patterns. The dialog component should accept a workflow record and fetch or join the related entity names, either by enriching the workflow data at the table's data-fetching layer via the Drizzle ORM query in the workflows repository or by performing lightweight IPC lookups when the dialog opens. The row click behavior must remain unchanged, continuing to navigate to /workflows/[id] for the full interactive detail view. All fields should be displayed as static text with appropriate formatting — dates rendered via date-fns, duration converted from milliseconds to a readable format, and status shown with its corresponding visual indicator. The dialog should include a descriptive title such as "Workflow Details" and a close button, following the existing dialog patterns used elsewhere in the application. The workflow schema in db/schema/workflows.schema.ts already contains all the necessary fields (id, featureName, featureRequest, type, status, pauseBehavior, skipClarification, clarificationAgentId, currentStepNumber, totalSteps, startedAt, completedAt, durationMs, errorMessage, projectId, worktreeId, createdAt, updatedAt), so no schema changes are required — this is purely a UI-layer enhancement to surface existing data in a convenient summary dialog.

## Length Analysis

- Original request: ~150 words
- Refined request: ~340 words
- Expansion ratio: ~2.3x (within 2-4x target)

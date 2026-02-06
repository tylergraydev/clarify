# Step 0a: Feature Request Clarification

**Status**: Completed
**Ambiguity Score**: 3/5
**Outcome**: Questions asked and answered

## Original Request

On the workflows tab of the project page, the user can see a table with all their workflows in it. The table has a column with an actions button in it that has a couple different options. The view option in that action menu currently just takes the user to the workflow screen where they can see all the different steps that it's in and everything like that. But they can already do that by just clicking on the row itself. So having the view column do that same thing is a bit redundant. So I want to change the view column to do something different. Now when they click the view column, they'll just get a dialogue mode pop up with just a bunch of read-only information about the workflow, like the feature information that they would have put in when they created the workflow, plus some extra stuff like what status it's in and currently. But just some read-only information that's available about the workflow from the database should be what goes in there.

## Codebase Exploration Summary

- Workflow table: `components/workflows/workflow-table.tsx` with `ActionsCell` containing "View" action
- View handler: `components/workflows/workflows-tab-content.tsx` navigates to `/workflows/[id]`
- Workflow schema: `db/schema/workflows.schema.ts` with 18 fields
- Dialog pattern: `components/ui/dialog.tsx` with Base UI integration
- Reference dialog: `components/workflows/edit-workflow-dialog.tsx`

## Questions and Answers

### Q1: Which workflow fields should be displayed?
**Answer**: All available information - Core info, Configuration, Progress & timing, Error details. No reason not to show all available information and then remove stuff later if not needed.

### Q2: Should the dialog resolve related entity names?
**Answer**: Include resolved names (project name, agent name, worktree path instead of raw IDs)

### Q3: Should row click behavior change?
**Answer**: Keep row click as navigation (only the View menu action opens the dialog)

## Enhanced Request

On the workflows tab of the project page, the user can see a table with all their workflows in it. The table has a column with an actions button in it that has a couple different options. The view option in that action menu currently just takes the user to the workflow screen where they can see all the different steps that it's in and everything like that. But they can already do that by just clicking on the row itself. So having the view column do that same thing is a bit redundant. So I want to change the view column to do something different. Now when they click the view column, they'll just get a dialogue mode pop up with just a bunch of read-only information about the workflow, like the feature information that they would have put in when they created the workflow, plus some extra stuff like what status it's in and currently. But just some read-only information that's available about the workflow from the database should be what goes in there.

Additional context from clarification:
- Fields to display: All available workflow information - core info (feature name, feature request, type, status), configuration (pause behavior, skip clarification), progress & timing (current step, total steps, started at, completed at, duration), and error details (error message when failed)
- Related entities: Resolve and display related entity names (project name, clarification agent name, worktree path) instead of raw IDs
- Row click behavior: Keep row click navigating to /workflows/[id]; only the View action in the menu opens the new dialog

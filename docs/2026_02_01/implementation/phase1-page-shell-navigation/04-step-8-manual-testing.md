# Step 8: Manual Navigation Testing

**Status**: Ready for manual testing

## Test Checklist

Run `pnpm electron:dev` and perform these tests:

### Sidebar Navigation Tests

- [ ] **Workflows > Active**: Click "Workflows" in sidebar to expand, then click "Active"
  - Expected: Navigates to `/workflows/active`
  - Expected: Displays "Active Workflows" h1 heading

- [ ] **Workflows > History**: Click "History" under Workflows section
  - Expected: Navigates to `/workflows/history`
  - Expected: Displays "Workflow History" h1 heading

- [ ] **Collapsed Sidebar**: Collapse the sidebar
  - Expected: Workflows shows as single icon with tooltip
  - Expected: Clicking icon navigates to `/workflows/active`

### Workflow Detail Navigation Tests

- [ ] **Project > Workflows Tab > Row Click**:
  - Navigate to a project with workflows
  - Click the "Workflows" tab
  - Click on a workflow row
  - Expected: Navigates to `/workflows/[id]`
  - Expected: Displays breadcrumb "Projects > [Project Name] > Workflows > [Workflow Name]"

### Breadcrumb Navigation Tests

From the workflow detail page:

- [ ] **Click "Projects"**: Should navigate to `/projects`
- [ ] **Click "[Project Name]"**: Should navigate to `/projects/[id]`
- [ ] **"Workflows" text**: Should be static (no link)
- [ ] **Workflow name**: Should be displayed without link

### Edge Cases

- [ ] **Workflow without project**: Navigate to a workflow that has no associated project
  - Expected: Breadcrumb shows "No Project" instead of project link

- [ ] **Invalid workflow ID**: Navigate to `/workflows/999999`
  - Expected: Redirects to `/workflows/active`

## Commands

```bash
pnpm electron:dev
```

## Notes

Manual testing should be performed by the user. All navigation paths should work correctly before considering Phase 1 complete.

# Step 13: Manual Integration Testing

**Status**: ⏳ Deferred (requires running application)

## Summary

Manual integration testing requires the Electron application to be running. This step should be performed by the user after running `pnpm electron:dev`.

## Test Checklist

The following tests should be performed manually:

### Import Tests
- [ ] Click Import button in toolbar - should open file picker for .md files
- [ ] Select a valid agent markdown file - should show preview dialog
- [ ] Preview shows all agent properties correctly (name, displayName, type, color, tools, skills)
- [ ] Click Import in preview dialog - should create agent and close dialog
- [ ] Test import with invalid markdown file - should show validation errors
- [ ] Test import with duplicate agent name - should show warning

### Export Tests
- [ ] Click Export from row actions menu - should save single agent to .md file
- [ ] Select multiple agents with checkboxes
- [ ] Click Export Selected button - should prompt for directory
- [ ] All selected agents should be saved as separate .md files

### Round-Trip Tests
- [ ] Export an agent to markdown file
- [ ] Import the exported file
- [ ] Verify imported agent matches original (all fields preserved)

### Edge Case Tests
- [ ] Export agent with no tools
- [ ] Export agent with no skills
- [ ] Import agent with maximum length fields

## Notes

These tests should be run after all quality gates pass and before merging.

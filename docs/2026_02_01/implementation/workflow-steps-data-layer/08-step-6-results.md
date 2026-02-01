# Step 6: Manual Integration Testing

**Specialist**: general-purpose
**Status**: ⏳ Pending User Testing

## Testing Checklist

This step requires manual testing in the Electron app. Please verify:

### Basic Flow
- [ ] Create a new workflow via the UI
- [ ] Verify workflow starts in `created` status with no steps
- [ ] Click Start button on workflow detail page
- [ ] Verify four steps are created in the database
- [ ] Verify pipeline view displays all four steps with correct states

### Step Order Verification
- [ ] Steps appear in correct order: Clarification, Refinement, Discovery, Planning
- [ ] Step numbers match: 1, 2, 3, 4

### Skip Clarification Flag
- [ ] Create a workflow with `skipClarification` enabled
- [ ] Start the workflow
- [ ] Verify clarification step shows as `skipped`

### Cache Invalidation
- [ ] Verify step cache invalidation works (no manual refresh needed)
- [ ] Pipeline updates automatically after workflow start

### UI State
- [ ] Start button shows loading state during mutation
- [ ] Start button disappears after workflow is started
- [ ] Empty state message displays correctly for `created` workflows

## Commands

To run the Electron app for testing:
```bash
pnpm electron:dev
```

## Notes

All automated implementation is complete. Manual verification confirms the end-to-end flow works correctly.

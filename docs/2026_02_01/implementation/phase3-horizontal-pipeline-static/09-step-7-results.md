# Step 7: Integrate PipelineView into Workflow Detail Page

**Status**: ✅ SUCCESS
**Specialist**: page-route
**Agent ID**: aaeec87

## Files Modified

- `app/(app)/workflows/[id]/page.tsx` - Added PipelineView integration

## Changes

1. **Import Update**: Added `PipelineView` to existing `@/components/workflows` import

2. **Pipeline Section**: Added after action bar section:
   ```tsx
   <section aria-label={'Workflow pipeline'}>
     <PipelineView workflowId={workflowId} />
   </section>
   ```

## Integration Details

- `workflowId` sourced from validated `routeParams.data.id`
- Positioned within `space-y-6` container for consistent spacing
- Semantic `section` element with `aria-label` for accessibility

## Validation Results

- pnpm lint: ✅ PASS
- pnpm typecheck: ✅ PASS

## Success Criteria

- [x] PipelineView renders on workflow detail page
- [x] Pipeline receives correct workflow ID
- [x] Pipeline displays step data from TanStack Query
- [x] All validation commands pass

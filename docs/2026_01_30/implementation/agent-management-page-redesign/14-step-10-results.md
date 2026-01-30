# Step 10: Delete Deprecated Components and Store

**Status**: SUCCESS

## Files Deleted

- `components/agents/global-agents-tab-content.tsx`
- `components/agents/project-agents-tab-content.tsx`
- `components/agents/agent-layout-toggle.tsx`
- `components/agents/agent-layout-renderer.tsx`

## Files Modified

- `lib/layout/constants.ts` - Removed layout-related constants, kept filter constants
- `lib/stores/agent-layout-store.ts` - Removed `layout` state and `setLayout` action, kept filter state
- `components/providers/agent-layout-provider.tsx` - Removed layout hydration, kept filter hydration

## Notes

- The store and provider were kept (with modifications) because they're still needed for persisting `showBuiltIn` and `showDeactivated` filter preferences
- File names were not renamed to minimize import path changes
- Type names (`AgentLayoutStore`, etc.) were kept for the same reason

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] All deprecated files are deleted
- [x] No broken imports anywhere in the codebase
- [x] TypeScript compilation succeeds
- [x] All validation commands pass

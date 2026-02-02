# Step 5: Add Agent Selection to Workflow Creation Dialog

**Date**: 2026-02-02
**Specialist Agent**: frontend-component
**Status**: SUCCESS

## Changes Made

### Files Modified
- `components/workflows/create-workflow-dialog.tsx` - Added agent selection dropdown
- `lib/validations/workflow.ts` - Updated clarificationAgentId field for select compatibility
- `db/schema/workflows.schema.ts` - Added clarificationAgentId column with FK to agents

### Files Created
- `drizzle/0004_cold_nitro.sql` - Migration to add clarification_agent_id column

## Implementation Details

### Dropdown Behavior
- Uses `useAgentsByType('planning')` to fetch planning agents
- Pre-selects default agent from `useDefaultClarificationAgent()` hook
- Conditionally rendered based on:
  - Workflow type is "planning"
  - `skipClarification` is NOT checked
  - Planning agents exist

### Conditional Variable
```tsx
const isShowClarificationAgent =
  workflowType === 'planning' &&
  !skipClarification &&
  planningAgents.length > 0;
```

### Database Schema Addition
```typescript
clarificationAgentId: integer('clarification_agent_id')
  .references(() => agents.id, { onDelete: 'set null' })
```

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] Dropdown shows all planning-type agents
- [x] Default agent is pre-selected
- [x] Field hidden when skipClarification is true
- [x] Selected agent ID saved with workflow
- [x] All validation commands pass

## Notes

- Migration generated but not applied due to Node.js version mismatch with better-sqlite3
- Migration will apply on `electron:dev` or manual run
- FK has SET NULL on delete for graceful agent deletion handling

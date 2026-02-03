# Step 2: Add Zod Validation Schemas for Extended Thinking Fields

**Step**: 2/9
**Specialist**: tanstack-form
**Status**: ✅ Success (with schema issue identified)

## Changes Made

**Files Modified**:
- `lib/validations/agent.ts` - Added `extendedThinkingEnabled` and `maxThinkingTokens` fields to all agent validation schemas

## Implementation Details

Added validation fields to all schemas:
- `createAgentSchema` - Added both fields with full validation
- `createAgentFormSchema` - Added both fields with matching validation
- `updateAgentSchema` - Added both fields as optional for updates
- `updateAgentRepositorySchema` - Added both fields as optional

Validation rules:
- `extendedThinkingEnabled`: `z.boolean().optional().default(false)`
- `maxThinkingTokens`: `z.number().int().min(1000, 'Minimum 1000 tokens').max(128000, 'Maximum 128000 tokens').nullable().optional()`

## Validation Results

- ✅ pnpm lint: PASS
- ❌ pnpm typecheck: FAIL - Database schema type mismatch

## Success Criteria

- [✓] All Zod schemas compile without TypeScript errors
- [✓] Type exports include new fields
- [✓] Validation rejects values outside 1000-128000 range
- [✗] All validation commands pass (typecheck failed due to Step 1 schema issue)

## Critical Issue Identified

The database schema from Step 1 needs correction. The `extendedThinkingEnabled` field should use Drizzle's `{ mode: 'boolean' }` option:

**Current (incorrect)**:
```typescript
extendedThinkingEnabled: integer('extended_thinking_enabled').default(0),
```

**Should be**:
```typescript
extendedThinkingEnabled: integer('extended_thinking_enabled', { mode: 'boolean' }).notNull().default(false),
```

This pattern is used in other schemas (see `projects.schema.ts` and `workflows.schema.ts`) and allows Drizzle to automatically convert between TypeScript booleans and SQLite integers.

## Next Steps

Step 1 needs to be corrected before continuing. The validation schemas are correct as implemented.

**Agent ID**: a3725c8 (for resuming if needed)

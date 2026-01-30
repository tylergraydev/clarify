# Step 3: Add Transaction Safety to replaceForTemplate

**Status**: SUCCESS
**Specialist**: database-schema

## Changes Made

**File**: `db/repositories/template-placeholders.repository.ts`
- Wrapped delete and insert operations in `replaceForTemplate` within a `db.transaction()` block for atomicity

## Implementation Details

The `replaceForTemplate` method now uses Drizzle ORM's transaction API:

```typescript
replaceForTemplate(
  templateId: number,
  placeholders: Array<Omit<NewTemplatePlaceholder, "templateId">>
): Array<TemplatePlaceholder> {
  return db.transaction((tx) => {
    // Delete existing placeholders for this template
    tx.delete(templatePlaceholders)
      .where(eq(templatePlaceholders.templateId, templateId))
      .run();

    // Insert new placeholders if any
    if (placeholders.length === 0) {
      return [];
    }

    const dataWithTemplateId = placeholders.map((p) => ({
      ...p,
      templateId,
    }));

    return tx
      .insert(templatePlaceholders)
      .values(dataWithTemplateId)
      .returning()
      .all();
  });
}
```

## Key Implementation Details

- Uses `db.transaction((tx) => { ... })` pattern from Drizzle ORM
- All operations inside the transaction use the `tx` transaction object instead of `db`
- If the insert operation fails, the entire transaction is automatically rolled back
- No explicit try-catch needed since Drizzle ORM handles rollback automatically

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] Delete and insert operations are wrapped in a transaction
- [x] Transaction rollback occurs on insert failure
- [x] No TypeScript errors
- [x] All validation commands pass

## Notes

This is the first transaction pattern in the codebase. Other repositories could follow this pattern for similar atomic operations.

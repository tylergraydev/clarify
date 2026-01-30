# Step 6: Fetch Stored Placeholder Metadata in TemplatePickerDialog

**Status**: SUCCESS
**Specialist**: frontend-component

## Changes Made

**File**: `components/workflows/template-picker-dialog.tsx`

- Import for `TemplatePlaceholder` type from `@/types/electron`
- Import for `useTemplatePlaceholders` hook from `@/hooks/queries/use-templates`
- New `mapDatabasePlaceholderToParsed()` function that converts database `TemplatePlaceholder` to component's `ParsedPlaceholder` format
- New `mapDatabasePlaceholdersToParsed()` function that maps and sorts placeholders by `orderIndex`
- Updated `parsedPlaceholders` memo to first try fetching from database, falling back to regex parsing when no stored placeholders exist

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] Placeholder validation patterns from database are applied during form validation
- [x] Placeholder descriptions and metadata are displayed to users
- [x] Fallback to regex parsing works for templates without stored placeholders
- [x] All validation commands pass

## Notes

The `validationPattern` field from `TemplatePlaceholder` is now properly mapped and used in `validatePlaceholderValue()`. The `description`, `displayName`, and `defaultValue` fields are now properly mapped from database placeholders.

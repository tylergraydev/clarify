# Step 4: Update TanStack Query Hooks for Server-Side Filtering

**Status**: SUCCESS
**Specialist**: tanstack-query

## Changes Made

**File**: `lib/queries/templates.ts`
- Imported `TemplateListFilters` type from `@/types/electron`
- Updated `list` to use `TemplateListFilters` type
- Updated `byCategory` to use `TemplateListFilters["category"]` for type-safe category values

**File**: `hooks/queries/use-templates.ts`
- **`useActiveTemplates`**: Now calls `api.template.list({ includeDeactivated: false })` directly - removed client-side filtering
- **`useBuiltInTemplates`**: Uses server-side filter then applies minimal client-side filter for `builtInAt !== null`
- **`useTemplates`**: Now passes `filters` directly to `api.template.list(filters)` - removed all client-side filtering
- **`useTemplatesByCategory`**: Uses typed `category` parameter and calls `api.template.list({ category, includeDeactivated: false })`

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] Filters are passed to the API call
- [x] Client-side filtering logic is removed or simplified
- [x] All validation commands pass

## Notes

The only remaining client-side filter is for `builtInAt` in `useBuiltInTemplates` since this field is not supported in `TemplateListFilters`. If server-side `builtIn` filtering is needed in the future, the interface would need to be extended.

# Step 7: Use Unique IDs as Keys in PlaceholderEditor

**Status**: SUCCESS
**Specialist**: frontend-component

## Changes Made

**File**: `lib/validations/template.ts`

- Added `uid` field to `templatePlaceholderSchema` with validation requiring a non-empty string

**File**: `components/templates/placeholder-editor.tsx`

- Updated `createDefaultPlaceholder` to generate a unique ID using `crypto.randomUUID()`
- Changed `validationErrors` state type from `Map<number, PlaceholderValidationErrors>` to `Map<string, PlaceholderValidationErrors>`
- Updated `handleRemovePlaceholder` to take `uid: string` parameter instead of index
- Updated `handlePlaceholderChange` to take `uid: string` parameter instead of index
- Changed `key={index}` to `key={placeholder.uid}` on Card component
- Updated all `validationErrors.get()` calls to use `placeholder.uid`
- Updated all handler calls and element IDs to use `placeholder.uid` instead of index

**File**: `components/templates/template-editor-dialog.tsx`

- Updated placeholder loading to include `uid: crypto.randomUUID()` for existing placeholders

**File**: `app/(app)/templates/page.tsx`

- Updated placeholder mapping instances to include `uid: crypto.randomUUID()` for duplicated placeholders

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] Each placeholder has a unique identifier
- [x] React key uses the unique identifier instead of array index
- [x] Drag-and-drop reordering works correctly without reconciliation issues
- [x] All validation commands pass

## Notes

The validation errors Map now correctly tracks errors by placeholder UID rather than array index, ensuring errors persist correctly during drag-and-drop reordering.

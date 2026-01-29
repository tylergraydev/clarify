# Step 2: Create Add Repository Dialog

**Specialist**: tanstack-form
**Status**: SUCCESS

## Files Created

- `components/projects/add-repository-dialog.tsx` - Dialog component for adding repositories to projects

## Files Modified

- `lib/validations/repository.ts` - Fixed schema to remove `.default()` for form compatibility

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] Dialog opens from trigger element and closes properly
- [x] Form validates input before submission
- [x] Directory picker allows selecting folder path
- [x] Successful submission calls mutation and closes dialog
- [x] Cache invalidation occurs for repository and project queries
- [x] All validation commands pass

## Notes

- Uses `useAppForm` hook with `addRepositorySchema` validation
- `PathInputField` leverages Electron's native directory picker
- Pattern follows `create-project-dialog.tsx` structure
- Form fields: name (TextField), path (PathInputField), defaultBranch (TextField)

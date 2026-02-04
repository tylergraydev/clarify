# Step 9: Create File Edit and Add Dialogs

**Status**: SUCCESS
**Specialist**: tanstack-form
**Duration**: Completed

## Files Created

- `components/workflows/edit-discovered-file-dialog.tsx` - Edit dialog for modifying discovered file metadata
- `components/workflows/add-file-dialog.tsx` - Add dialog for manually adding files to discovery list

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] Dialogs follow existing dialog patterns with Base UI
- [x] Forms properly validate all required fields
- [x] Edit dialog pre-fills with existing file data
- [x] Add dialog validates path as non-empty string
- [x] Priority and Action dropdowns use correct options

## Component Details

### EditDiscoveredFileDialog

- Controlled dialog pattern with `isOpen` and `onOpenChange` props
- Displays file path as read-only
- Pre-fills form with existing file data
- Includes `ConfirmDiscardDialog` for unsaved changes protection
- Uses `useUpdateDiscoveredFile` mutation
- Toast notifications for success/error

### AddFileDialog

- Supports both controlled and uncontrolled modes
- Optional `trigger` prop for uncontrolled usage
- Default values: `priority: 'medium'`, `action: 'modify'`
- Uses `useAddDiscoveredFile` mutation
- Toast notifications for success/error

## Form Fields

| Field | Component | Dialog |
|-------|-----------|--------|
| Path | TextField | Add only (readonly display in Edit) |
| Priority | SelectField | Both |
| Action | SelectField | Both |
| Role | TextareaField | Both |
| Relevance | TextareaField | Both |

## TanStack Form Patterns

- Used `useAppForm` hook
- Validation schemas from `lib/validations/discovered-file.ts`
- Native form with `preventDefault` and `stopPropagation`
- `SubmitButton` wrapped in `form.AppForm`

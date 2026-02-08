# Step 2: File Discovery

## Step Metadata

- **Status**: Completed
- **Duration**: ~81s
- **Files Discovered**: 15 examined, 10 relevant
- **Directories Explored**: 8

## Discovered Files

### Critical Priority (Require Modification)

| File | Action | Reasoning |
|------|--------|-----------|
| `components/workflows/create-workflow-dialog.tsx` | MODIFY | Main dialog - add autoStart toggle, conditional submit text, hook integration |
| `lib/validations/workflow.ts` | MODIFY | Add autoStart to Zod schema and TypeScript type |
| `components/workflows/workflows-tab-content.tsx` | MODIFY | Update onSuccess callback to receive workflow, add navigation |

### Reference Only (No Modification Needed)

| File | Reasoning |
|------|-----------|
| `hooks/queries/use-workflows.ts` | useCreateWorkflow({ autoStart }) already implemented at lines 112-144 |
| `components/ui/form/switch-field.tsx` | SwitchField component ready to use |
| `components/ui/form/submit-button.tsx` | SubmitButton pattern reference |
| `components/workflows/edit-workflow-dialog.tsx` | Similar dialog pattern reference |
| `db/schema/workflows.schema.ts` | Confirms autoStart NOT in database |
| `electron/ipc/workflow.handlers.ts` | Confirms separate create/start IPC operations |
| `lib/queries/workflows.ts` | Query key factory, cache invalidation reference |

### Key Patterns Identified

- Form values watched via: `useStore(form.store, (state) => state.values.fieldName)`
- Conditional fields: `{isPlanning && <Fragment>...</Fragment>}`
- Navigation: `router.push($path({ route: '/workflows/[id]', routeParams: { id } }))`
- Toggle: `<form.AppField name="fieldName">{(field) => <field.SwitchField ... />}</form.AppField>`

### Architecture Insights

1. The useCreateWorkflow hook already accepts `{ autoStart?: boolean }` and handles the complete create-then-start flow
2. autoStart is purely UI-side; no database, IPC, or repository changes needed
3. The navigation pattern using $path with type-safe routing is well-established
4. The skipClarification toggle provides an exact template for the new autoStart toggle

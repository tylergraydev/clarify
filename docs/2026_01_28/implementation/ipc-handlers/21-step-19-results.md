# Step 19: Create TanStack Query Hooks for Audit and Discovery

**Status**: SUCCESS

## Files Created
- `hooks/queries/use-audit-logs.ts` - Audit log query and mutation hooks
- `hooks/queries/use-discovered-files.ts` - Discovered files query and mutation hooks

## Validation Results
- pnpm lint --fix: PASS
- pnpm typecheck: PASS

## Audit Hooks Created
| Hook | Purpose |
|------|---------|
| `useAuditLogs()` | Fetch all audit logs |
| `useAuditLogsByWorkflow(workflowId)` | Fetch by workflow |
| `useAuditLogsByStep(stepId)` | Fetch by step |
| `useCreateAuditLog()` | Create audit log |
| `useExportAuditLog()` | Export audit log |

## Discovery Hooks Created
| Hook | Purpose |
|------|---------|
| `useDiscoveredFiles(stepId)` | Fetch files by step |
| `useIncludedFiles(stepId)` | Fetch included files |
| `useAddDiscoveredFile()` | Add discovered file |
| `useUpdateDiscoveredFile()` | Update discovered file |
| `useIncludeFile()` | Include file |
| `useExcludeFile()` | Exclude file |

## Success Criteria
- [x] Audit export returns formatted string
- [x] Discovery hooks handle batch operations
- [x] Include/exclude mutations update cache
- [x] All validation commands pass

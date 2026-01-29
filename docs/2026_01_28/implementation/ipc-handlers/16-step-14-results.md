# Step 14: Create Query Key Definitions

**Status**: SUCCESS

## Files Created

- `lib/queries/index.ts` - Merged query keys export
- `lib/queries/workflows.ts` - Workflow query keys
- `lib/queries/steps.ts` - Step query keys
- `lib/queries/agents.ts` - Agent query keys
- `lib/queries/templates.ts` - Template query keys
- `lib/queries/projects.ts` - Project query keys
- `lib/queries/repositories.ts` - Repository query keys
- `lib/queries/audit-logs.ts` - Audit log query keys
- `lib/queries/discovered-files.ts` - Discovered files query keys

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Query Keys Summary

| Entity               | Keys                                                              |
| -------------------- | ----------------------------------------------------------------- |
| `workflowKeys`       | list, detail, byProject, byStatus, byType, running                |
| `stepKeys`           | list, detail, byWorkflow                                          |
| `agentKeys`          | list, detail, byProject, byType, active, builtIn                  |
| `templateKeys`       | list, detail, byCategory, active, builtIn                         |
| `projectKeys`        | list, detail                                                      |
| `repositoryKeys`     | list, detail, byProject, default                                  |
| `auditLogKeys`       | list, detail, byWorkflow, byWorkflowStep, byEventCategory, recent |
| `discoveredFileKeys` | list, detail, byWorkflowStep, included                            |

## Success Criteria

- [x] All entity query keys defined with proper structure
- [x] Keys merged and exported from index.ts
- [x] `QueryKeys` type inferred correctly
- [x] All validation commands pass

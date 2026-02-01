# Column Sorting - Routing Table

**Created**: 2026-02-01

## Routing Table

| Step | Title | Specialist | Files |
|------|-------|------------|-------|
| 1 | Update DEFAULT_PERSISTED_KEYS | tanstack-table | hooks/use-table-persistence.ts |
| 2 | Add Sorting State Handler to DataTable | tanstack-table | components/ui/table/data-table.tsx |
| 3 | Update Agent Table Persistence | tanstack-table | components/agents/agent-table.tsx |
| 4 | Update Project Table Persistence | tanstack-table | components/projects/project-table.tsx |
| 5 | Update Workflow Table Persistence | tanstack-table | components/workflows/workflow-table.tsx |
| 6 | Manual Integration Testing | orchestrator | N/A (testing only) |

## Specialist Selection Rationale

All implementation steps involve TanStack Table components and hooks, making `tanstack-table` the appropriate specialist for steps 1-5.

## Execution Plan

Steps 1-5 will be delegated to the tanstack-table subagent. Step 6 (manual testing) will be handled by quality gates.

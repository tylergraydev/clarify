# Implementation Setup and Routing

**Date**: 2026-01-28

## Routing Table

| Step | File(s)                                            | Specialist      |
| ---- | -------------------------------------------------- | --------------- |
| 1    | db/schema/projects.schema.ts                       | database-schema |
| 2    | db/schema/repositories.schema.ts                   | database-schema |
| 3    | db/schema/worktrees.schema.ts                      | database-schema |
| 4    | db/schema/workflows.schema.ts                      | database-schema |
| 5    | db/schema/workflow-repositories.schema.ts          | database-schema |
| 6    | db/schema/workflow-steps.schema.ts                 | database-schema |
| 7    | db/schema/discovered-files.schema.ts               | database-schema |
| 8    | db/schema/agents.schema.ts                         | database-schema |
| 9    | db/schema/agent-tools.schema.ts                    | database-schema |
| 10   | db/schema/agent-skills.schema.ts                   | database-schema |
| 11   | db/schema/templates.schema.ts                      | database-schema |
| 12   | db/schema/template-placeholders.schema.ts          | database-schema |
| 13   | db/schema/implementation-plans.schema.ts           | database-schema |
| 14   | db/schema/implementation-plan-steps.schema.ts      | database-schema |
| 15   | db/schema/implementation-plan-step-files.schema.ts | database-schema |
| 16   | db/schema/audit-logs.schema.ts                     | database-schema |
| 17   | db/schema/settings.schema.ts                       | database-schema |
| 18   | db/schema/index.ts (barrel export)                 | database-schema |
| 19   | db/index.ts (update with schema)                   | database-schema |
| 20   | db/repositories/\*.ts                              | database-schema |

## Execution Strategy

Due to the interdependencies between schemas (foreign keys reference each other), we need to implement schemas in dependency order:

**Phase A - Foundation (no dependencies):**

- projects, agents, templates, settings

**Phase B - First-level dependencies:**

- repositories (depends on projects)
- workflows (depends on projects)
- agent-tools, agent-skills (depend on agents)
- template-placeholders (depends on templates)

**Phase C - Second-level dependencies:**

- worktrees (depends on repositories, workflows)
- workflow-repositories (depends on workflows, repositories)
- workflow-steps (depends on workflows, agents)
- implementation-plans (depends on workflows)

**Phase D - Third-level dependencies:**

- discovered-files (depends on workflow-steps)
- implementation-plan-steps (depends on implementation-plans, agents)
- audit-logs (depends on workflows, workflow-steps)

**Phase E - Fourth-level dependencies:**

- implementation-plan-step-files (depends on implementation-plan-steps)

## Status

✅ Setup complete - MILESTONE:PHASE_2_COMPLETE

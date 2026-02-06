# Routing Table

## Step-to-Specialist Assignment

| Step | Title | Specialist Agent | Key Files |
|------|-------|-----------------|-----------|
| 1 | Create agent_activity schema | `database-schema` | db/schema/agent-activity.schema.ts, db/schema/index.ts |
| 2 | Generate database migration | `database-schema` | drizzle/*.sql |
| 3 | Create agent activity repository | `database-schema` | db/repositories/agent-activity.repository.ts, db/repositories/index.ts |
| 4 | Add IPC channels, handlers, preload | `ipc-handler` | electron/ipc/channels.ts, electron/ipc/agent-activity.handlers.ts, electron/ipc/index.ts, electron/preload.ts, types/electron.d.ts |
| 5 | Add query keys and React Query hook | `tanstack-query` | lib/queries/agent-activity.ts, hooks/queries/use-agent-activity.ts, lib/queries/index.ts, hooks/queries/index.ts, hooks/use-electron.ts |
| 6 | Intercept stream events in AgentSdkExecutor | `general-purpose` | electron/services/agent-step/agent-sdk-executor.ts, electron/services/agent-step/usage-stats.ts |
| 7 | Pass activity repository through step services | `general-purpose` | electron/services/clarification-step.service.ts, electron/services/refinement-step.service.ts, electron/services/file-discovery.service.ts, electron/ipc/index.ts |
| 8 | Transform persisted activity to StreamToolEvent | `general-purpose` | lib/utils/agent-activity-transform.ts |
| 9 | Update WorkflowStreamingPanel for historical fallback | `frontend-component` | components/workflows/detail/workflow-streaming-panel.tsx |
| 10 | Quality gates and verification | Orchestrator | N/A |

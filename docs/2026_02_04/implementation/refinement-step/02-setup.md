# Setup and Routing Table

**Created**: 2026-02-04T17:48:38

## Routing Table

| Step | Title | Specialist Agent | Files |
|------|-------|------------------|-------|
| 1 | Create Zod validation schemas | `tanstack-form` | `lib/validations/refinement.ts` |
| 2 | Add refinement agent to seed | `database-schema` | `db/seed/agents.seed.ts` |
| 3 | Create RefinementStepService | `claude-agent-sdk` | `electron/services/refinement-step.service.ts` |
| 4 | Add IPC channel definitions | `ipc-handler` | `electron/ipc/channels.ts`, `electron/preload.ts` |
| 5 | Create refinement IPC handlers | `ipc-handler` | `electron/ipc/refinement.handlers.ts`, `electron/ipc/index.ts` |
| 6 | Update preload and type definitions | `ipc-handler` | `electron/preload.ts`, `types/electron.d.ts` |
| 7 | Create query key factory and hooks | `tanstack-query` | `lib/queries/refinement.ts`, `hooks/queries/use-refinement.ts`, `hooks/queries/use-default-refinement-agent.ts`, `lib/queries/index.ts` |
| 8 | Create Zustand store | `zustand-store` | `lib/stores/refinement-store.ts` |
| 9 | Create RefinementStreaming component | `frontend-component` | `components/workflows/refinement-streaming.tsx` |
| 10 | Create RefinementEditor component | `frontend-component` | `components/workflows/refinement-editor.tsx` |
| 11 | Create RefinementWorkspace component | `frontend-component` | `components/workflows/refinement-workspace.tsx` |
| 12 | Integrate into PipelineView | `frontend-component` | `components/workflows/pipeline-view.tsx` |
| 13 | Implement error handling and retry | `claude-agent-sdk` | `electron/services/refinement-step.service.ts`, UI components |
| 14 | Wire up stale discovery indicator | `frontend-component` | `components/workflows/pipeline-view.tsx`, `components/workflows/discovery-workspace.tsx` |
| 15 | Add custom agent selection support | `frontend-component` | `components/workflows/pipeline-view.tsx`, `hooks/queries/use-refinement.ts` |

## Dependency Analysis

### Independent Steps (can run first)
- Step 1: Zod schemas - no dependencies
- Step 2: Agent seed - no dependencies

### Sequential Steps
- Steps 3-6: Service → IPC channels → IPC handlers → Preload (must be in order)
- Steps 7-8: Query hooks + Zustand store (can be parallel, after Step 6)
- Steps 9-11: UI components (depend on Steps 1-8)
- Steps 12-15: Integration (depend on all previous)

## Milestone

`MILESTONE:PHASE_2_COMPLETE`

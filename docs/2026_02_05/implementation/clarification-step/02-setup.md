# Setup & Routing Table

**Date**: 2026-02-05

## Routing Table

| Step | Title | Specialist Agent | Key Files |
|------|-------|-----------------|-----------|
| 1 | Create Clarification Query Key Factory | `tanstack-query` | `lib/queries/clarification.ts`, `lib/queries/index.ts` |
| 2 | Create Electron IPC Wrapper Hook | `general-purpose` | `hooks/electron/domains/use-electron-clarification.ts`, `hooks/use-electron.ts` |
| 3 | Create Clarification React Query Hooks | `tanstack-query` | `hooks/queries/use-clarification.ts`, `hooks/queries/index.ts` |
| 4 | Extend Workflow Detail Zustand Store | `zustand-store` | `lib/stores/workflow-detail-store.ts` |
| 5 | Create Clarification Streaming Hook | `general-purpose` | `hooks/use-clarification-stream.ts` |
| 6 | Create Clarification Question Form | `tanstack-form` | `components/workflows/detail/steps/clarification-question-form.tsx` |
| 7 | Create Agent Selector Dropdown | `frontend-component` | `components/workflows/detail/steps/clarification-agent-selector.tsx` |
| 8 | Rewrite Clarification Step Content | `frontend-component` | `components/workflows/detail/steps/clarification-step-content.tsx` |
| 9 | Wire Accordion to Real Step Data | `frontend-component` | `components/workflows/detail/workflow-step-accordion.tsx` |
| 10 | Integrate Clarification Stream into Streaming Panel | `frontend-component` | `components/workflows/detail/workflow-streaming-panel.tsx` |
| 11 | Wire Workflow Detail Page | `page-route` | `app/(app)/workflows/[id]/page.tsx` |
| 12 | Update Barrel Exports | `general-purpose` | Various index files |

## Dependencies

- Steps 1, 2, 4, 5, 7 can start in parallel (no dependencies)
- Step 3 depends on Steps 1 & 2
- Step 6 depends on Steps 3 & 4
- Step 8 depends on Steps 3, 4, 5, 6, 7
- Step 9 depends on Step 8
- Step 10 depends on Step 5
- Step 11 depends on Step 9
- Step 12 depends on Step 11
- Quality Gates depend on Step 12

## Execution Strategy

Launch Steps 1, 2, 4, 5, 7 in parallel first wave, then cascade dependencies.

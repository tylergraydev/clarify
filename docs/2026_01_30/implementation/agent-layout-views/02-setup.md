# Implementation Setup - Agent Layout Views

## Routing Table

| Step | Title                                     | Specialist           | Files                                                                   |
| ---- | ----------------------------------------- | -------------------- | ----------------------------------------------------------------------- |
| 1    | Create Layout Constants File              | `general-purpose`    | `lib/layout/constants.ts`                                               |
| 2    | Create Agent Layout Zustand Store         | `general-purpose`    | `lib/stores/agent-layout-store.ts`                                      |
| 3    | Create Layout Provider for Hydration      | `frontend-component` | `components/providers/agent-layout-provider.tsx`                        |
| 4    | Integrate Layout Provider into App Layout | `frontend-component` | `app/(app)/layout.tsx` or `app/(app)/agents/page.tsx`                   |
| 5    | Create AgentList Component                | `frontend-component` | `components/agents/agent-list.tsx`                                      |
| 6    | Create AgentTable Component               | `frontend-component` | `components/agents/agent-table.tsx`                                     |
| 7    | Create AgentLayoutToggle Component        | `frontend-component` | `components/agents/agent-layout-toggle.tsx`                             |
| 8    | Create Shared AgentGridItem Component     | `frontend-component` | `components/agents/agent-grid-item.tsx`, modify tab content files       |
| 9    | Create AgentLayoutRenderer Component      | `frontend-component` | `components/agents/agent-layout-renderer.tsx`                           |
| 10   | Update GlobalAgentsTabContent             | `frontend-component` | `components/agents/global-agents-tab-content.tsx`                       |
| 11   | Update ProjectAgentsTabContent            | `frontend-component` | `components/agents/project-agents-tab-content.tsx`                      |
| 12   | Add Layout Toggle to Agents Page          | `frontend-component` | `app/(app)/agents/page.tsx`                                             |
| 13   | Create Loading Skeletons                  | `frontend-component` | `components/agents/agent-list-skeleton.tsx`, `agent-table-skeleton.tsx` |
| 14   | Manual Testing                            | N/A                  | Testing only                                                            |

## Specialist Distribution

- **general-purpose**: Steps 1, 2 (constants and Zustand store)
- **frontend-component**: Steps 3-13 (all React components)
- **Manual Testing**: Step 14

## Execution Order

Steps will be executed sequentially as defined in the plan.

## Status

✅ Routing table complete - ready for Phase 3 (Step Execution)

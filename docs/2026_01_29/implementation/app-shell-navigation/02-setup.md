# Implementation Setup - Routing Table

**Feature**: App Shell & Navigation Layout

## Routing Table

| Step | Title                                              | Specialist Agent   | Files                                                           |
| ---- | -------------------------------------------------- | ------------------ | --------------------------------------------------------------- |
| 1    | Create Zustand Shell Store                         | general-purpose    | lib/stores/shell-store.ts                                       |
| 2    | Create Shell Component Directory and Barrel Export | general-purpose    | components/shell/index.ts                                       |
| 3    | Create NavItem Component                           | frontend-component | components/shell/NavItem.tsx, components/shell/index.ts         |
| 4    | Create ProjectSelector Component                   | frontend-component | components/shell/ProjectSelector.tsx, components/shell/index.ts |
| 5    | Create AppHeader Component                         | frontend-component | components/shell/AppHeader.tsx, components/shell/index.ts       |
| 6    | Create StatusBar Component                         | frontend-component | components/shell/StatusBar.tsx, components/shell/index.ts       |
| 7    | Create AppSidebar Component                        | frontend-component | components/shell/AppSidebar.tsx, components/shell/index.ts      |
| 8    | Create Route Group Layout                          | general-purpose    | app/(app)/layout.tsx                                            |
| 9    | Create Placeholder Dashboard Page                  | general-purpose    | app/(app)/dashboard/page.tsx                                    |
| 10   | Create Remaining Placeholder Pages                 | general-purpose    | app/(app)/workflows/\*\*, templates, agents, settings           |
| 11   | Add CSS Variables for Shell Layout                 | general-purpose    | app/globals.css                                                 |
| 12   | Update Root Page to Redirect                       | general-purpose    | app/page.tsx                                                    |
| 13   | Integration Testing and Visual Verification        | general-purpose    | Any files requiring fixes                                       |

## Agent Selection Rationale

- **Steps 3-7**: Use `frontend-component` agent - creating UI components with CVA patterns
- **Steps 1-2, 8-13**: Use `general-purpose` agent - store creation, layout, pages, CSS, integration

## Execution Plan

Execute steps sequentially, with each step validating via `pnpm lint:fix && pnpm typecheck` before proceeding.

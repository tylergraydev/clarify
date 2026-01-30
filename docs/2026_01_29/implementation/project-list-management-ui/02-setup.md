# Setup and Routing Table

**Feature**: Project List & Management UI
**Phase**: 2 - Routing and Setup

## Routing Table

| Step | Title                                            | Specialist         | Files                                            |
| ---- | ------------------------------------------------ | ------------------ | ------------------------------------------------ |
| 1    | Extend Shell Store with Selected Project State   | general-purpose    | `lib/stores/shell-store.ts`                      |
| 2    | Extend Project Query Keys for Archived Filtering | tanstack-query     | `lib/queries/projects.ts`                        |
| 3    | Add Archive/Unarchive Mutation Hooks             | tanstack-query     | `hooks/queries/use-projects.ts`                  |
| 4    | Add Projects Navigation Item to Sidebar          | frontend-component | `components/shell/app-sidebar.tsx`               |
| 5    | Create Project Card Component                    | frontend-component | `components/projects/project-card.tsx`           |
| 6    | Create Confirm Archive Dialog Component          | frontend-component | `components/projects/confirm-archive-dialog.tsx` |
| 7    | Create Project Table Component                   | frontend-component | `components/projects/project-table.tsx`          |
| 8    | Create Create Project Dialog Component           | tanstack-form      | `components/projects/create-project-dialog.tsx`  |
| 9    | Create Project List Page                         | general-purpose    | `app/(app)/projects/page.tsx`                    |
| 10   | Create Project Detail Page with Tabbed Layout    | general-purpose    | `app/(app)/projects/[id]/page.tsx`               |
| 11   | Integrate Project Selector with Shell Store      | frontend-component | `components/shell/project-selector.tsx`          |
| 12   | Add Type-Safe Route Definitions                  | general-purpose    | Run `pnpm next-typesafe-url`                     |

## Quality Gate Schedule

- **Quality Gate 1**: After Step 4 (Navigation Foundation Complete)
- **Quality Gate 2**: After Step 8 (Components Complete)
- **Quality Gate 3**: After Step 12 (Feature Complete)

## Specialist Assignments

### general-purpose (4 steps)

- Step 1: Shell Store extension
- Step 9: Project List Page
- Step 10: Project Detail Page
- Step 12: Route definitions

### tanstack-query (2 steps)

- Step 2: Query key factory updates
- Step 3: Archive/Unarchive mutation hooks

### frontend-component (5 steps)

- Step 4: Sidebar navigation
- Step 5: Project Card
- Step 6: Confirm Archive Dialog
- Step 7: Project Table
- Step 11: Project Selector integration

### tanstack-form (1 step)

- Step 8: Create Project Dialog with form

## Status

- Phase 1: COMPLETE
- Phase 2: COMPLETE
- Phase 3: PENDING (Step Execution)

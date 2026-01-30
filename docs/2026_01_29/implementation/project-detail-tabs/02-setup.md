# Setup and Routing Table

## Step-to-Specialist Routing Table

| Step | Title                               | Specialist           | Target Files                                                       |
| ---- | ----------------------------------- | -------------------- | ------------------------------------------------------------------ |
| 1    | Create Repository Validation Schema | `tanstack-form`      | `lib/validations/repository.ts`                                    |
| 2    | Create Add Repository Dialog        | `tanstack-form`      | `components/projects/add-repository-dialog.tsx`                    |
| 3    | Create Repository Card Component    | `frontend-component` | `components/repositories/repository-card.tsx`                      |
| 4    | Create Repositories Tab Content     | `frontend-component` | `components/projects/repositories-tab-content.tsx`                 |
| 5    | Create Workflows Tab Content        | `frontend-component` | `components/projects/workflows-tab-content.tsx`                    |
| 6    | Create Project Agent Editor Dialog  | `tanstack-form`      | `components/projects/project-agent-editor-dialog.tsx`              |
| 7    | Create Settings Tab Content         | `frontend-component` | `components/projects/settings-tab-content.tsx`                     |
| 8    | Update Project Detail Page          | `general-purpose`    | `app/(app)/projects/[id]/page.tsx`                                 |
| 9    | Create Index Export Files           | `general-purpose`    | `components/repositories/index.ts`, `components/projects/index.ts` |

## Specialist Assignment Summary

- **tanstack-form** (3 steps): Steps 1, 2, 6 - validation schemas and form dialogs
- **frontend-component** (4 steps): Steps 3, 4, 5, 7 - card and tab content components
- **general-purpose** (2 steps): Steps 8, 9 - page updates and barrel exports

## Execution Order

Steps will be executed in order (1-9) as there are dependencies:

- Step 1 (schema) → Step 2 (dialog uses schema)
- Step 3 (card) → Step 4 (tab uses card)
- Steps 2, 4 → Step 8 (page uses tab components)
- All steps → Step 9 (exports need all components)

**MILESTONE:PHASE_2_COMPLETE**

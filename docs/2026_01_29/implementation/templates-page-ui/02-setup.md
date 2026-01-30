# Implementation Setup - Routing Table

**Feature**: Templates Page UI
**Total Steps**: 15

## Step-to-Specialist Routing Table

| Step | Title                                            | Specialist         | Files                                                                                                                       |
| ---- | ------------------------------------------------ | ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| 1    | Create Template Validation Schemas               | tanstack-form      | `lib/validations/template.ts`                                                                                               |
| 2    | Build Template Card Component                    | frontend-component | `components/templates/template-card.tsx`                                                                                    |
| 3    | Build Placeholder Editor Component               | frontend-component | `components/templates/placeholder-editor.tsx`                                                                               |
| 4    | Build Template Editor Dialog Component           | tanstack-form      | `components/templates/template-editor-dialog.tsx`                                                                           |
| 5    | Implement Templates Page Core Layout             | general-purpose    | `app/(app)/templates/page.tsx`                                                                                              |
| 6    | Add Table View Layout Option                     | general-purpose    | `app/(app)/templates/page.tsx`                                                                                              |
| 7    | Wire Template List Interactions                  | general-purpose    | `app/(app)/templates/page.tsx`                                                                                              |
| 8    | Implement Template Search and Filter Logic       | general-purpose    | `app/(app)/templates/page.tsx`                                                                                              |
| 9    | Create Template Picker Component                 | tanstack-form      | `components/workflows/template-picker-dialog.tsx`                                                                           |
| 10   | Integrate Template Picker into Workflow Creation | general-purpose    | `app/(app)/workflows/new/page.tsx`                                                                                          |
| 11   | Add Template Usage Tracking                      | tanstack-query     | `components/workflows/template-picker-dialog.tsx`, `hooks/queries/use-templates.ts`                                         |
| 12   | Add Keyboard Shortcuts and Accessibility         | general-purpose    | Multiple files                                                                                                              |
| 13   | Add Loading Skeletons and Optimistic Updates     | frontend-component | `app/(app)/templates/page.tsx`, `components/templates/template-editor-dialog.tsx`                                           |
| 14   | Add Template Duplicate Functionality             | general-purpose    | `app/(app)/templates/page.tsx`, `components/templates/template-card.tsx`, `components/templates/template-editor-dialog.tsx` |
| 15   | Add Bulk Actions for Template Management         | general-purpose    | `app/(app)/templates/page.tsx`                                                                                              |

## Specialist Distribution

- **tanstack-form**: Steps 1, 4, 9 (validation schemas, complex forms)
- **frontend-component**: Steps 2, 3, 13 (UI components)
- **tanstack-query**: Step 11 (query hooks)
- **general-purpose**: Steps 5, 6, 7, 8, 10, 12, 14, 15 (page implementations, integrations)

## Milestone

`MILESTONE:PHASE_2_COMPLETE`

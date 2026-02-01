# Implementation Setup - Routing Table

**Feature**: Templates Management Page
**Total Steps**: 16

## Routing Table

| Step | Title | Specialist Agent | Files |
|------|-------|------------------|-------|
| 1 | Create Layout Constants for Templates | general-purpose | `lib/layout/constants.ts` |
| 2 | Create Template Layout Zustand Store | zustand-store | `lib/stores/template-layout-store.ts` |
| 3 | Create Template Filters Hook | general-purpose | `hooks/templates/use-template-filters.ts` |
| 4 | Create Filtered Templates Hook | general-purpose | `hooks/templates/use-filtered-templates.ts` |
| 5 | Create Template Dialogs Hook | general-purpose | `hooks/templates/use-template-dialogs.ts` |
| 6 | Create Template Actions Hook | tanstack-query | `hooks/templates/use-template-actions.ts` |
| 7 | Create Confirm Delete Template Dialog | frontend-component | `components/templates/confirm-delete-template-dialog.tsx` |
| 8 | Create Template Placeholders Section | frontend-component | `components/templates/template-placeholders-section.tsx` |
| 9 | Create Template Editor Dialog | tanstack-form | `components/templates/template-editor-dialog.tsx` |
| 10 | Create Template Table Toolbar | frontend-component | `components/templates/template-table-toolbar.tsx` |
| 11 | Create Template Table Component | tanstack-table | `components/templates/template-table.tsx` |
| 12 | Create Templates Page Header | frontend-component | `app/(app)/templates/_components/templates-page-header.tsx` |
| 13 | Create Templates Page Skeleton | frontend-component | `app/(app)/templates/_components/templates-page-skeleton.tsx` |
| 14 | Create Templates Dialogs Container | frontend-component | `app/(app)/templates/_components/templates-dialogs.tsx` |
| 15 | Create Templates Page | page-route | `app/(app)/templates/page.tsx` |
| 16 | Final Integration Testing | general-purpose | All files (review and fix) |

## Specialist Selection Rationale

- **Step 1**: general-purpose - Simple constants addition to existing file
- **Step 2**: zustand-store - Creating Zustand store with persistence
- **Steps 3-5**: general-purpose - Custom hooks with TypeScript/React patterns
- **Step 6**: tanstack-query - Hook integrating with TanStack Query mutations
- **Steps 7-8**: frontend-component - UI components with Base UI + CVA
- **Step 9**: tanstack-form - Form dialog with TanStack Form
- **Step 10**: frontend-component - Toolbar component with filters
- **Step 11**: tanstack-table - TanStack Table implementation
- **Steps 12-14**: frontend-component - Page-level UI components
- **Step 15**: page-route - Next.js App Router page
- **Step 16**: general-purpose - Integration testing and cleanup

## Execution Plan

All steps will be executed sequentially with validation after each step.

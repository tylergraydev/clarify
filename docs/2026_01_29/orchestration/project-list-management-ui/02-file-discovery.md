# Step 2: AI-Powered File Discovery

**Start Time**: 2026-01-29T00:02:00Z
**End Time**: 2026-01-29T00:03:00Z
**Duration**: ~60 seconds
**Status**: Completed

## Input

**Refined Feature Request:**
Implement the Project List & Management UI to provide users with a centralized interface for managing projects, which serve as the organizational container for all workflows and repositories in Clarify. The implementation leverages the complete data layer already in place with full CRUD operations, IPC handlers via the project domain, and React hooks (useProjects, useCreateProject, useUpdateProject, useDeleteProject, useProject), making this a low-risk, high-visibility feature that unblocks downstream work on repository management and workflow creation. The project list page should support both card and table view layouts using existing Card and Table UI components built on Base UI primitives with Tailwind CSS 4 and CVA styling, displaying project name, description, creation date, and archive status with visual indicators for archived projects. Implement a create project dialog using existing TanStack Form field components (TextField, Textarea) that validates project names are unique and non-empty, integrating with the useCreateProject hook for optimistic updates via TanStack Query with proper cache invalidation through the query key factory pattern. Add archive/unarchive functionality as inline actions in both views that toggle the archivedAt timestamp field, with confirmation dialogs to prevent accidental operations. Create a project detail page with a tabbed layout placeholder using the existing Tabs component, structured to accommodate future tabs for repositories, workflows, and settings, with breadcrumb navigation returning to the list. Ensure all list and detail views are responsive, support keyboard navigation and screen reader accessibility through Base UI's unstyled primitives, display loading and error states using existing data display components, and utilize URL query state synchronization via nuqs for view preferences (list vs card view) and filtering. Wire the project context throughout by passing the selected project ID through route parameters and storing it in the Zustand shell store for sidebar navigation updates, ensuring the project selector in the app header reflects the currently active project context.

## Discovery Analysis Summary

- **Directories Explored**: 10
- **Candidate Files Examined**: 65+
- **Highly Relevant Files**: 25
- **Supporting Files**: 20

## Discovered Files by Priority

### Critical (Must Modify/Create)

| File Path                                | Action               | Relevance                                                                   |
| ---------------------------------------- | -------------------- | --------------------------------------------------------------------------- |
| `app/(app)/projects/page.tsx`            | **Create**           | Project list page - main entry for card/table view with filtering           |
| `app/(app)/projects/[id]/page.tsx`       | **Create**           | Project detail page with tabbed layout for repositories/workflows/settings  |
| `hooks/queries/use-projects.ts`          | **Modify**           | Need to add useArchiveProject, useUnarchiveProject mutations                |
| `lib/stores/shell-store.ts`              | **Modify**           | Must add selectedProjectId for project context                              |
| `components/shell/app-sidebar.tsx`       | **Modify**           | Must add Projects nav item                                                  |
| `db/repositories/projects.repository.ts` | **Reference/Modify** | Already has archive/unarchive methods - may need findAll filter enhancement |

### High Priority (Essential Patterns/Integration)

| File Path                               | Action        | Relevance                                                               |
| --------------------------------------- | ------------- | ----------------------------------------------------------------------- |
| `db/schema/projects.schema.ts`          | **Reference** | Defines Project and NewProject types with archivedAt, name, description |
| `electron/ipc/project.handlers.ts`      | **Modify**    | May need archive/unarchive IPC endpoints                                |
| `electron/ipc/channels.ts`              | **Modify**    | May need archive/unarchive channels                                     |
| `electron/preload.ts`                   | **Modify**    | May need archive/unarchive methods                                      |
| `types/electron.d.ts`                   | **Modify**    | May need archive/unarchive method types                                 |
| `lib/queries/projects.ts`               | **Modify**    | Need to extend for archived filters                                     |
| `lib/forms/form-hook.ts`                | **Reference** | TanStack Form hook factory with field components                        |
| `components/shell/project-selector.tsx` | **Modify**    | Should update with selected project context                             |
| `components/shell/app-header.tsx`       | **Modify**    | Needs to integrate with shell store selectedProjectId                   |

### Medium Priority (Supporting Components)

| File Path                                  | Action        | Relevance                                    |
| ------------------------------------------ | ------------- | -------------------------------------------- |
| `components/ui/card.tsx`                   | **Reference** | Card components for card view                |
| `components/ui/dialog.tsx`                 | **Reference** | Dialog components for create/confirm dialogs |
| `components/ui/tabs.tsx`                   | **Reference** | Tabs components for project detail layout    |
| `components/ui/button.tsx`                 | **Reference** | Button with variants for actions             |
| `components/ui/icon-button.tsx`            | **Reference** | IconButton for inline actions                |
| `components/ui/empty-state.tsx`            | **Reference** | EmptyState for no projects                   |
| `components/ui/badge.tsx`                  | **Reference** | Badge for archived status indicator          |
| `components/ui/form/text-field.tsx`        | **Reference** | TextField for project name                   |
| `components/ui/form/textarea-field.tsx`    | **Reference** | TextareaField for project description        |
| `components/ui/form/submit-button.tsx`     | **Reference** | SubmitButton for form submission             |
| `components/data/query-error-boundary.tsx` | **Reference** | QueryErrorBoundary for error states          |
| `components/ui/select.tsx`                 | **Reference** | Select for view mode switcher                |
| `components/ui/tooltip.tsx`                | **Reference** | Tooltip for icon button hints                |

### Low Priority (Context/Utilities)

| File Path                       | Action        | Relevance                  |
| ------------------------------- | ------------- | -------------------------- |
| `app/(app)/layout.tsx`          | **Reference** | App shell layout pattern   |
| `app/(app)/dashboard/page.tsx`  | **Reference** | Page structure pattern     |
| `app/(app)/agents/page.tsx`     | **Reference** | Simple page pattern        |
| `app/layout.tsx`                | **Reference** | Root layout with providers |
| `lib/utils.ts`                  | **Reference** | cn utility function        |
| `hooks/use-electron.ts`         | **Reference** | useElectron hook           |
| `hooks/use-toast.ts`            | **Reference** | useToast for notifications |
| `types/component-types.ts`      | **Reference** | Global type definitions    |
| `db/index.ts`                   | **Reference** | Database connection        |
| `components/shell/nav-item.tsx` | **Reference** | NavItem for sidebar links  |
| `app/globals.css`               | **Reference** | Global CSS and theme vars  |
| `next-typesafe-url.config.ts`   | **Reference** | Type-safe routing          |

## Key Patterns Discovered

### 1. Query Hook Pattern

Each domain has a dedicated `use-*.ts` file in `hooks/queries/`:

- Query hooks using `useQuery` with query key factory
- Mutation hooks using `useMutation` with cache invalidation
- `useElectron` hook for API access with `enabled: isElectron` guard

### 2. Query Key Factory Pattern

`@lukemorales/query-key-factory` in `lib/queries/*.ts`:

- Centralized key definitions
- Type-safe filter parameters
- Cache invalidation through `queryKey.list._def`

### 3. CVA Component Pattern

UI components use `class-variance-authority`:

- Variant-based styling (size, variant props)
- Tailwind CSS class composition
- Base UI primitive wrapping

### 4. IPC Handler Pattern

Each domain has:

- Channel definitions in `electron/ipc/channels.ts`
- Handler registration in `electron/ipc/*.handlers.ts`
- Preload bridge in `electron/preload.ts`
- Type declarations in `types/electron.d.ts`

### 5. Page Structure Pattern

Pages follow consistent structure:

- Page heading with h1 and description
- Content area with responsive grid
- Card components for sections

### 6. Form Pattern

TanStack Form with:

- `useAppForm` hook from `lib/forms/form-hook.ts`
- Pre-registered field components
- Zod validation integration

## Existing Similar Functionality

- **ProjectSelector** (`components/shell/project-selector.tsx`): Already implements project selection
- **useProjects hooks** (`hooks/queries/use-projects.ts`): Full CRUD hooks implemented
- **Projects repository** (`db/repositories/projects.repository.ts`): Complete with archive/unarchive

## Components to Create

| Component            | Path                                             | Purpose                                |
| -------------------- | ------------------------------------------------ | -------------------------------------- |
| ProjectListPage      | `app/(app)/projects/page.tsx`                    | Main list with card/table toggle       |
| ProjectDetailPage    | `app/(app)/projects/[id]/page.tsx`               | Detail with tabbed layout              |
| CreateProjectDialog  | `components/projects/create-project-dialog.tsx`  | Dialog with TanStack Form              |
| ProjectCard          | `components/projects/project-card.tsx`           | Card view item with actions            |
| ProjectTable         | `components/projects/project-table.tsx`          | Table view (needs Table UI primitives) |
| ConfirmArchiveDialog | `components/projects/confirm-archive-dialog.tsx` | Confirmation dialog                    |
| Breadcrumbs          | `components/ui/breadcrumbs.tsx`                  | Breadcrumb navigation (missing)        |
| Table                | `components/ui/table.tsx`                        | Table primitives (missing)             |

## File Validation Results

All discovered file paths validated against file system:

- **Existing files**: All reference files exist and are accessible
- **Files to create**: Directory structure exists (`app/(app)/`, `components/`)
- **Missing UI primitives identified**: Table, Breadcrumbs need to be created

## Discovery Statistics

| Category              | Count  |
| --------------------- | ------ |
| Critical files        | 6      |
| High priority files   | 9      |
| Medium priority files | 13     |
| Low priority files    | 17     |
| **Total discovered**  | **45** |
| Files to create       | 8      |
| Files to modify       | 10     |
| Files for reference   | 27     |

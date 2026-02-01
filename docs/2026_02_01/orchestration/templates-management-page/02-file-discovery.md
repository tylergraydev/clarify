# Step 2: File Discovery

**Status**: Completed
**Timestamp**: 2026-02-01
**Duration**: ~30 seconds

## Refined Request Used

The templates management page should provide a comprehensive interface for viewing, creating, editing, and managing workflow templates within the Clarify application, following the established pattern from the agents page at `app/(app)/agents/page.tsx`. This page will display templates in a TanStack Table with columns for name, category, description, usage count, and status (built-in vs custom, active vs deactivated), supporting sorting, filtering by category (backend, data, electron, security, ui), and search by name or description. [...]

## Discovery Analysis

### Exploration Summary
- Explored 15 directories
- Examined 52 candidate files
- Found 25 highly relevant files (existing infrastructure)
- Identified 15 files that need to be created

## Discovered Files

### Critical Priority (Must Create - Core Implementation)

| File Path | Description |
|-----------|-------------|
| `app/(app)/templates/page.tsx` | Main templates page component |
| `components/templates/template-table.tsx` | TanStack Table implementation |
| `components/templates/template-table-toolbar.tsx` | Toolbar with filters |
| `components/templates/template-editor-dialog.tsx` | Create/edit dialog |
| `components/templates/template-placeholders-section.tsx` | Placeholder management |
| `components/templates/confirm-delete-template-dialog.tsx` | Delete confirmation |
| `app/(app)/templates/_components/templates-page-header.tsx` | Page header with title and counts |
| `app/(app)/templates/_components/templates-page-skeleton.tsx` | Loading skeleton |
| `app/(app)/templates/_components/templates-dialogs.tsx` | Dialog container |
| `hooks/templates/use-template-filters.ts` | Filter state management |
| `hooks/templates/use-template-dialogs.ts` | Dialog state management |
| `hooks/templates/use-template-actions.ts` | CRUD action handlers |
| `hooks/templates/use-filtered-templates.ts` | Client-side filtering |
| `lib/stores/template-layout-store.ts` | Zustand store for UI preferences |

### High Priority (Existing - Core Infrastructure - COMPLETE)

| File Path | Description | Status |
|-----------|-------------|--------|
| `db/schema/templates.schema.ts` | Template database schema | COMPLETE |
| `db/schema/template-placeholders.schema.ts` | Placeholder schema | COMPLETE |
| `db/repositories/templates.repository.ts` | Template CRUD operations | COMPLETE |
| `db/repositories/template-placeholders.repository.ts` | Placeholder CRUD | COMPLETE |
| `electron/ipc/template.handlers.ts` | IPC handlers | COMPLETE |
| `hooks/queries/use-templates.ts` | TanStack Query hooks | COMPLETE |
| `lib/queries/templates.ts` | Query key factory | COMPLETE |
| `lib/validations/template.ts` | Zod schemas | COMPLETE |
| `types/electron.d.ts` | TypeScript types | COMPLETE |

### High Priority (Reference Patterns)

| File Path | Description | Why Reference |
|-----------|-------------|---------------|
| `app/(app)/agents/page.tsx` | Agents page implementation | Primary pattern - page structure |
| `components/agents/agent-table.tsx` | Agent TanStack Table | Table pattern - columns, actions |
| `components/agents/agent-table-toolbar.tsx` | Toolbar with popover filters | Toolbar pattern |
| `components/agents/agent-editor-dialog.tsx` | Complex editor dialog | Dialog pattern |
| `hooks/agents/use-agent-filters.ts` | Filter state hook | Hook pattern |
| `hooks/agents/use-agent-dialogs.ts` | Dialog reducer hook | State pattern |
| `lib/stores/agent-layout-store.ts` | Zustand store | Store pattern |

### Medium Priority (Supporting Components - Reuse Directly)

| File Path | Description | Usage |
|-----------|-------------|-------|
| `components/ui/table/data-table.tsx` | DataTable component | Import for template table |
| `components/ui/dialog.tsx` | Dialog primitives | Import for dialogs |
| `components/ui/select.tsx` | Select component | Use for category filter |
| `components/ui/form/text-field.tsx` | Text input field | Use for name, description |
| `components/ui/form/textarea-field.tsx` | Textarea field | Use for template body |
| `components/ui/form/select-field.tsx` | Select form field | Use for category in form |
| `components/ui/form/switch-field.tsx` | Switch toggle field | Use for required toggle |
| `components/ui/form/number-field.tsx` | Number input field | Use for orderIndex |
| `lib/forms/index.ts` | useAppForm hook | Form initialization |

### Low Priority (Already Exported - No Changes Needed)

| File Path | Status |
|-----------|--------|
| `db/schema/index.ts` | Already exports template schemas |
| `db/repositories/index.ts` | Already exports template repositories |
| `hooks/queries/index.ts` | Already exports template hooks |
| `lib/queries/index.ts` | Already exports templateKeys |
| `electron/ipc/index.ts` | Already registers template handlers |

## Architecture Insights

### Existing Infrastructure Status

The templates feature has **complete backend infrastructure**:

1. **Database Layer**: Full schema with templates and template_placeholders tables
2. **Repository Layer**: Complete CRUD operations with specialized methods
3. **IPC Layer**: All handlers registered and working
4. **Query Layer**: Full TanStack Query implementation with optimistic updates
5. **Validation Layer**: Zod schemas for all form operations

### Pattern Recommendations

Based on the agents page implementation:

1. **Page Structure**: Skeleton → QueryErrorBoundary → Header → Table → Dialogs
2. **State Management**: useReducer for dialogs, useState + Zustand for filters
3. **Table**: DataTable with memoized cells, row styling, action menu
4. **Editor**: TanStack Form with Zod validation, collapsible placeholder section

## File Validation Results

All discovered file paths validated:
- Existing files: 25 confirmed to exist
- New files: 15 paths validated for creation

# Step 2: File Discovery

**Started**: 2026-01-29T00:01:00Z
**Completed**: 2026-01-29T00:02:30Z
**Status**: Completed
**Duration**: ~90 seconds

## Input

### Refined Feature Request

Implement a comprehensive templates page UI in `app/(app)/templates/` that provides full template library management capabilities, building on the existing complete backend infrastructure including the templates schema, template-placeholders schema, template repository with CRUD operations, TanStack Query hooks (useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate), and IPC handlers. The page should feature a template list view with both card grid and table layout options similar to the existing agents page pattern, incorporating search and filter functionality to help users discover templates by category, name, or placeholder content. Include a create template dialog accessible via a prominent action button, featuring form fields for template name, category selection, description, and a placeholder management interface that allows users to define placeholders with properties including name, display name, description, default value, validation pattern (regex), and order index, using the existing TanStack Form field components from `components/ui/form/`. Provide an edit template dialog with the same form structure plus support for viewing usage count and toggling the active/deactivated state. Enhance the workflow creation experience by improving template selection with a searchable template picker that displays placeholder previews and allows users to fill in placeholder values before inserting the template content into the feature request field. All components should follow the established Base UI and CVA patterns found in `components/ui/`, utilize the Tailwind CSS 4.x styling conventions, integrate with the existing TanStack Query hooks for optimistic updates and cache invalidation, and provide appropriate empty states, loading states, error boundaries, and toast notifications consistent with the app shell design. This is purely a frontend implementation task requiring no backend modifications since all database schemas, repositories, and IPC channels are already complete and functional.

## Discovery Results

### Statistics

- **Directories Explored**: 12+
- **Files Examined**: 60+
- **Relevant Files Found**: 35
- **Categories Covered**: Schema, Repository, Query Hooks, IPC Handlers, UI Primitives, Form Components, Pattern References

---

## Discovered Files by Priority

### CRITICAL - Core Infrastructure (Must Reference)

| File                                        | Category     | Relevance                                                                                                                                                                               |
| ------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `db/schema/templates.schema.ts`             | Schema       | Template entity with category enum (backend, data, electron, security, ui), fields for name, description, templateText, usageCount, builtInAt, deactivatedAt                            |
| `db/schema/template-placeholders.schema.ts` | Schema       | Placeholder schema with name, displayName, description, defaultValue, validationPattern, orderIndex, requiredAt                                                                         |
| `db/repositories/templates.repository.ts`   | Repository   | Complete CRUD with 13 methods: create, update, delete, findAll, findActive, findBuiltIn, findByCategory, findById, findByName, activate, deactivate, incrementUsageCount                |
| `electron/ipc/template.handlers.ts`         | IPC Handler  | All template IPC operations: list, get, create, update, delete (deactivate), incrementUsage                                                                                             |
| `hooks/queries/use-templates.ts`            | Query Hook   | 9 hooks: useTemplates, useTemplate, useActiveTemplates, useBuiltInTemplates, useTemplatesByCategory, useCreateTemplate, useUpdateTemplate, useDeleteTemplate, useIncrementTemplateUsage |
| `app/(app)/templates/page.tsx`              | Page         | Current placeholder page to be replaced                                                                                                                                                 |
| `components/ui/card.tsx`                    | UI Primitive | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter                                                                                                                   |
| `components/ui/dialog.tsx`                  | UI Primitive | DialogRoot, DialogTrigger, DialogPortal, DialogBackdrop, DialogPopup, DialogTitle, DialogDescription, DialogClose                                                                       |

### HIGH - Pattern References (Should Follow)

| File                                        | Category          | Relevance                                                                                                                  |
| ------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `app/(app)/agents/page.tsx`                 | Pattern Reference | Complete reference: nuqs URL state, client-side filtering, skeleton loading, empty states, grid layout, dialog integration |
| `components/agents/agent-card.tsx`          | Pattern Reference | Card component: color indicator, title, description, type badge, active/deactivated switch, action buttons                 |
| `components/agents/agent-editor-dialog.tsx` | Pattern Reference | Dialog form: TanStack Form with useAppForm, field components, mutations with loading states                                |
| `lib/forms/form-hook.ts`                    | Form System       | Custom form hook with field component registry                                                                             |

### HIGH - Form Components (Will Use)

| File                                    | Category       | Relevance                                        |
| --------------------------------------- | -------------- | ------------------------------------------------ |
| `components/ui/form/text-field.tsx`     | Form Component | Text input with label, validation, error display |
| `components/ui/form/textarea-field.tsx` | Form Component | Multiline text for template content              |
| `components/ui/form/select-field.tsx`   | Form Component | Category selection dropdown                      |
| `components/ui/form/number-field.tsx`   | Form Component | orderIndex for placeholders                      |
| `components/ui/form/switch-field.tsx`   | Form Component | Boolean toggles                                  |

### HIGH - UI Primitives (Will Use)

| File                            | Category     | Relevance                                                    |
| ------------------------------- | ------------ | ------------------------------------------------------------ |
| `components/ui/button.tsx`      | UI Primitive | Buttons with variants (default, outline, ghost, destructive) |
| `components/ui/badge.tsx`       | UI Primitive | Category badges, status indicators                           |
| `components/ui/empty-state.tsx` | UI Primitive | "No templates" and "no results" states                       |
| `components/ui/input.tsx`       | UI Primitive | Search input                                                 |
| `components/ui/select.tsx`      | UI Primitive | Category filter dropdown                                     |
| `components/ui/switch.tsx`      | UI Primitive | Active/inactive toggle                                       |
| `components/ui/textarea.tsx`    | UI Primitive | Template content editor                                      |

### MEDIUM - Supporting Infrastructure

| File                                       | Category         | Relevance                                                  |
| ------------------------------------------ | ---------------- | ---------------------------------------------------------- |
| `electron/ipc/channels.ts`                 | IPC Channels     | Channel constants for template operations                  |
| `types/electron.d.ts`                      | Type Definitions | ElectronAPI.template interface, Template/NewTemplate types |
| `lib/queries/templates.ts`                 | Query Keys       | Query key factory for cache management                     |
| `components/data/query-error-boundary.tsx` | Error Handling   | Error boundary wrapper with retry                          |
| `hooks/use-toast.ts`                       | Feedback         | Toast notifications                                        |
| `lib/utils.ts`                             | Utilities        | cn() function for class merging                            |

### LOW - Optional Reference

| File                          | Category     | Relevance                              |
| ----------------------------- | ------------ | -------------------------------------- |
| `components/ui/separator.tsx` | UI Primitive | Visual separation between sections     |
| `components/ui/tabs.tsx`      | UI Primitive | If implementing card/table view toggle |
| `components/ui/tooltip.tsx`   | UI Primitive | Placeholder field context              |
| `lib/validations/agent.ts`    | Validation   | Zod schema pattern reference           |

---

## Architecture Insights

### Pattern to Follow (from Agents Page)

1. **URL State Management**: nuqs with parseAsString, parseAsBoolean for search, filters, showDeactivated
2. **Client-Side Filtering**: Fetch all data, filter in memory
3. **Loading States**: Skeleton components matching card structure
4. **Empty States**: Differentiate "no data" vs "no filtered results"
5. **Grid Layout**: Responsive (md:grid-cols-2 lg:grid-cols-3)
6. **Dialog Integration**: Hidden trigger ref pattern
7. **Mutation Handling**: Optimistic updates + cache invalidation

### Template-Specific Requirements

1. **Placeholder Management UI**: Dynamic form for placeholders with:
   - name (identifier)
   - displayName (user-facing)
   - description
   - defaultValue
   - validationPattern (regex)
   - orderIndex (sorting)
   - requiredAt (required flag)

2. **Template Content Editor**: Large textarea with {{placeholder}} syntax

3. **Category Badge Mapping**: CVA variants for 5 categories (backend, data, electron, security, ui)

4. **Usage Count Display**: Read-only field in edit dialog

5. **Built-in Indicator**: Use builtInAt to show "Built-in Template" badge

### Missing Infrastructure (To Create)

- Template card component (components/templates/template-card.tsx)
- Template editor dialog (components/templates/template-editor-dialog.tsx)
- Placeholder management component (components/templates/placeholder-editor.tsx)
- Zod validation schema (lib/validations/template.ts)

---

## Validation Results

- **Minimum Files Requirement**: PASS (35 files discovered, minimum was 3)
- **File Existence**: All files verified to exist
- **Content Analysis**: Files read and analyzed for relevance
- **Comprehensive Coverage**: All architectural layers covered

---

_MILESTONE:STEP_2_COMPLETE_

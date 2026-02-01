# Step 2: AI-Powered File Discovery

**Step Start**: 2026-02-01T00:02:00Z
**Step End**: 2026-02-01T00:03:00Z
**Duration**: ~60 seconds
**Status**: Completed

## Refined Request Input

Users should be able to mark projects as favorites for quick and convenient access across multiple locations in the application. A favorite toggle should be implemented as a clickable star icon in the projects table that allows users to mark or unmark projects as favorites with a single click. Favorited projects should be prominently displayed in three key areas: a dedicated Favorites section in the sidebar for quick navigation, a Favorites widget on the dashboard for at-a-glance access to commonly used projects, and at the top of the projects list table with a visual star indicator to distinguish them from non-favorited projects.

## Discovery Analysis

- Explored 9 directories across database, IPC, hooks, components, and pages layers
- Examined 35+ candidate files
- Found 13 highly relevant files requiring modification
- Identified 1 file requiring creation
- Discovered 8 reference files for patterns and context

## Discovered Files

### Critical Priority (Must modify/create)

| File Path | Action | Reason |
|-----------|--------|--------|
| `db/schema/projects.schema.ts` | Modify | Add `isFavorite` boolean column to projects table schema |
| `db/repositories/projects.repository.ts` | Modify | Add `toggleFavorite()` method and `findFavorites()` query method |
| `electron/ipc/channels.ts` | Modify | Add `project:toggleFavorite` and `project:listFavorites` channel definitions |
| `electron/preload.ts` | Modify | Add `toggleFavorite` and `listFavorites` methods to project API bridge |
| `electron/ipc/project.handlers.ts` | Modify | Register handlers for `toggleFavorite` and `listFavorites` IPC channels |
| `hooks/queries/use-projects.ts` | Modify | Add `useToggleFavorite` mutation and `useFavoriteProjects` query hooks |
| `components/projects/project-table.tsx` | Modify | Add Star icon column for favorite toggle, implement sorting favorites first |

### High Priority (Should modify/create)

| File Path | Action | Reason |
|-----------|--------|--------|
| `components/shell/app-sidebar.tsx` | Modify | Add conditionally rendered Favorites section with collapsible navigation |
| `app/(app)/dashboard/page.tsx` | Modify | Add FavoritesWidget to dashboard grid layout |
| `components/dashboard/favorites-widget.tsx` | Create | New widget component for displaying favorite projects on dashboard |
| `types/electron.d.ts` | Modify | Update ElectronAPI interface to include new project favorite methods |
| `hooks/use-electron.ts` | Modify | Add `toggleFavorite` and `listFavorites` methods to projects domain |
| `lib/queries/projects.ts` | Modify | Add query key for favorites list to support proper cache invalidation |

### Medium Priority (May need modification)

| File Path | Action | Reason |
|-----------|--------|--------|
| `lib/validations/project.ts` | Modify | May need to update validation schemas if isFavorite is user-editable |
| `hooks/queries/index.ts` | Modify | Export new `useToggleFavorite` and `useFavoriteProjects` hooks |
| `db/schema/index.ts` | Verify | Ensure projects schema exports are correct |
| `db/repositories/index.ts` | Verify | Ensure repository exports include any new methods |
| `components/projects/index.ts` | Modify | May need to export new favorite-related components if created |
| `app/(app)/projects/page.tsx` | Modify | May need to handle favorite toggle state management |

### Low Priority (Reference/context only)

| File Path | Action | Reason |
|-----------|--------|--------|
| `components/dashboard/active-workflows-widget.tsx` | Reference | Pattern for creating dashboard widgets with query hooks |
| `components/shell/nav-item.tsx` | Reference | Pattern for creating sidebar navigation items |
| `components/ui/badge.tsx` | Reference | UI component for styling, if needed for favorite indicator |
| `electron/ipc/index.ts` | Reference | Shows how IPC handlers are registered with repositories |
| `db/repositories/agents.repository.ts` | Reference | Pattern for repository method implementation |
| `components/ui/collapsible.tsx` | Reference | Already used in sidebar for collapsible sections |
| `components/projects/project-table-toolbar.tsx` | Reference | Pattern for table toolbar filters |
| `components/projects/confirm-archive-dialog.tsx` | Reference | Pattern for similar toggle actions with confirmation |

## Architecture Insights

### Existing Patterns Discovered

1. **Database Layer Pattern**: Projects schema uses SQLite with Drizzle ORM, following `text` columns for timestamps. The `archivedAt` column is a model for toggleable state (though `isFavorite` should be `integer` for boolean).

2. **Repository Pattern**: The `projects.repository.ts` uses factory function pattern (`createProjectsRepository`) returning typed methods. New methods follow same pattern as `archive`/`unarchive`.

3. **IPC Handler Pattern**: Channels defined in `channels.ts`, duplicated in `preload.ts`, handlers registered in domain files. Uses `ipcMain.handle` with try/catch error logging.

4. **Query Hook Pattern**: Uses `@tanstack/react-query` with query key factories from `@lukemorales/query-key-factory`. Mutations follow optimistic update patterns with cache invalidation.

5. **Sidebar Collapsible Pattern**: Sidebar uses `Collapsible` components from Base UI for Workflows section - exact pattern needed for Favorites section.

6. **Dashboard Widget Pattern**: Widgets use `Card` with `CardHeader`, `CardTitle`, `CardDescription`, and `CardContent`. Wrapped in `QueryErrorBoundary` with loading/empty states.

### Integration Points Identified

1. **Cache Invalidation**: Toggling favorites should invalidate `projectKeys.list` and a new `projectKeys.favorites` query key.

2. **Table Sorting**: DataTable supports custom sorting - favorites sorted to top via custom sort function or data order modification.

3. **Sidebar Rendering**: Conditional rendering based on having favorites (like Workflows collapsible based on active state).

4. **Type Exports**: `Project` type flows from `db/schema` through `types/electron.d.ts` - `isFavorite` field will flow automatically once added.

### Migration Required

After schema modification:
- Run `pnpm db:generate` to create migration
- Run `pnpm db:migrate` to apply migration

## File Validation Results

All discovered file paths validated to exist in the codebase. One file to be created:
- `components/dashboard/favorites-widget.tsx` - New file

## Summary

- **Total files discovered**: 25
- **Files to modify**: 15
- **Files to create**: 1 (favorites-widget.tsx)
- **Reference files**: 8

---

**Progress Marker**: MILESTONE:STEP_2_COMPLETE

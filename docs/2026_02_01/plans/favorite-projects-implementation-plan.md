# Implementation Plan: Favorite Projects Feature

**Generated**: 2026-02-01
**Original Request**: "As a user I would like the ability to favorite projects for quick access"
**Refined Request**: Users should be able to mark projects as favorites for quick and convenient access across multiple locations in the application. A favorite toggle should be implemented as a clickable star icon in the projects table that allows users to mark or unmark projects as favorites with a single click. Favorited projects should be prominently displayed in three key areas: a dedicated Favorites section in the sidebar for quick navigation, a Favorites widget on the dashboard for at-a-glance access to commonly used projects, and at the top of the projects list table with a visual star indicator to distinguish them from non-favorited projects. The feature should be minimal in scope, supporting only the ability to toggle favorite status on and off without imposing any limits on the number of projects that can be favorited or providing manual reordering capabilities. The favorite status should persist across sessions using the existing SQLite database, allowing the application to remember user preferences.

## Analysis Summary

- Feature request refined with project context
- Discovered 25 files across 9 directories
- Generated 10-step implementation plan

## File Discovery Results

### Critical Priority (Must modify)
| File | Action | Reason |
|------|--------|--------|
| db/schema/projects.schema.ts | Modify | Add isFavorite column |
| db/repositories/projects.repository.ts | Modify | Add toggleFavorite(), findFavorites() methods |
| electron/ipc/channels.ts | Modify | Add channel definitions |
| electron/preload.ts | Modify | Add API bridge methods |
| electron/ipc/project.handlers.ts | Modify | Register handlers |
| hooks/queries/use-projects.ts | Modify | Add useToggleFavorite mutation, useFavoriteProjects query |
| components/projects/project-table.tsx | Modify | Add Star icon column, sorting |

### High Priority (Should modify/create)
| File | Action | Reason |
|------|--------|--------|
| components/shell/app-sidebar.tsx | Modify | Add Favorites collapsible section |
| app/(app)/dashboard/page.tsx | Modify | Add FavoritesWidget |
| components/dashboard/favorites-widget.tsx | Create | New widget component |
| types/electron.d.ts | Modify | Update ElectronAPI interface |
| hooks/use-electron.ts | Modify | Add methods to projects domain |
| lib/queries/projects.ts | Modify | Add favorites query key |

---

## Overview

**Estimated Duration**: 4-6 hours
**Complexity**: Low
**Risk Level**: Low

## Quick Summary

This feature adds the ability to mark projects as favorites with a single-click star icon toggle in the projects table. Favorited projects will appear prominently in three locations: a dedicated Favorites section in the sidebar, a Favorites widget on the dashboard, and at the top of the projects list with visual star indicators. The implementation extends the existing Drizzle schema, repository, IPC layer, TanStack Query hooks, and React components following established codebase patterns.

## Prerequisites

- [ ] Database is accessible and migrations can be generated/applied
- [ ] Development environment running (`pnpm electron:dev`)
- [ ] No pending uncommitted changes that conflict with project files

## Implementation Steps

### Step 1: Extend Database Schema and Repository

**What**: Add `isFavorite` boolean column to projects table and create repository methods for favorite operations.
**Why**: The database layer is the foundation for persisting favorite status across sessions.
**Confidence**: High

**Files to Modify:**
- `db/schema/projects.schema.ts` - Add isFavorite column
- `db/repositories/projects.repository.ts` - Add toggleFavorite and findFavorites methods

**Changes:**
- Add `isFavorite` column as integer with default 0 (SQLite boolean convention)
- Add index on `isFavorite` column for efficient filtering
- Add `toggleFavorite(id: number)` method to ProjectsRepository interface and implementation
- Add `findFavorites()` method to ProjectsRepository interface and implementation
- The `toggleFavorite` method should flip the boolean value and return the updated project
- The `findFavorites` method should return all non-archived projects where isFavorite is true

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Schema compiles without TypeScript errors
- [ ] Repository methods have proper return types
- [ ] All validation commands pass

---

### Step 2: Generate and Apply Database Migration

**What**: Generate Drizzle migration for the new isFavorite column and apply it.
**Why**: The database needs to be updated with the new column before IPC and UI can use it.
**Confidence**: High

**Files Created:**
- `drizzle/[generated-name].sql` - Generated migration file

**Changes:**
- Run Drizzle migration generator to create SQL for adding isFavorite column
- Apply migration to development database
- Verify column exists with correct default value (0/false)

**Validation Commands:**
```bash
pnpm db:generate
pnpm db:migrate
```

**Success Criteria:**
- [ ] Migration file generated successfully
- [ ] Migration applied without errors
- [ ] Database contains new isFavorite column with default value

---

### Step 3: Add IPC Channel Definitions and Handlers

**What**: Define IPC channels for favorite operations and register handlers in the main process.
**Why**: Electron IPC is the bridge between the renderer process (React) and the main process (database).
**Confidence**: High

**Files to Modify:**
- `electron/ipc/channels.ts` - Add channel definitions
- `electron/preload.ts` - Add preload API methods (duplicate channels)
- `electron/ipc/project.handlers.ts` - Register new handlers

**Changes:**
- Add `toggleFavorite: 'project:toggleFavorite'` to project channels in both channels.ts and preload.ts
- Add `listFavorites: 'project:listFavorites'` to project channels in both channels.ts and preload.ts
- Add `toggleFavorite(id: number): Promise<Project | undefined>` method to electronAPI.project in preload.ts
- Add `listFavorites(): Promise<Array<Project>>` method to electronAPI.project in preload.ts
- Register `project:toggleFavorite` handler that calls `projectsRepository.toggleFavorite(id)`
- Register `project:listFavorites` handler that calls `projectsRepository.findFavorites()`

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
pnpm electron:compile
```

**Success Criteria:**
- [ ] Channels defined in both channels.ts and preload.ts (kept in sync)
- [ ] Handlers registered with proper error handling pattern
- [ ] TypeScript compiles successfully
- [ ] Electron compile succeeds

---

### Step 4: Update Type Definitions and Electron Hook

**What**: Add TypeScript types for the new IPC methods and extend the useElectronDb hook.
**Why**: Type safety ensures the frontend correctly calls the IPC methods.
**Confidence**: High

**Files to Modify:**
- `types/electron.d.ts` - Add method signatures to ElectronAPI interface
- `hooks/use-electron.ts` - Add methods to projects domain in useElectronDb

**Changes:**
- Add `toggleFavorite(id: number): Promise<Project | undefined>` to ElectronAPI.project interface
- Add `listFavorites(): Promise<Array<Project>>` to ElectronAPI.project interface
- Add `toggleFavorite` method to projects object in useElectronDb that calls throwIfNoApi and invokes the IPC
- Add `listFavorites` method to projects object in useElectronDb that returns empty array when no API

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Type definitions match IPC handler signatures
- [ ] useElectronDb provides typed access to new methods
- [ ] All validation commands pass

---

### Step 5: Add TanStack Query Hooks for Favorites

**What**: Create query key factory entries and React Query hooks for favorite operations.
**Why**: TanStack Query manages server state, caching, and cache invalidation for favorites.
**Confidence**: High

**Files to Modify:**
- `lib/queries/projects.ts` - Add favorites query key
- `hooks/queries/use-projects.ts` - Add useFavoriteProjects query and useToggleFavorite mutation

**Changes:**
- Add `favorites` key to projectKeys factory (no parameters needed)
- Create `useFavoriteProjects()` query hook that fetches `projects.listFavorites()`
- Create `useToggleFavorite()` mutation hook that calls `projects.toggleFavorite(id)`
- Mutation onSuccess should invalidate `projectKeys.list._def`, `projectKeys.favorites`, and the specific project detail key
- Include optimistic update pattern for immediate UI feedback

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Query key factory includes favorites entry
- [ ] useFavoriteProjects query hook created with proper enabled/queryFn
- [ ] useToggleFavorite mutation with proper cache invalidation
- [ ] All validation commands pass

---

### Step 6: Add Star Icon Column to Projects Table

**What**: Add a clickable star icon column to the projects table for toggling favorite status.
**Why**: This is the primary UI for users to mark/unmark projects as favorites.
**Confidence**: High

**Files to Modify:**
- `components/projects/project-table.tsx` - Add favorite column with star icon

**Changes:**
- Import Star icon from lucide-react
- Add `onToggleFavorite` callback prop to ProjectTableProps
- Add `togglingFavoriteIds` Set prop for tracking in-flight mutations
- Create memoized FavoriteCell component with Star icon button
- Add favorite column as first display column (before actions)
- Star should be filled yellow when isFavorite is true, outline when false
- Column should be narrow (size: 40), non-sortable, non-hideable
- Clicking star should call onToggleFavorite(projectId) and stop event propagation
- Add default sorting to show favorites first (isFavorite descending), then by name

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Star column renders in table
- [ ] Click toggles visual state (filled/outline)
- [ ] Favorites appear at top of list
- [ ] Star click does not trigger row navigation
- [ ] All validation commands pass

---

### Step 7: Wire Up Toggle in Projects Page

**What**: Connect the ProjectTable component to the useToggleFavorite mutation.
**Why**: The page component orchestrates data flow between hooks and presentational components.
**Confidence**: High

**Files to Modify:**
- `app/(app)/projects/page.tsx` - Add toggle favorite handling

**Changes:**
- Import useToggleFavorite hook
- Track togglingFavoriteIds state using mutation isPending and variables
- Pass onToggleFavorite callback to ProjectTable that calls toggleFavorite.mutate(id)
- Pass togglingFavoriteIds Set to ProjectTable for loading state indication

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Toggle mutation connected to table
- [ ] Loading state shown during toggle
- [ ] Cache invalidation updates table after toggle
- [ ] All validation commands pass

---

### Step 8: Add Favorites Section to Sidebar

**What**: Create a collapsible Favorites section in the sidebar showing favorite projects.
**Why**: Provides quick navigation access to frequently used projects from anywhere in the app.
**Confidence**: High

**Files to Modify:**
- `components/shell/app-sidebar.tsx` - Add Favorites collapsible section

**Changes:**
- Import Star icon and useFavoriteProjects hook
- Add favorites section after Dashboard item (before Projects)
- Use Collapsible component pattern similar to Workflows
- When sidebar is collapsed, show Star icon with tooltip "Favorites"
- When expanded, show collapsible with favorite project names as NavItem children
- Each favorite project links to its detail page using $path
- Show placeholder text when no favorites exist (in expanded mode only)
- Handle loading and empty states gracefully

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Favorites section appears in sidebar
- [ ] Collapsible behavior matches Workflows pattern
- [ ] Clicking project navigates to detail page
- [ ] Collapsed mode shows Star icon
- [ ] All validation commands pass

---

### Step 9: Create Favorites Dashboard Widget

**What**: Create a new FavoritesWidget component showing favorite projects on the dashboard.
**Why**: Provides at-a-glance access to commonly used projects from the main dashboard.
**Confidence**: High

**Files to Create:**
- `components/dashboard/favorites-widget.tsx` - New widget component

**Files to Modify:**
- `app/(app)/dashboard/page.tsx` - Add FavoritesWidget

**Changes:**
- Create FavoritesWidget following ActiveWorkflowsWidget patterns:
  - Use Card with CardHeader (Star icon + "Favorite Projects" title)
  - Use CardContent with QueryErrorBoundary
  - Create FavoritesContent component for data fetching
  - Display favorite projects as clickable cards/items
  - Show project name and description (truncated)
  - Clicking navigates to project detail page
  - Loading skeleton matching card layout
  - Empty state: "No favorite projects. Star a project to add it here."
- Add FavoritesWidget to dashboard page in a new section after Quick Actions
- Consider 2-column grid with existing sections or dedicated row

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Widget displays in dashboard
- [ ] Favorite projects shown with project info
- [ ] Click navigates to project detail
- [ ] Loading and empty states work correctly
- [ ] All validation commands pass

---

### Step 10: Export Widget and Final Integration

**What**: Export the new widget component and verify all integration points work together.
**Why**: Ensures the component is properly exported and all features work end-to-end.
**Confidence**: High

**Files to Modify:**
- `components/dashboard/index.ts` - Add export if barrel file exists

**Changes:**
- Add export for FavoritesWidget if dashboard has index.ts barrel file
- If no barrel file exists, skip this step (direct imports work)

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Component exports are correct
- [ ] All validation commands pass

---

## Quality Gates

### After Database Layer (Steps 1-2)
- [ ] `pnpm db:generate` creates migration successfully
- [ ] `pnpm db:migrate` applies without errors
- [ ] Schema TypeScript compiles

### After IPC Layer (Steps 3-4)
- [ ] `pnpm electron:compile` succeeds
- [ ] `pnpm typecheck` passes
- [ ] IPC handlers can be tested manually in dev mode

### After Query Layer (Step 5)
- [ ] All TanStack Query hooks have proper types
- [ ] Cache invalidation patterns follow existing conventions

### After UI Layer (Steps 6-10)
- [ ] `pnpm lint && pnpm typecheck` passes
- [ ] Toggle favorite works in projects table
- [ ] Favorites appear in sidebar
- [ ] Dashboard widget shows favorites
- [ ] Navigation from all locations works correctly

### Final Verification
- [ ] Create a new project
- [ ] Toggle favorite on/off in table
- [ ] Verify star icon updates immediately (optimistic update)
- [ ] Verify project appears/disappears from sidebar favorites
- [ ] Verify project appears/disappears from dashboard widget
- [ ] Verify favorites persist after page reload
- [ ] Verify archived projects are excluded from favorites list

## Notes

**Architecture Decisions:**
- Using integer (0/1) for isFavorite column matches SQLite boolean convention used elsewhere in codebase
- Optimistic updates provide immediate feedback without waiting for database roundtrip
- Query invalidation strategy ensures all three display locations stay synchronized

**Considerations:**
- The sidebar favorites section will use the same useFavoriteProjects hook as the dashboard, benefiting from TanStack Query's deduplication
- If many projects are favorited, the sidebar section may need scroll or "see all" behavior in future iteration
- The star icon styling should use fill-yellow-400 for active state to match common favorite patterns

**Risk Mitigations:**
- Each step includes validation commands to catch issues early
- Following established patterns reduces implementation risk
- Incremental implementation allows testing at each layer

# Application Shell, Navigation Layout, and Reusable Components - Implementation Plan

**Generated**: 2026-01-29
**Original Request**: Application shell, navigation layout, and reusable Base-UI components
**Design Reference**: docs/clarify-design-document.md (Section 4.1-4.7)

## Overview

**Estimated Duration**: 3-4 days
**Complexity**: Medium-High
**Risk Level**: Medium

## Quick Summary

This plan implements the Claude Orchestrator application shell with a four-region layout (header, collapsible sidebar, main content area, status bar) as specified in Section 4.1 of the design document. The implementation creates a route group structure at `app/(app)/` with a persistent navigation chrome, Zustand-based state management for sidebar behavior, and reusable shell components following existing CVA/Base UI patterns.

## Analysis Summary

- **Feature Request**: Refined with project context (400 words)
- **Files Discovered**: 25+ relevant files categorized by priority
- **Implementation Steps**: 13 steps with validation

## File Discovery Results

### Critical (Create)
- `app/(app)/layout.tsx` - Route group layout
- `components/shell/AppSidebar.tsx` - Collapsible sidebar
- `components/shell/AppHeader.tsx` - Fixed header
- `components/shell/StatusBar.tsx` - Bottom status bar
- `components/shell/NavItem.tsx` - Navigation item
- `components/shell/ProjectSelector.tsx` - Project dropdown
- `lib/stores/shell-store.ts` - Zustand store

### High (Reference)
- `docs/clarify-design-document.md` - Layout specification
- `app/layout.tsx` - Root providers
- `components/ui/collapsible.tsx` - Collapsible pattern
- `components/ui/select.tsx` - Select pattern
- `components/ui/button.tsx` - CVA pattern

---

## Prerequisites

- [ ] Verify Zustand v5.0.10 is installed (confirmed in package.json)
- [ ] Verify Lucide React icons are available (confirmed: lucide-react v0.562.0)
- [ ] Confirm existing CSS variables for sidebar dimensions are present (confirmed in globals.css)
- [ ] Ensure Base UI v1.1.0 primitives are available (confirmed: 37+ components in components/ui/)

---

## Implementation Steps

### Step 1: Create Zustand Shell Store

**What**: Create a Zustand store to manage sidebar collapsed/expanded state and active navigation tracking
**Why**: Centralized state management for shell UI behavior enables consistent navigation state across all routes
**Confidence**: High

**Files to Create:**

- `lib/stores/shell-store.ts` - Zustand store for shell state

**Changes:**

- Define `ShellState` interface with `isSidebarCollapsed`, `activeNavItem`, and `lastSyncTimestamp` properties
- Define `ShellActions` interface with `toggleSidebar`, `setSidebarCollapsed`, `setActiveNavItem`, and `updateLastSync` actions
- Create store using the curried `create<ShellState & ShellActions>()` pattern per Zustand TypeScript best practices
- Export `useShellStore` hook and `ShellState` type for external usage

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Shell store file exists at `lib/stores/shell-store.ts`
- [ ] Store exports `useShellStore` hook
- [ ] TypeScript types are properly defined and exported
- [ ] All validation commands pass

---

### Step 2: Create Shell Component Directory and Barrel Export

**What**: Create the `components/shell/` directory structure with barrel export file
**Why**: Establishes organizational structure for shell-specific components and enables clean imports
**Confidence**: High

**Files to Create:**

- `components/shell/index.ts` - Barrel export file

**Changes:**

- Create empty barrel export file that will be populated as components are added
- Add placeholder comment indicating upcoming exports

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Directory `components/shell/` exists
- [ ] Barrel export file exists at `components/shell/index.ts`
- [ ] All validation commands pass

---

### Step 3: Create NavItem Component

**What**: Create a reusable navigation item component with CVA variants for active/inactive states and icon support
**Why**: Consistent navigation item styling with support for nested items, icons, and active state detection
**Confidence**: High

**Files to Create:**

- `components/shell/NavItem.tsx` - Navigation item component

**Files to Modify:**

- `components/shell/index.ts` - Add NavItem export

**Changes:**

- Create `navItemVariants` using CVA with `variant` (default/active/nested) and `size` (default/sm) variants
- Implement `NavItem` component accepting `href`, `icon`, `label`, `isActive`, `isNested`, and `isCollapsed` props
- Use Next.js `Link` component for navigation
- Support Lucide React icons via `LucideIcon` type
- Implement collapsed state showing only icon with tooltip
- Add proper TypeScript types for all props using `ComponentPropsWithRef` pattern
- Update barrel export

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] NavItem component exists with CVA variants
- [ ] Component supports both expanded and collapsed sidebar states
- [ ] Icon and label rendering works correctly
- [ ] Active state styling applies via variant
- [ ] Barrel export updated
- [ ] All validation commands pass

---

### Step 4: Create ProjectSelector Component

**What**: Create a project selector dropdown using existing Select primitives
**Why**: Enables users to switch between projects as shown in the header design (Section 4.1)
**Confidence**: High

**Files to Create:**

- `components/shell/ProjectSelector.tsx` - Project selector dropdown

**Files to Modify:**

- `components/shell/index.ts` - Add ProjectSelector export

**Changes:**

- Import existing Select primitives from `components/ui/select`
- Create `ProjectSelector` component that uses `useProjects` hook from `hooks/queries/use-projects`
- Implement loading and empty states
- Handle project selection with callback prop `onProjectChange`
- Style trigger to match header design with compact sizing
- Add collapsed state support showing abbreviated project name or icon only
- Update barrel export

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] ProjectSelector renders projects from useProjects hook
- [ ] Selection triggers onProjectChange callback
- [ ] Loading state displays appropriately
- [ ] Collapsed state shows compact view
- [ ] Barrel export updated
- [ ] All validation commands pass

---

### Step 5: Create AppHeader Component

**What**: Create the fixed header component with logo, hamburger toggle, project selector, and window controls area
**Why**: Implements the header region from Section 4.1 design with sidebar toggle functionality
**Confidence**: High

**Files to Create:**

- `components/shell/AppHeader.tsx` - Fixed header component

**Files to Modify:**

- `components/shell/index.ts` - Add AppHeader export

**Changes:**

- Create `AppHeader` component as a fixed-position header
- Include hamburger menu button (Menu icon from Lucide) that calls `toggleSidebar` from shell store
- Add app logo/title section ("Claude Orchestrator")
- Integrate `ProjectSelector` component
- Add placeholder div for Electron window controls (with `drag-region` and `no-drag` CSS classes)
- Use existing `IconButton` component for hamburger toggle
- Import `useTheme` for potential theme toggle integration point
- Apply proper z-index and border-bottom styling
- Update barrel export

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Header renders with fixed positioning at top
- [ ] Hamburger button toggles sidebar via shell store
- [ ] Project selector displays in header
- [ ] Drag region classes applied for Electron
- [ ] Barrel export updated
- [ ] All validation commands pass

---

### Step 6: Create StatusBar Component

**What**: Create the persistent status bar component displaying active workflow count and last sync timestamp
**Why**: Implements the bottom status bar region from Section 4.1 showing real-time workflow status
**Confidence**: High

**Files to Create:**

- `components/shell/StatusBar.tsx` - Bottom status bar component

**Files to Modify:**

- `components/shell/index.ts` - Add StatusBar export

**Changes:**

- Create `StatusBar` component as a fixed-position footer
- Display active workflow count using data from shell store or workflows query
- Show last sync timestamp from shell store with relative time formatting (using date-fns)
- Add status indicator dot (green/yellow/red) based on system status
- Apply proper z-index, border-top, and background styling matching theme
- Keep height compact (approx 32-40px)
- Update barrel export

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Status bar renders at bottom with fixed positioning
- [ ] Active workflow count displays
- [ ] Last sync timestamp displays with relative time
- [ ] Styling matches design theme
- [ ] Barrel export updated
- [ ] All validation commands pass

---

### Step 7: Create AppSidebar Component

**What**: Create the collapsible sidebar with navigation items for all main sections
**Why**: Implements the left sidebar region from Section 4.1 with full navigation structure
**Confidence**: High

**Files to Create:**

- `components/shell/AppSidebar.tsx` - Collapsible sidebar component

**Files to Modify:**

- `components/shell/index.ts` - Add AppSidebar export

**Changes:**

- Create `AppSidebar` component using existing `Collapsible` primitives for nested sections
- Implement navigation structure: Dashboard, Workflows (with Active: Plan/Impl, History nested), Templates, Agents, Settings
- Use `NavItem` component for each navigation item
- Apply Lucide icons: LayoutDashboard, Workflow, Play, History, FileText, Bot, Settings
- Read `isSidebarCollapsed` from shell store for width transitions
- Use `usePathname` from Next.js for active state detection
- Apply CSS transition for smooth collapse/expand animation using CSS variables
- Implement proper overflow handling for content
- Add separators between logical navigation groups
- Update barrel export

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Sidebar renders with all navigation sections
- [ ] Collapse/expand transitions smoothly using CSS variables
- [ ] Active route detection highlights correct nav item
- [ ] Nested navigation (Workflows > Active/History) works correctly
- [ ] Icons display for all nav items
- [ ] Barrel export updated
- [ ] All validation commands pass

---

### Step 8: Create Route Group Layout

**What**: Create the `app/(app)/layout.tsx` route group layout that assembles all shell components
**Why**: Provides the authenticated shell layout wrapper for all app routes with four-region design
**Confidence**: High

**Files to Create:**

- `app/(app)/layout.tsx` - Route group layout

**Changes:**

- Create layout component that renders AppHeader, AppSidebar, main content area, and StatusBar
- Use CSS Grid or Flexbox for four-region layout
- Main content area renders `children` prop with proper overflow handling
- Apply responsive padding using CSS variables (--padding-content-x, --padding-content-y)
- Ensure layout integrates with existing provider hierarchy (providers are in root layout)
- Handle sidebar width changes via CSS variables and shell store state
- Add proper scroll behavior for main content area

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Layout file exists at `app/(app)/layout.tsx`
- [ ] Four regions render correctly (header, sidebar, main, status bar)
- [ ] Children render in main content area
- [ ] Sidebar width responds to collapsed state
- [ ] Proper overflow handling on main content
- [ ] All validation commands pass

---

### Step 9: Create Placeholder Dashboard Page

**What**: Create a basic dashboard page to verify the shell layout renders correctly
**Why**: Provides initial route content to test the shell layout integration
**Confidence**: High

**Files to Create:**

- `app/(app)/dashboard/page.tsx` - Dashboard page placeholder

**Changes:**

- Create simple page component with "Dashboard" heading
- Add placeholder content indicating where dashboard widgets will go
- Use existing Card component for layout structure if appropriate
- Export as default page component

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Dashboard page exists at `app/(app)/dashboard/page.tsx`
- [ ] Page renders within shell layout
- [ ] Navigation to /dashboard works
- [ ] All validation commands pass

---

### Step 10: Create Remaining Placeholder Pages

**What**: Create placeholder pages for Workflows, Templates, Agents, and Settings routes
**Why**: Ensures all navigation links have valid destinations and shell navigation works end-to-end
**Confidence**: High

**Files to Create:**

- `app/(app)/workflows/page.tsx` - Workflows page placeholder
- `app/(app)/workflows/active/page.tsx` - Active workflows placeholder
- `app/(app)/workflows/history/page.tsx` - Workflow history placeholder
- `app/(app)/templates/page.tsx` - Templates page placeholder
- `app/(app)/agents/page.tsx` - Agents page placeholder
- `app/(app)/settings/page.tsx` - Settings page placeholder

**Changes:**

- Create simple page components for each route
- Each page displays heading matching its route name
- Add placeholder content indicating future functionality
- Export as default page components

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] All placeholder pages exist in their respective directories
- [ ] Each page renders with appropriate heading
- [ ] Navigation between all pages works correctly
- [ ] Active state highlights correctly for each route
- [ ] All validation commands pass

---

### Step 11: Add CSS Variables for Shell Layout

**What**: Add any additional CSS variables needed for shell layout dimensions and transitions
**Why**: Ensures consistent spacing and smooth transitions across shell components
**Confidence**: High

**Files to Modify:**

- `app/globals.css` - Add shell-specific CSS variables

**Changes:**

- Add `--header-height` variable (approximately 56-64px)
- Add `--status-bar-height` variable (approximately 32-40px)
- Add `--sidebar-transition-duration` variable for collapse animation
- Verify existing `--sidebar-width-expanded` and `--sidebar-width-collapsed` values are appropriate
- Add any responsive overrides needed for mobile

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] New CSS variables defined in globals.css
- [ ] Variables integrate with existing theme system
- [ ] Responsive overrides work correctly
- [ ] All validation commands pass

---

### Step 12: Update Root Page to Redirect

**What**: Update the root page to redirect to the dashboard route
**Why**: Ensures users land on the dashboard when accessing the app root
**Confidence**: High

**Files to Modify:**

- `app/page.tsx` - Update to redirect to /dashboard

**Changes:**

- Replace current placeholder content with redirect logic
- Use Next.js `redirect()` function from `next/navigation` to redirect to `/dashboard`
- Alternatively, create a simple landing that links to dashboard

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Root page redirects to /dashboard
- [ ] No 404 errors when accessing root
- [ ] All validation commands pass

---

### Step 13: Integration Testing and Visual Verification

**What**: Verify all shell components work together correctly with theme support
**Why**: Ensures the complete shell layout functions as designed before marking implementation complete
**Confidence**: High

**Files to Modify:**

- Any files requiring fixes discovered during testing

**Changes:**

- Verify sidebar collapse/expand works with persistence
- Test navigation between all routes
- Verify active state highlighting
- Test dark/light theme switching via ThemeProvider
- Verify responsive behavior on different viewport sizes
- Fix any integration issues discovered

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Sidebar collapses and expands smoothly
- [ ] Navigation highlights active route correctly
- [ ] Theme toggle works (dark/light modes)
- [ ] All routes render within shell layout
- [ ] Status bar displays workflow count and sync time
- [ ] Project selector functions correctly
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint:fix`
- [ ] Shell layout renders four regions as specified in Section 4.1
- [ ] Sidebar collapse/expand state persists correctly
- [ ] Navigation active states work with usePathname
- [ ] Theme integration works with existing ThemeProvider
- [ ] All placeholder pages are accessible via navigation

---

## Notes

### Architecture Decisions

1. **Zustand Store Location**: Creating `lib/stores/` directory establishes pattern for future stores
2. **CVA Pattern**: Following existing component conventions with cva() for variant management
3. **CSS Variables**: Leveraging existing CSS variable system for dimensions and theme colors
4. **Route Group**: Using `(app)` route group allows future auth-protected layout separation

### Potential Risks

1. **Electron Window Controls**: The header includes a placeholder for window controls; actual integration with Electron main process is deferred
2. **Responsive Breakpoints**: Mobile behavior may need refinement based on actual usage patterns
3. **Workflow Count**: StatusBar workflow count depends on existing useWorkflows hook; may need adjustment based on actual data structure

### Assumptions

- The existing provider hierarchy in root layout (QueryProvider, ThemeProvider, ToastProvider) will work seamlessly with nested route group layouts
- CSS variables for sidebar dimensions (already present) are the intended values
- Lucide React icons are the standard icon library for this project
- Base UI Select component is preferred over Combobox for the project selector (simpler use case)

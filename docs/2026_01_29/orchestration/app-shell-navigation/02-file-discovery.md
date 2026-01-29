# Step 2: File Discovery

**Status**: Completed
**Started**: 2026-01-29T00:03:00Z
**Completed**: 2026-01-29T00:05:00Z
**Duration**: ~120 seconds

## Refined Request Used

Implement the application shell, navigation layout, and reusable Base UI components for the Claude Orchestrator desktop application, an Electron + Next.js app that provides visual pipeline control over Claude Code CLI orchestration workflows. [Full refined request from Step 1]

## Discovery Statistics

- **Directories Explored**: 12+
- **Candidate Files Examined**: 60+
- **Highly Relevant Files**: 25+
- **Supporting Files**: 15+

## Discovered Files

### Critical Priority (Core Implementation - Must Create/Modify)

| File Path | Action | Description |
|-----------|--------|-------------|
| `app/(app)/layout.tsx` | **Create** | Route group layout for shell with four-region design |
| `components/shell/AppSidebar.tsx` | **Create** | Collapsible sidebar with navigation items |
| `components/shell/AppHeader.tsx` | **Create** | Fixed header with logo, hamburger, project selector |
| `components/shell/StatusBar.tsx` | **Create** | Bottom status bar with workflow count, sync time |
| `components/shell/NavItem.tsx` | **Create** | Reusable nav item with icons, active state |
| `components/shell/ProjectSelector.tsx` | **Create** | Project dropdown using Select/Combobox |
| `lib/stores/shell-store.ts` | **Create** | Zustand store for sidebar state |

### High Priority (Reference Files)

| File Path | Action | Description |
|-----------|--------|-------------|
| `docs/clarify-design-document.md` | **Reference** | Section 4.1 layout specification |
| `app/layout.tsx` | **Reference** | Root layout with providers |
| `components/ui/collapsible.tsx` | **Reference** | Collapsible pattern for sidebar |
| `components/ui/select.tsx` | **Reference** | Select pattern for ProjectSelector |
| `components/ui/combobox.tsx` | **Reference** | Combobox alternative for ProjectSelector |
| `components/ui/button.tsx` | **Reference** | CVA pattern to follow |
| `components/ui/icon-button.tsx` | **Reference** | IconButton for toggles |
| `components/ui/separator.tsx` | **Reference** | Dividers in navigation |
| `components/ui/tooltip.tsx` | **Reference** | Collapsed sidebar hints |
| `components/providers/theme-provider.tsx` | **Reference** | Theme integration |
| `components/ui/theme-selector.tsx` | **Reference** | Theme toggle pattern |

### Medium Priority (Supporting Files)

| File Path | Action | Description |
|-----------|--------|-------------|
| `app/globals.css` | **Reference/Modify** | CSS variables for sidebar dimensions |
| `lib/utils.ts` | **Reference** | `cn()` utility |
| `types/component-types.ts` | **Reference** | Global component types |
| `hooks/queries/use-projects.ts` | **Reference** | Projects hook for selector |
| `hooks/queries/use-workflows.ts` | **Reference** | Workflows hook for status bar |
| `hooks/use-electron.ts` | **Reference** | Electron API integration |
| `lib/theme/constants.ts` | **Reference** | Theme definitions |
| `package.json` | **Reference** | Dependency versions |

### Low Priority (Page Placeholders)

| File Path | Action | Description |
|-----------|--------|-------------|
| `components/shell/index.ts` | **Create** | Barrel exports |
| `app/(app)/dashboard/page.tsx` | **Create** | Dashboard page |
| `app/(app)/workflows/page.tsx` | **Create** | Workflows page |
| `app/(app)/templates/page.tsx` | **Create** | Templates page |
| `app/(app)/agents/page.tsx` | **Create** | Agents page |
| `app/(app)/settings/page.tsx` | **Create** | Settings page |

## Architecture Insights

### Existing Patterns

1. **CVA Component Pattern**:
   - `"use client"` directive
   - Base UI wrapping
   - CVA variants with `defaultVariants`
   - `cn()` for class merging

2. **Provider Hierarchy**:
   ```
   NuqsAdapter > QueryProvider > ThemeProvider > ToastProvider > children
   ```

3. **CSS Variables** (already in globals.css):
   - `--sidebar-width-expanded: 256px`
   - `--sidebar-width-collapsed: 64px`
   - Drag region classes

4. **Navigation Structure** (from design doc):
   ```
   Dashboard
   Workflows
   ├── Active
   │   ├── Plan
   │   └── Impl
   └── History
   Templates
   Agents
   Settings
   ```

### Key Integration Points

- Theme: `useTheme()` from ThemeProvider
- Projects: `useProjects()` hook
- Workflows: `useWorkflows()` hook
- Navigation: Next.js `Link` + `usePathname`

## File Validation

All referenced files confirmed to exist. New files will be created in established directory structure.

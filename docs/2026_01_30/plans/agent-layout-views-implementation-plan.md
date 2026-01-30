# Agent Layout Views Implementation Plan

**Generated**: 2026-01-30
**Original Request**: The agent management screen should support different layouts. The only layout currently supported is the card layout. The user should have at least 2 other layout options, list and table. The users preference should be saved and reloaded so that if the user sets it to the table view then it will always be the table view until they come back and change it.

**Refined Request**: The agent management screen currently displays agents exclusively in a card layout and needs to support multiple view layouts to accommodate different user preferences and use cases. This feature will add two additional layout options—list view and table view—alongside the existing card layout, giving users three distinct ways to visualize their agents. The list view should provide a compact, vertically-stacked presentation of agents with key information displayed inline, similar to file explorer list modes, while the table view should present agents in a structured grid format with sortable columns, following the established pattern already implemented in the WorkflowTable component at components/workflows/workflow-table.tsx. A layout toggle control should be added to the agents page header, using icon buttons or a segmented control built with Base UI primitives and styled via CVA variants for consistent theming. The user's layout preference must persist across application sessions, which should be implemented using the existing electron-store mechanism accessed through the IPC bridge (specifically the store namespace methods), following the same pattern used for theme persistence. On the client side, a Zustand store similar to the shell-store pattern should manage the current layout state and hydrate from the persisted value on application load. The AgentCard component at components/agents/agent-card.tsx will remain the foundation for the card layout, while new AgentList and AgentTable components should be created in the components/agents/ directory to handle the list and table layouts respectively. These components should share a common data interface and accept the same agent data props to ensure consistent behavior across layouts. The parent agents page component should conditionally render the appropriate layout component based on the current layout state, and any layout switch should be immediate without requiring page reload. The implementation should ensure that all three layouts maintain feature parity for agent interactions such as viewing details, editing, or other actions currently available in the card layout.

---

## Overview

| Attribute              | Value     |
| ---------------------- | --------- |
| **Estimated Duration** | 4-6 hours |
| **Complexity**         | Medium    |
| **Risk Level**         | Low       |

## Quick Summary

This feature adds three layout options (card, list, table) to the agent management screen with a persistent layout toggle. It follows established patterns from the codebase: Zustand for client state management, electron-store for persistence, and CVA/Base UI for the toggle control. The implementation creates two new layout components (AgentList, AgentTable) while refactoring existing tab content components to support layout switching.

## Prerequisites

- [ ] Understand the existing AgentCard component props interface
- [ ] Review WorkflowTable component for table layout patterns
- [ ] Verify electron-store IPC handlers are functional
- [ ] Confirm Zustand store pattern from shell-store.ts

---

## Implementation Steps

### Step 1: Create Layout Constants File

**What**: Create a constants file defining layout types and storage key for agent layout preference.

**Why**: Establishes a single source of truth for layout-related constants, following the pattern used in `lib/theme/constants.ts`.

**Confidence**: High

**Files to Create:**

- `lib/layout/constants.ts` - Layout type definitions and storage key constant

**Changes:**

- Define AgentLayout type as union of "card" | "list" | "table"
- Define AGENT_LAYOUT_STORAGE_KEY constant for electron-store persistence
- Define DEFAULT_AGENT_LAYOUT constant defaulting to "card"

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Constants file created with proper TypeScript types
- [ ] Exports are accessible from other modules
- [ ] All validation commands pass

---

### Step 2: Create Agent Layout Zustand Store

**What**: Create a Zustand store for managing agent layout state with hydration from electron-store.

**Why**: Provides reactive client-side state management for layout preference, mirroring the shell-store pattern.

**Confidence**: High

**Files to Create:**

- `lib/stores/agent-layout-store.ts` - Zustand store for layout preference

**Changes:**

- Define AgentLayoutState interface with layout property
- Define AgentLayoutActions interface with setLayout action
- Create useAgentLayoutStore hook using Zustand create function
- Implement setLayout action that updates both Zustand state and persists to electron-store

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Store exports useAgentLayoutStore hook
- [ ] Store includes layout state and setLayout action
- [ ] TypeScript types are properly defined
- [ ] All validation commands pass

---

### Step 3: Create Layout Provider for Hydration

**What**: Create a provider component that hydrates the layout store from electron-store on mount.

**Why**: Ensures layout preference is loaded from persistent storage before rendering, preventing flash of default layout.

**Confidence**: High

**Files to Create:**

- `components/providers/agent-layout-provider.tsx` - Provider for layout store hydration

**Changes:**

- Create AgentLayoutProvider component that wraps children
- Use useElectronStore hook to read persisted layout on mount
- Hydrate the Zustand store with persisted value
- Render null or skeleton during hydration to prevent flash

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Provider component created with proper hydration logic
- [ ] Prevents rendering until layout is hydrated
- [ ] All validation commands pass

---

### Step 4: Integrate Layout Provider into App Layout

**What**: Add AgentLayoutProvider to the root layout or agents page layout.

**Why**: Ensures layout state is available throughout the agent management UI.

**Confidence**: High

**Files to Modify:**

- `app/(app)/layout.tsx` - Add AgentLayoutProvider to provider composition (if exists) OR
- `app/(app)/agents/page.tsx` - Wrap page content with provider

**Changes:**

- Import AgentLayoutProvider component
- Add AgentLayoutProvider to provider composition chain

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Provider is properly integrated into component tree
- [ ] No circular dependency issues
- [ ] All validation commands pass

---

### Step 5: Create AgentList Component

**What**: Create a list view component for displaying agents in a compact vertical layout.

**Why**: Provides an alternative view optimized for scanning many agents quickly, similar to file explorer list modes.

**Confidence**: High

**Files to Create:**

- `components/agents/agent-list.tsx` - List view component for agents

**Changes:**

- Define AgentListProps interface matching AgentCard action handlers
- Create AgentList component rendering agents as horizontal rows
- Include agent color indicator, display name, type badge, status, and action buttons inline
- Extract AgentListItem sub-component for individual agent rows
- Integrate AgentEditorDialog for edit functionality using hidden trigger pattern

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Component accepts same action handlers as AgentCard
- [ ] Displays agent info in compact horizontal row format
- [ ] Maintains feature parity with card view for actions
- [ ] All validation commands pass

---

### Step 6: Create AgentTable Component

**What**: Create a table view component for displaying agents in a structured grid with column headers.

**Why**: Provides a data-dense view following the established WorkflowTable pattern for consistency.

**Confidence**: High

**Files to Create:**

- `components/agents/agent-table.tsx` - Table view component for agents

**Changes:**

- Define AgentTableProps interface with agents array and action handlers
- Create AgentTable component following WorkflowTable structure
- Include columns for: Name, Type, Status, Scope (Global/Project), Actions
- Add row click handler for view/edit functionality
- Include action buttons in last column (Edit, Duplicate, Delete, etc.)
- Integrate AgentEditorDialog for edit actions

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Table structure matches WorkflowTable patterns
- [ ] All agent fields are displayed in appropriate columns
- [ ] Action buttons function correctly
- [ ] Maintains feature parity with card view
- [ ] All validation commands pass

---

### Step 7: Create AgentLayoutToggle Component

**What**: Create a toggle control for switching between card, list, and table layouts.

**Why**: Provides the UI control for users to change their preferred layout view.

**Confidence**: High

**Files to Create:**

- `components/agents/agent-layout-toggle.tsx` - Layout toggle control

**Changes:**

- Create AgentLayoutToggle component using ButtonGroup and IconButton components
- Add icons for each layout type (LayoutGrid for card, List for list, Table2 for table from lucide-react)
- Connect to useAgentLayoutStore for current layout state and setLayout action
- Style active state to indicate current selection
- Add proper aria-labels for accessibility

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Toggle displays three icon buttons for layout options
- [ ] Active layout is visually indicated
- [ ] Clicking a button updates the layout state
- [ ] Accessible with proper ARIA attributes
- [ ] All validation commands pass

---

### Step 8: Create Shared AgentGridItem Component

**What**: Extract the AgentGridItem sub-component into a shared module for reuse across tab content components.

**Why**: Reduces code duplication between GlobalAgentsTabContent and ProjectAgentsTabContent, and prepares for layout switching.

**Confidence**: Medium

**Files to Create:**

- `components/agents/agent-grid-item.tsx` - Shared grid item wrapper component

**Files to Modify:**

- `components/agents/global-agents-tab-content.tsx` - Import shared component
- `components/agents/project-agents-tab-content.tsx` - Import shared component

**Changes:**

- Extract AgentGridItem component with its props interface to new file
- Update both tab content components to import from shared location
- Remove duplicate AgentGridItem definitions from tab content files

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] AgentGridItem component is exported from shared file
- [ ] Both tab content components use shared import
- [ ] No duplicate component definitions remain
- [ ] All validation commands pass

---

### Step 9: Create AgentLayoutRenderer Component

**What**: Create a component that conditionally renders the appropriate layout based on current layout state.

**Why**: Encapsulates layout switching logic and provides a clean interface for tab content components.

**Confidence**: High

**Files to Create:**

- `components/agents/agent-layout-renderer.tsx` - Conditional layout renderer

**Changes:**

- Define AgentLayoutRendererProps interface with agents array and action handler props
- Create component that reads layout from useAgentLayoutStore
- Conditionally render AgentCard grid, AgentList, or AgentTable based on layout value
- Pass through all action handlers to child components

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Component correctly switches between three layouts
- [ ] All action handlers are properly passed to layout components
- [ ] Layout switching is immediate without page reload
- [ ] All validation commands pass

---

### Step 10: Update GlobalAgentsTabContent for Layout Support

**What**: Refactor GlobalAgentsTabContent to use AgentLayoutRenderer instead of hardcoded card grid.

**Why**: Enables layout switching in the global agents view.

**Confidence**: High

**Files to Modify:**

- `components/agents/global-agents-tab-content.tsx` - Integrate layout renderer

**Changes:**

- Import AgentLayoutRenderer component
- Replace the card grid `<ul>` element with AgentLayoutRenderer
- Pass filtered agents and all action handlers to AgentLayoutRenderer
- Keep loading skeletons, empty states, and delete dialog unchanged

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] GlobalAgentsTabContent renders via AgentLayoutRenderer
- [ ] All existing functionality preserved
- [ ] Layout changes reflect immediately
- [ ] All validation commands pass

---

### Step 11: Update ProjectAgentsTabContent for Layout Support

**What**: Refactor ProjectAgentsTabContent to use AgentLayoutRenderer instead of hardcoded card grid.

**Why**: Enables layout switching in the project agents view.

**Confidence**: High

**Files to Modify:**

- `components/agents/project-agents-tab-content.tsx` - Integrate layout renderer

**Changes:**

- Import AgentLayoutRenderer component
- Replace the card grid `<ul>` element with AgentLayoutRenderer
- Pass filtered agents and all action handlers to AgentLayoutRenderer
- Keep loading skeletons, empty states, select project prompt, and delete dialog unchanged

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] ProjectAgentsTabContent renders via AgentLayoutRenderer
- [ ] All existing functionality preserved
- [ ] Layout changes reflect immediately
- [ ] All validation commands pass

---

### Step 12: Add Layout Toggle to Agents Page Header

**What**: Add the AgentLayoutToggle component to the agents page header.

**Why**: Provides users with the UI control to switch layouts.

**Confidence**: High

**Files to Modify:**

- `app/(app)/agents/page.tsx` - Add layout toggle to header

**Changes:**

- Import AgentLayoutToggle component
- Add AgentLayoutToggle to the header area between filters and Create Agent button
- Position toggle appropriately within the existing flex layout

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Layout toggle appears in page header
- [ ] Toggle is visually integrated with existing header elements
- [ ] Toggle functions correctly to switch layouts
- [ ] All validation commands pass

---

### Step 13: Create Loading Skeletons for List and Table Views

**What**: Create appropriate loading skeleton components for list and table layouts.

**Why**: Maintains consistent loading experience across all layout views.

**Confidence**: High

**Files to Create:**

- `components/agents/agent-list-skeleton.tsx` - List view loading skeleton
- `components/agents/agent-table-skeleton.tsx` - Table view loading skeleton

**Files to Modify:**

- `components/agents/global-agents-tab-content.tsx` - Add skeleton switching based on layout
- `components/agents/project-agents-tab-content.tsx` - Add skeleton switching based on layout

**Changes:**

- Create AgentListSkeleton with animated placeholder rows
- Create AgentTableSkeleton with table structure and animated cells
- Update both tab content components to render appropriate skeleton based on current layout

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] List skeleton displays animated row placeholders
- [ ] Table skeleton displays animated table structure
- [ ] Tab content components show correct skeleton for current layout
- [ ] All validation commands pass

---

### Step 14: Manual Testing and Edge Case Verification

**What**: Verify all layouts work correctly with various agent states and interactions.

**Why**: Ensures feature parity and proper behavior across all three layouts.

**Confidence**: High

**Files to Modify:**

- None - testing step only

**Changes:**

- Verify layout preference persists across app restarts
- Test all agent actions (edit, duplicate, delete, toggle active, create override, reset) in each layout
- Verify empty states display correctly in all layouts
- Confirm layout switching is immediate without page reload
- Test keyboard navigation and accessibility in each layout

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Layout preference persists across sessions
- [ ] All agent actions work in card, list, and table views
- [ ] Empty states render appropriately in each layout
- [ ] No console errors during layout switching
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint`
- [ ] Layout toggle persists preference via electron-store
- [ ] All three layouts display correct agent information
- [ ] All agent actions maintain feature parity across layouts
- [ ] No visual regressions in existing card layout
- [ ] Hydration prevents flash of default layout

---

## Notes

- The AgentCard component remains unchanged; it continues to be the foundation for the card layout view
- The shared data interface between layouts is the Agent type from the database schema
- Layout preference is stored using electron-store via the existing IPC bridge pattern
- The implementation follows the theme persistence pattern for consistency
- Loading skeletons should match the visual structure of each layout type
- Consider adding subtle transitions when switching layouts for polish (optional enhancement)
- The table view should consider responsive behavior for narrower viewports

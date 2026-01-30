# Dashboard UI Implementation Plan

Generated: 2026-01-29
Original Request: Dashboard UI Implementation with Active Workflows, Recent Workflows, Quick Actions, and Statistics widgets
Refined Request: Implement a comprehensive dashboard UI at app/(app)/dashboard/page.tsx that serves as the application's primary entry point by leveraging the existing data layer infrastructure, specifically utilizing the useWorkflows and useProjects TanStack Query hooks to display real-time workflow orchestration status and project statistics.

## Analysis Summary

- Feature request refined with project context from CLAUDE.md and design document
- Discovered 35 files across 4 priority levels (8 Critical, 6 High, 10 Medium, 11 Low)
- Generated 8-step implementation plan with 4 quality gates

## File Discovery Results

### Critical Priority (Must Modify/Use)

| File                             | Purpose                                                 |
| -------------------------------- | ------------------------------------------------------- |
| `app/(app)/dashboard/page.tsx`   | Main dashboard page (placeholder → full implementation) |
| `hooks/queries/use-workflows.ts` | Workflow data hooks for Active/Recent widgets           |
| `hooks/queries/use-projects.ts`  | Project data hooks for Statistics widget                |
| `lib/queries/workflows.ts`       | Query key factory for caching                           |
| `lib/queries/projects.ts`        | Query key factory for caching                           |
| `components/ui/card.tsx`         | Card component for widget containers                    |
| `components/ui/button.tsx`       | Button component for Quick Actions                      |
| `components/ui/badge.tsx`        | Badge component for status indicators                   |

### High Priority (Patterns/Types)

| File                            | Purpose                          |
| ------------------------------- | -------------------------------- |
| `db/schema/workflows.schema.ts` | Workflow status types and fields |
| `db/schema/projects.schema.ts`  | Project schema structure         |
| `types/electron.d.ts`           | Type definitions for IPC         |

---

## Implementation Plan

## Overview

**Estimated Duration**: 4-6 hours
**Complexity**: Medium
**Risk Level**: Low

## Quick Summary

- Create modular dashboard widget components for active workflows, recent workflows, statistics, and quick actions
- Implement data fetching using existing TanStack Query hooks (useWorkflows, useProjects)
- Build main dashboard page composing all widgets with proper loading/error states
- Follow Base UI + CVA patterns for consistent styling and accessibility

## Prerequisites

- [ ] Verify useWorkflows and useProjects hooks are functional and return expected data shapes
- [ ] Confirm Card, Button, and Badge components are implemented and follow CVA patterns
- [ ] Ensure workflow and project database schemas include all required fields (status, timestamps, etc.)
- [ ] Verify routing infrastructure supports navigation to workflow details pages

## Implementation Steps

### Step 1: Create Active Workflows Widget Component

**What**: Build a reusable widget component that displays currently running or paused workflows with real-time status information

**Why**: Isolates active workflow display logic into a maintainable, testable component that can be reused across the application

**Confidence**: High

**Files to Create:**

- `app/(app)/dashboard/_components/active-workflows-widget.tsx` - Active workflows display component

**Changes**:

- Import useWorkflows hook with status filter capability
- Import Card component for container styling
- Import Badge component for status indicators
- Implement loading skeleton state using Card variants
- Implement error state with QueryErrorBoundary pattern
- Render workflow cards showing: workflow ID, feature name, current step, progress percentage, elapsed time, project name
- Add click handler for navigation to workflow details using next/navigation
- Handle empty state when no active workflows exist
- Calculate elapsed time using date-fns differenceInMinutes/Hours
- Format progress percentage from current step index and total steps

**Validation Commands**:

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:

- [ ] Component renders without TypeScript errors
- [ ] Loading state displays appropriate skeleton UI
- [ ] Error state integrates with QueryErrorBoundary
- [ ] Empty state shows user-friendly message
- [ ] Workflow cards display all required information accurately
- [ ] Click navigation works correctly
- [ ] All validation commands pass

---

### Step 2: Create Recent Workflows Widget Component

**What**: Build a widget component that displays the 5-10 most recently completed, failed, or cancelled workflows

**Why**: Provides users quick access to workflow history without navigating to dedicated history page, enabling rapid status checks

**Confidence**: High

**Files to Create:**

- `app/(app)/dashboard/_components/recent-workflows-widget.tsx` - Recent workflows display component

**Changes**:

- Import useWorkflows hook with status filter for completed/failed/cancelled
- Import Card and Badge components
- Configure query to fetch 10 most recent workflows sorted by updated_at descending
- Implement loading skeleton state
- Implement error state with QueryErrorBoundary pattern
- Render workflow list showing: workflow ID, feature name, status badge, completion timestamp, repository name
- Add click handler for navigation to workflow details
- Handle empty state when no recent workflows exist
- Format timestamps using date-fns formatDistanceToNow for relative time display
- Apply status-specific badge variants for visual distinction

**Validation Commands**:

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:

- [ ] Component renders without TypeScript errors
- [ ] Query correctly limits to 10 workflows with proper sorting
- [ ] Status badges use appropriate variants for each status type
- [ ] Timestamps display in human-readable relative format
- [ ] Click navigation works correctly
- [ ] Empty state provides helpful messaging
- [ ] All validation commands pass

---

### Step 3: Create Statistics Overview Widget Component

**What**: Build a widget component that aggregates and displays key metrics including total projects, total workflows, completion rate, and average workflow duration

**Why**: Provides at-a-glance performance indicators that help users understand system usage patterns and success rates

**Confidence**: Medium

**Files to Create:**

- `app/(app)/dashboard/_components/statistics-widget.tsx` - Statistics display component

**Changes**:

- Import useWorkflows and useProjects hooks
- Import Card component
- Fetch all workflows and all projects data
- Calculate total project count from projects query result
- Calculate total workflow count from workflows query result
- Calculate completion rate as percentage of completed workflows vs total workflows
- Calculate average duration from completed workflows using date-fns differenceInMinutes
- Implement loading state showing skeleton for each statistic
- Implement error state for query failures
- Render grid layout with four statistic cards
- Format numbers with appropriate units (count, percentage, time)
- Handle edge cases like division by zero for completion rate

**Validation Commands**:

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:

- [ ] Component renders without TypeScript errors
- [ ] All four statistics calculate correctly from query data
- [ ] Loading state displays skeleton UI for all metrics
- [ ] Error state handles query failures gracefully
- [ ] Numbers format with appropriate precision and units
- [ ] Edge cases handled without runtime errors
- [ ] All validation commands pass

---

### Step 4: Create Quick Actions Widget Component

**What**: Build a widget component containing prominent action buttons for initiating new workflows and creating new projects

**Why**: Provides immediate access to primary user actions directly from dashboard, reducing navigation friction

**Confidence**: High

**Files to Create:**

- `app/(app)/dashboard/_components/quick-actions-widget.tsx` - Quick actions component

**Changes**:

- Import Card and Button components
- Import navigation utilities from next/navigation
- Render Card container with appropriate styling
- Add "New Workflow" button with primary variant
- Add "New Project" button with secondary or outline variant
- Implement navigation handlers for both buttons
- Add appropriate icons from lucide-react for visual clarity
- Ensure buttons are full-width on mobile, inline on desktop
- Apply proper spacing and alignment using Tailwind utilities

**Validation Commands**:

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:

- [ ] Component renders without TypeScript errors
- [ ] Both buttons display with correct variants and styling
- [ ] Navigation handlers route to correct pages
- [ ] Responsive layout works on mobile and desktop
- [ ] Icons enhance button clarity
- [ ] All validation commands pass

---

### Step 5: Compose Dashboard Page with All Widgets

**What**: Integrate all four widget components into the main dashboard page with proper layout, spacing, and responsive behavior

**Why**: Creates cohesive dashboard experience by composing modular widgets into organized grid layout

**Confidence**: High

**Files to Modify:**

- `app/(app)/dashboard/page.tsx` - Update from placeholder to full implementation

**Changes**:

- Remove placeholder content
- Import all four widget components
- Import necessary layout utilities
- Implement responsive grid layout using Tailwind CSS Grid
- Position Quick Actions widget prominently at top
- Arrange Active Workflows and Recent Workflows in two-column layout on desktop, stacked on mobile
- Position Statistics Overview as full-width section
- Add appropriate page heading and description
- Apply consistent spacing and padding
- Ensure proper semantic HTML structure with headings and sections
- Add page metadata using Next.js metadata API

**Validation Commands**:

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:

- [ ] Dashboard page renders all widgets correctly
- [ ] Layout is responsive and functional on all screen sizes
- [ ] Spacing and alignment follow design system conventions
- [ ] Page metadata is properly configured
- [ ] No layout shift or hydration errors occur
- [ ] All validation commands pass

---

### Step 6: Implement Shared Types and Utilities

**What**: Create shared TypeScript types and utility functions needed across dashboard components

**Why**: Ensures type safety and code reusability across all dashboard widgets, preventing duplication

**Confidence**: High

**Files to Create:**

- `app/(app)/dashboard/_types/index.ts` - Shared dashboard types

**Changes**:

- Define WorkflowCardData type with fields needed for display
- Define StatisticData type for statistics widget
- Define WorkflowStatusFilter type for filtering workflows
- Export all types for use across dashboard components

**Files to Create:**

- `app/(app)/dashboard/_utils/index.ts` - Shared dashboard utilities

**Changes**:

- Create calculateProgress function for workflow progress percentage
- Create calculateElapsedTime function for time formatting
- Create formatWorkflowDuration function for duration display
- Create getStatusBadgeVariant function mapping status to badge variant
- Export all utility functions

**Validation Commands**:

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:

- [ ] All types are properly defined and exported
- [ ] Utility functions handle edge cases correctly
- [ ] Functions are pure and testable
- [ ] All validation commands pass

---

### Step 7: Add Navigation Integration

**What**: Ensure dashboard integrates properly with app navigation system and workflow detail pages

**Why**: Creates seamless user flow from dashboard to detailed views, maintaining navigation context

**Confidence**: High

**Files to Modify:**

- `app/(app)/dashboard/_components/active-workflows-widget.tsx` - Add navigation implementation
- `app/(app)/dashboard/_components/recent-workflows-widget.tsx` - Add navigation implementation

**Changes**:

- Import useRouter from next/navigation
- Add click handlers that navigate to workflow detail page using workflow ID
- Implement cursor-pointer styling for clickable cards
- Add hover states for better UX feedback
- Ensure keyboard navigation works with proper focus states
- Consider using next/link for better performance if applicable

**Validation Commands**:

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:

- [ ] Navigation from dashboard to workflow details works correctly
- [ ] Keyboard navigation is fully functional
- [ ] Hover and focus states provide clear visual feedback
- [ ] Browser back button returns to dashboard correctly
- [ ] All validation commands pass

---

### Step 8: Implement Loading and Error States

**What**: Add comprehensive loading skeletons and error boundaries for all dashboard widgets

**Why**: Provides professional user experience during data fetching and graceful degradation on errors

**Confidence**: High

**Files to Modify:**

- `app/(app)/dashboard/_components/active-workflows-widget.tsx` - Add loading/error states
- `app/(app)/dashboard/_components/recent-workflows-widget.tsx` - Add loading/error states
- `app/(app)/dashboard/_components/statistics-widget.tsx` - Add loading/error states

**Changes**:

- Import QueryErrorBoundary from components/data
- Wrap each widget's content with QueryErrorBoundary
- Implement skeleton loading states using Card component variants
- Add appropriate loading state shapes matching final content layout
- Implement error fallback UI with retry functionality
- Handle empty states with user-friendly messaging and suggested actions
- Ensure loading states don't cause layout shift

**Validation Commands**:

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:

- [ ] Loading skeletons match final content layout
- [ ] Error states display helpful messages with retry options
- [ ] Empty states guide users toward creating content
- [ ] No layout shift occurs during loading-to-content transition
- [ ] All validation commands pass

---

## Quality Gates

### Gate 1: Component Compilation and Type Safety

- **Trigger**: After each component creation step (Steps 1-4, 6)
- **Checks**:
  - TypeScript compilation passes without errors
  - ESLint rules pass without violations
  - No unused imports or variables
- **Pass Criteria**: `pnpm lint && pnpm typecheck` executes successfully

### Gate 2: Data Integration Verification

- **Trigger**: After Step 5 (dashboard composition)
- **Checks**:
  - useWorkflows hook returns expected data structure
  - useProjects hook returns expected data structure
  - Query filters work correctly for active/recent workflows
  - Statistics calculations produce accurate results
- **Pass Criteria**: Dashboard displays real data without runtime errors when queries return data

### Gate 3: UX and Accessibility

- **Trigger**: After Steps 7-8 (navigation and states)
- **Checks**:
  - Keyboard navigation works for all interactive elements
  - Focus states are visible and logical
  - Loading states provide feedback without layout shift
  - Error states offer recovery options
  - Empty states guide user actions
- **Pass Criteria**: Manual testing confirms all interactive patterns work as expected

### Gate 4: Final Integration

- **Trigger**: After all steps complete
- **Checks**:
  - Dashboard page renders correctly in development mode
  - All widgets display data from TanStack Query hooks
  - Navigation to/from dashboard works correctly
  - Responsive layout functions on mobile and desktop viewports
  - No console errors or warnings appear
- **Pass Criteria**: Full dashboard functions correctly with live data

## Notes

- **Modular Architecture**: Each widget is implemented as a separate component to enable independent testing, reusability, and easier maintenance. Avoid combining widgets into single monolithic component.

- **Query Hook Usage**: Leverage existing useWorkflows and useProjects hooks rather than creating new data fetching logic. These hooks already include proper caching, refetching, and error handling via TanStack Query.

- **Status Filtering**: The active workflows widget needs workflows with status 'running' or 'paused'. The recent workflows widget needs workflows with status 'completed', 'failed', or 'cancelled'. Verify these status values match the database schema exactly.

- **Time Calculations**: Use date-fns for all time-related calculations and formatting to maintain consistency with the rest of the application. Consider edge cases like workflows that started seconds ago vs days ago.

- **Empty States**: Each widget should handle the case where no data exists gracefully. Active workflows should encourage starting a new workflow. Recent workflows should indicate this is normal for new installations.

- **Performance Considerations**: With TanStack Query caching, data should be shared efficiently across widgets. Avoid refetching the same data multiple times by ensuring query keys are consistent.

- **Navigation Paths**: Verify the workflow detail page route exists and matches the navigation implementation. If the route is `/workflows/[id]`, ensure the ID is correctly passed in the navigation handler.

- **Accessibility**: Ensure all interactive elements have proper ARIA labels, especially for workflow status badges and navigation cards. Loading skeletons should have appropriate aria-live regions if content updates dynamically.

- **Future Enhancements**: Consider adding refresh functionality, date range filters for recent workflows, or expandable statistics details in future iterations. The modular structure supports these additions easily.

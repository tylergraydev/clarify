# Step 2: AI-Powered File Discovery

## Step Metadata

| Field | Value |
|-------|-------|
| Step | 2 - File Discovery |
| Status | Completed |
| Started | 2026-02-01T00:02:00Z |
| Completed | 2026-02-01T00:03:00Z |
| Duration | ~60 seconds |

## Refined Request Used

Implement the workflow detail page header and metadata section for the Clarify Electron desktop application by extending the existing `app/(app)/workflows/[id]/page.tsx` page shell to display real workflow data fetched via the `useWorkflow(id)` hook. The header should prominently display the workflow feature name in a large, visually prominent typography size, followed by a status badge indicating the current workflow state (created, running, paused, editing, completed, failed, or cancelled) using the existing Badge component with workflow status variants, and a workflow type badge (planning or implementation) positioned adjacent to the status. Include a linked project name that navigates to the associated project detail page using the `useProject(projectId)` hook, along with created and started timestamps formatted using date-fns.

## Discovered Files

### Critical Priority (Must Modify)

| File | Relevance | Action |
|------|-----------|--------|
| `app/(app)/workflows/[id]/page.tsx` | Main workflow detail page to extend with header, metadata, badges, timestamps, action bar | Modify |
| `components/workflows/workflow-detail-skeleton.tsx` | Loading skeleton needs to match new header/metadata layout | Modify |

### High Priority (Key Dependencies)

| File | Relevance | Action |
|------|-----------|--------|
| `hooks/queries/use-workflows.ts` | Contains `useWorkflow(id)` hook and mutation hooks for actions | Reference |
| `hooks/queries/use-projects.ts` | Contains `useProject(id)` hook for project data | Reference |
| `db/schema/workflows.schema.ts` | Defines workflow status and type values | Reference |
| `components/ui/badge.tsx` | Badge component with workflow status variants | Reference |
| `components/ui/button.tsx` | Button component for action bar | Reference |
| `types/electron.d.ts` | Type definitions for Workflow and Project | Reference |

### Medium Priority (Pattern References)

| File | Relevance | Action |
|------|-----------|--------|
| `app/(app)/projects/[id]/page.tsx` | Pattern for detail page with breadcrumb, badges, dates | Reference |
| `components/dashboard/active-workflows-widget.tsx` | Status badge mapping, elapsed time, action buttons | Reference |
| `components/dashboard/recent-workflows-widget.tsx` | `formatDistanceToNow` timestamp pattern | Reference |
| `components/workflows/workflow-table.tsx` | `getStatusVariant`, `formatStatusLabel`, `formatTypeLabel` | Reference |
| `components/projects/project-detail-skeleton.tsx` | Skeleton structure pattern | Reference |
| `components/data/query-error-boundary.tsx` | Error boundary pattern | Reference |

### Low Priority (Supporting Files)

| File | Relevance | Action |
|------|-----------|--------|
| `components/workflows/index.ts` | Barrel exports - may need updates | May Modify |
| `components/ui/card.tsx` | Card component for metadata styling | Reference |
| `components/ui/empty-state.tsx` | Empty state pattern | Reference |
| `lib/utils.ts` | `cn` utility, `capitalizeFirstLetter` | Reference |
| `lib/queries/workflows.ts` | Query key factory | Reference |
| `lib/queries/projects.ts` | Query key factory | Reference |
| `app/(app)/workflows/[id]/route-type.ts` | Route type definition | Reference |
| `components/ui/icon-button.tsx` | IconButton for compact actions | Reference |

## Key Patterns Discovered

### Status Badge Variant Mapping

From `active-workflows-widget.tsx` and `workflow-table.tsx`:

| Workflow Status | Badge Variant |
|-----------------|---------------|
| `created` | `default` |
| `running` | `planning` (blue) |
| `paused` | `clarifying` (yellow) |
| `editing` | `clarifying` (yellow) |
| `completed` | `completed` (green) |
| `failed` | `failed` (red) |
| `cancelled` | `stale` (amber) |

### Date Formatting Patterns

- `format()` - Absolute dates: "Jan 15, 2025"
- `formatDistanceToNow()` - Relative times: "2 hours ago"
- `parseISO()` - Parse ISO date strings
- `differenceInHours()` / `differenceInMinutes()` - Elapsed time calculations

### Action Button States

From `active-workflows-widget.tsx`:

| Action | Available When |
|--------|----------------|
| Pause | `status === 'running'` |
| Resume | `status === 'paused'` |
| Cancel | `status in ['created', 'paused', 'running']` |

### Loading State Pattern

- Skeleton components with `animate-pulse`
- `aria-busy`, `aria-label`, `role="status"` for accessibility

### Error State Pattern

- `QueryErrorBoundary` wrapper
- `EmptyState` fallback with error message and retry button

## Discovery Statistics

| Metric | Value |
|--------|-------|
| Directories Explored | 15+ |
| Candidate Files Examined | 40+ |
| Highly Relevant Files | 12 |
| Supporting Files | 10 |
| Total Files Documented | 22 |

## File Validation

All discovered file paths validated to exist and are accessible.

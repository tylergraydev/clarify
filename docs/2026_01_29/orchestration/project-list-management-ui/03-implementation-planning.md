# Step 3: Implementation Planning

**Start Time**: 2026-01-29T00:03:00Z
**End Time**: 2026-01-29T00:04:00Z
**Duration**: ~60 seconds
**Status**: Completed

## Input

**Refined Feature Request:**
Implement the Project List & Management UI to provide users with a centralized interface for managing projects, which serve as the organizational container for all workflows and repositories in Clarify. The implementation leverages the complete data layer already in place with full CRUD operations, IPC handlers via the project domain, and React hooks (useProjects, useCreateProject, useUpdateProject, useDeleteProject, useProject), making this a low-risk, high-visibility feature that unblocks downstream work on repository management and workflow creation. The project list page should support both card and table view layouts using existing Card and Table UI components built on Base UI primitives with Tailwind CSS 4 and CVA styling, displaying project name, description, creation date, and archive status with visual indicators for archived projects. Implement a create project dialog using existing TanStack Form field components (TextField, Textarea) that validates project names are unique and non-empty, integrating with the useCreateProject hook for optimistic updates via TanStack Query with proper cache invalidation through the query key factory pattern. Add archive/unarchive functionality as inline actions in both views that toggle the archivedAt timestamp field, with confirmation dialogs to prevent accidental operations. Create a project detail page with a tabbed layout placeholder using the existing Tabs component, structured to accommodate future tabs for repositories, workflows, and settings, with breadcrumb navigation returning to the list. Ensure all list and detail views are responsive, support keyboard navigation and screen reader accessibility through Base UI's unstyled primitives, display loading and error states using existing data display components, and utilize URL query state synchronization via nuqs for view preferences (list vs card view) and filtering. Wire the project context throughout by passing the selected project ID through route parameters and storing it in the Zustand shell store for sidebar navigation updates, ensuring the project selector in the app header reflects the currently active project context.

**Discovered Files Summary:**

- 6 critical files (create/modify)
- 9 high priority files (modify/reference)
- 13 medium priority files (reference)
- 17 low priority files (reference)
- Total: 45 relevant files discovered

## Agent Prompt

```
Generate an implementation plan in MARKDOWN format (NOT XML) for the Project List & Management UI feature.

[Refined feature request provided]
[Files to create/modify provided]
[Existing patterns to follow provided]

Format: Standard markdown implementation plan template
Constraints: Include lint/typecheck validation for every step, no code examples
```

## Plan Generation Results

**Format Validation**: PASS - Markdown format with all required sections

**Template Compliance**:

- [x] Overview section with Duration/Complexity/Risk
- [x] Quick Summary
- [x] Prerequisites
- [x] Implementation Steps (12 steps)
- [x] Quality Gates (3 checkpoints)
- [x] Notes

**Validation Commands Check**: PASS - All 12 steps include `pnpm run lint:fix && pnpm run typecheck`

**Content Quality**:

- [x] No code examples included
- [x] Steps are actionable and focused
- [x] Ordered by dependency (foundational work first)
- [x] Quality gates at logical checkpoints (steps 4, 8, 12)

## Plan Statistics

| Metric             | Value    |
| ------------------ | -------- |
| Total Steps        | 12       |
| Files to Create    | 6        |
| Files to Modify    | 5        |
| Quality Gates      | 3        |
| Estimated Duration | 3-4 days |
| Complexity         | Medium   |
| Risk Level         | Low      |

## Step Summary

1. **Extend Shell Store** - Add selectedProjectId state
2. **Extend Query Keys** - Support archived filtering
3. **Add Archive Hooks** - useArchiveProject, useUnarchiveProject
4. **Add Sidebar Navigation** - Projects nav item
5. **Create Project Card** - Card view component
6. **Create Confirm Dialog** - Archive confirmation
7. **Create Project Table** - Table view component
8. **Create Create Dialog** - TanStack Form dialog
9. **Create List Page** - Main projects page
10. **Create Detail Page** - Tabbed detail view
11. **Integrate Selector** - Sync with shell store
12. **Generate Routes** - Type-safe route definitions

## Quality Gate Checkpoints

1. **After Step 4**: Navigation foundation complete
2. **After Step 8**: All components created
3. **After Step 12**: Feature complete

## Complexity Assessment

**Low Risk Factors:**

- Data layer 100% complete (IPC, repositories, hooks)
- All UI primitives exist (Card, Dialog, Tabs, Button)
- Follows established project patterns
- No schema migrations required

**Medium Complexity Factors:**

- Multiple new components to create
- URL state synchronization with nuqs
- Shell store integration across components
- Type-safe routing configuration

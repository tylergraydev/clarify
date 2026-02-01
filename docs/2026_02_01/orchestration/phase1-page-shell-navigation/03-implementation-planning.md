# Step 3: Implementation Planning

## Step Metadata

| Field | Value |
|-------|-------|
| Started | 2026-02-01T00:05:00.000Z |
| Completed | 2026-02-01T00:06:30.000Z |
| Duration | ~90s |
| Status | Completed |

## Inputs Used

### Refined Feature Request

Implement the foundational workflow navigation structure for Clarify by creating three new route pages in the app/(app)/ route group: /workflows/[id]/page.tsx for workflow detail views, /workflows/active/page.tsx for active workflows listing, and /workflows/history/page.tsx for workflow history, each as placeholder pages displaying their respective titles via h1 headings with no functional content yet. Add a breadcrumb navigation component to the workflow detail page following the existing pattern from the project detail page (using ChevronRight dividers with semantic nav aria-label, styled with text-sm text-muted-foreground, and linking back through the navigation chain), displaying "Projects > [Project Name] > Workflows > [Workflow Name]" with the appropriate type-safe routes via next-typesafe-url's $path helper. Extend the app-sidebar.tsx component to include two new NavItem links under a collapsible Workflows section: "Active" (linking to /workflows/active) and "History" (linking to /workflows/history), positioned after the Projects section and before the Agents separator. Integrate workflow row navigation into the existing WorkflowsTabContent component on the project detail page by connecting the onViewDetails callback to route to /workflows/[id] with type-safe route parameters, allowing users to click any workflow row and navigate to its detail page. Ensure all route type files use next-typesafe-url conventions with proper Zod validation schemas, maintain consistent styling with existing pages using the project's Base UI + Tailwind design system, and validate that navigation works bidirectionally—from project workflows tab to workflow detail, from sidebar to active/history pages, and breadcrumbs link back to parent pages—without adding any functional features, data displays, or UI beyond basic placeholder content.

### File Discovery Summary

- Critical: 9 files (7 CREATE, 2 MODIFY)
- High: 10 reference files with essential patterns
- Medium: 10 secondary reference files
- Low: 7 context files

## Agent Prompt Sent

```
Generate an implementation plan in MARKDOWN format (NOT XML) following this template with these sections: ## Overview (with Estimated Duration, Complexity, Risk Level), ## Quick Summary, ## Prerequisites, ## Implementation Steps (each step with What/Why/Confidence/Files/Changes/Validation Commands/Success Criteria), ## Quality Gates, ## Notes. IMPORTANT: Include 'pnpm lint && pnpm typecheck' validation for every step touching JS/JSX/TS/TSX files. Do NOT include code examples.

[Full context provided including refined request, file discovery results, and project context]
```

## Plan Validation Results

| Check | Result |
|-------|--------|
| Format compliance | PASS - Markdown format used |
| Template adherence | PASS - All required sections included |
| Section validation | PASS - Overview, Quick Summary, Prerequisites, Implementation Steps, Quality Gates, Notes |
| Validation commands | PASS - All steps include `pnpm lint && pnpm typecheck` |
| No code examples | PASS - Plan contains instructions only |
| Actionable steps | PASS - 8 concrete implementation steps |
| Complete coverage | PASS - All deliverables addressed |

## Plan Summary

The implementation plan consists of 8 steps:

1. **Create Workflow Detail Page Route Type** - route-type.ts with Zod ID validation
2. **Create Workflow Detail Placeholder Page** - page.tsx with breadcrumb navigation
3. **Create Active Workflows Placeholder Page** - simple placeholder page
4. **Create Workflow History Placeholder Page and Route Type** - placeholder + route type for future params
5. **Regenerate Type-Safe URL Types** - run next-typesafe-url CLI
6. **Add Workflows Section to App Sidebar** - collapsible section with Active/History links
7. **Verify Workflow Row Navigation Integration** - confirm existing handleViewDetails works
8. **Manual Navigation Testing** - end-to-end validation of all navigation paths

## Complexity Assessment

| Factor | Assessment |
|--------|------------|
| Estimated Duration | 3-4 hours |
| Complexity | Low |
| Risk Level | Low |

Low complexity because:
- All patterns already exist in the codebase (breadcrumbs, route types, sidebar nav)
- No new data fetching logic required (using existing hooks)
- No functional features - placeholder pages only
- Existing navigation already partially implemented (handleViewDetails)

## Quality Gate Results

- All steps include validation commands
- No code examples included
- Markdown format used throughout
- Clear success criteria for each step

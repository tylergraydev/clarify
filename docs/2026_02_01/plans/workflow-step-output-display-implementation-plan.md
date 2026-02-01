# Implementation Plan: Workflow Step Output Display System (Phase 5)

Generated: 2026-02-01
Original Request: Phase 5 of the workflow-implementation-phases.md - Step Output Display
Refined Request: The Phase 5 enhancement for the workflow implementation pipeline requires implementing a comprehensive output display system for completed workflow steps. This feature should extend the existing PipelineStep component to display collapsed step metrics including duration (via durationMs field), and key metrics specific to each step type (e.g., questions count for clarification, files count for discovery, steps count for planning), with an expandable output area that renders the outputText field using markdown rendering via streamdown with syntax highlighting for code blocks provided by shiki.

## Analysis Summary

- Feature request refined with project context
- Discovered 32 files across 12 directories
- Generated 11-step implementation plan

## Overview

- **Estimated Duration**: 4-6 hours
- **Complexity**: Medium
- **Risk Level**: Medium

## Quick Summary

This feature extends the existing PipelineStep component to display rich output for completed workflow steps, including duration badges, step-type-specific metrics (questions count, files count, etc.), and markdown-rendered output with syntax highlighting via streamdown and shiki. The implementation includes scrollable output panels, a new duration formatting utility, metric badge variants, and test data seeding.

## Prerequisites

- [ ] Confirm shiki and streamdown packages are installed (verified: both in package.json)
- [ ] Understand Base UI Collapsible pattern (already used in PipelineStep)
- [ ] Understand CVA pattern for badge variants (already used throughout codebase)
- [ ] Review existing step schema fields: `durationMs`, `outputText`, `outputStructured`

## File Discovery Results

### Critical Priority (MUST Modify/Create)

| File | Action | Purpose |
|------|--------|---------|
| `components/workflows/pipeline-step.tsx` | Modify | Add duration badge, metrics, markdown rendering |
| `components/workflows/pipeline-view.tsx` | Modify | Add scrollable output panel handling |
| `db/repositories/workflow-steps.repository.ts` | Modify | Data access for step metadata |
| `db/seed/index.ts` | Modify | Add workflow steps seeder call |
| `db/seed/workflow-steps.seed.ts` | Create | Seed realistic step outputs |

### High Priority (Will Likely Modify)

| File | Purpose |
|------|---------|
| `app/(app)/workflows/[id]/page.tsx` | Layout adjustments |
| `lib/stores/pipeline-store.ts` | UI state management |
| `hooks/queries/use-steps.ts` | Query hooks |
| `components/ui/badge.tsx` | Metric badge variants |
| `components/workflows/index.ts` | Component exports |
| `lib/utils.ts` | Duration formatting utility |

## Implementation Steps

### Step 1: Add Duration Formatting Utility

- **What**: Create a `formatDuration` utility function to convert milliseconds to human-readable strings (e.g., "2.5s", "1m 23s")
- **Why**: The `durationMs` field in workflow steps needs to be displayed in a user-friendly format in the collapsed step header
- **Confidence**: High
- **Files**: `lib/utils.ts`
- **Changes**: Add `formatDuration(ms: number): string` function that handles sub-second, seconds, minutes, and hour-level durations
- **Validation Commands**: `pnpm lint && pnpm typecheck`
- **Success Criteria**:
  - Function handles edge cases (0ms, null/undefined)
  - Output is concise and human-readable

---

### Step 2: Add Metric Badge Variants to Badge Component

- **What**: Add new badge variants for displaying step metrics (duration, count metrics)
- **Why**: Step metrics need visually distinct styling that differs from status badges but maintains design consistency
- **Confidence**: High
- **Files**: `components/ui/badge.tsx`
- **Changes**: Add `metric` variant with subtle neutral styling for metric values
- **Validation Commands**: `pnpm lint && pnpm typecheck`
- **Success Criteria**:
  - New variants follow CVA pattern
  - Styling works in both light and dark modes

---

### Step 3: Create Markdown Renderer Component

- **What**: Create a reusable MarkdownRenderer component that uses streamdown for markdown parsing and shiki for syntax highlighting
- **Why**: The step output needs rich markdown rendering with code block syntax highlighting to display formatted content properly
- **Confidence**: Medium
- **Files**:
  - Create: `components/ui/markdown-renderer.tsx`
  - Modify: `components/ui/index.ts` (export)
- **Changes**:
  - Create client-side component using streamdown and shiki
  - Support common languages (typescript, javascript, tsx, jsx, json, bash, markdown)
  - Use theme-aware highlighting (light/dark mode)
  - Memoize highlighter creation for performance
- **Validation Commands**: `pnpm lint && pnpm typecheck`
- **Success Criteria**:
  - Markdown headings, lists, code blocks render correctly
  - Code blocks have syntax highlighting
  - Theme switches correctly with dark/light mode
  - No hydration errors

---

### Step 4: Create Step Metrics Display Component

- **What**: Create a StepMetrics component that displays type-specific metrics for each step type
- **Why**: Different step types have different meaningful metrics that need type-specific extraction and display
- **Confidence**: Medium
- **Files**:
  - Create: `components/workflows/step-metrics.tsx`
  - Modify: `components/workflows/index.ts`
- **Changes**:
  - Create component accepting step type, outputStructured, and outputText
  - Implement metric extraction for: clarification (questions count), refinement (word count), discovery (files count), planning (steps count)
  - Display using Badge component with metric variant
- **Validation Commands**: `pnpm lint && pnpm typecheck`
- **Success Criteria**:
  - Metrics display correctly for each step type
  - Graceful fallback when data is missing

---

### Step 5: Enhance PipelineStep Component with Duration and Metrics

- **What**: Extend PipelineStep to display duration badge and step metrics in the collapsed header
- **Why**: Users need to see key step information at a glance without expanding each step
- **Confidence**: High
- **Files**: `components/workflows/pipeline-step.tsx`
- **Changes**:
  - Add optional `durationMs` and `outputStructured` props
  - Display duration badge next to status when completed
  - Integrate StepMetrics component in header
  - Add ARIA labels for accessibility
- **Validation Commands**: `pnpm lint && pnpm typecheck`
- **Success Criteria**:
  - Duration displays in readable format
  - Metrics display inline with step header
  - Layout remains clean and accessible

---

### Step 6: Replace Plain Text Output with Markdown Renderer

- **What**: Replace the simple text output in PipelineStep's expanded panel with MarkdownRenderer component
- **Why**: Step outputs contain markdown content that should be properly formatted with syntax highlighting
- **Confidence**: High
- **Files**: `components/workflows/pipeline-step.tsx`
- **Changes**:
  - Replace `<p className={'whitespace-pre-wrap'}>{output}</p>` with `<MarkdownRenderer content={output} />`
  - Add scrollable container with max-height for output area
- **Validation Commands**: `pnpm lint && pnpm typecheck`
- **Success Criteria**:
  - Markdown renders correctly with formatting
  - Code blocks have syntax highlighting
  - Output area scrolls for long content

---

### Step 7: Update PipelineView for Scrollable Output Panel

- **What**: Adjust PipelineView layout to accommodate expanded step output without breaking pipeline visualization
- **Why**: Long outputs should scroll within their container without affecting the horizontal pipeline layout
- **Confidence**: High
- **Files**: `components/workflows/pipeline-view.tsx`
- **Changes**:
  - Pass durationMs and outputStructured from step data to PipelineStep
  - Ensure expanded step output scrolls independently
  - Maintain horizontal scrolling for pipeline with vertical scrolling for output
- **Validation Commands**: `pnpm lint && pnpm typecheck`
- **Success Criteria**:
  - Pipeline horizontal layout maintained
  - Expanded step content scrollable
  - No layout jumping on expand/collapse

---

### Step 8: Create Workflow Steps Seed Data

- **What**: Create seed file with realistic sample workflow step outputs for all step types
- **Why**: Test data is needed to verify markdown rendering, metrics extraction, and UI display
- **Confidence**: High
- **Files**: Create: `db/seed/workflow-steps.seed.ts`
- **Changes**:
  - Create seed data for: clarification (questions), refinement (requirements), discovery (file lists), planning (implementation steps)
  - Include varied durationMs values
  - Include outputStructured data where applicable
  - Follow idempotent pattern from templates.seed.ts
- **Validation Commands**: `pnpm lint && pnpm typecheck`
- **Success Criteria**:
  - Seed data covers all step types
  - Outputs contain markdown with code blocks
  - Seed function is idempotent

---

### Step 9: Integrate Seed into Database Seeder

- **What**: Add workflow steps seeding call to the main seed index
- **Why**: The new seed data needs to be loaded when the database is seeded
- **Confidence**: High
- **Files**: `db/seed/index.ts`
- **Changes**:
  - Import seedWorkflowSteps function
  - Call seedWorkflowSteps(db) after existing seed calls
- **Validation Commands**: `pnpm lint && pnpm typecheck`
- **Success Criteria**:
  - Seed function imported and called
  - Order of seeding is logical

---

### Step 10: Update Pipeline Store for Output Panel State (Optional)

- **What**: Optionally add scroll position state to pipeline store
- **Why**: Users may want scroll position preserved when collapsing/expanding steps
- **Confidence**: Low (enhancement, may skip)
- **Files**: `lib/stores/pipeline-store.ts`
- **Changes**:
  - Add optional outputScrollPosition state per step
  - Add setScrollPosition action
- **Validation Commands**: `pnpm lint && pnpm typecheck`
- **Success Criteria**:
  - Scroll position persists during session (if implemented)
  - No regressions in existing functionality

---

### Step 11: Final Integration Testing

- **What**: Manual verification of complete feature integration
- **Why**: Ensure all components work together correctly in the workflow detail page context
- **Confidence**: High
- **Files**: Reference: `app/(app)/workflows/[id]/page.tsx`
- **Changes**: No code changes - verification step
- **Validation Commands**: `pnpm lint && pnpm typecheck`
- **Success Criteria**:
  - Workflow detail page loads without errors
  - Steps display duration and metrics when available
  - Expanding steps shows markdown-rendered output
  - Code blocks have syntax highlighting
  - Scrolling works correctly for long outputs
  - Dark/light theme works for all components

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm typecheck`
- [ ] All files pass `pnpm lint`
- [ ] No console errors in browser
- [ ] No hydration mismatches
- [ ] Markdown renders correctly with various input formats
- [ ] Syntax highlighting works for TypeScript/JavaScript code blocks
- [ ] Component accessibility (keyboard navigation, screen reader support)

## Notes

### Architecture Decisions
- **High Confidence**: Use streamdown + shiki as specified (packages already installed)
- **High Confidence**: Follow existing CVA pattern for badge variants
- **Medium Confidence**: Step metrics extraction may need iteration based on actual output formats

### Risks and Mitigations
1. **Risk**: Shiki bundle size impact - **Mitigation**: Use dynamic imports and limit loaded languages
2. **Risk**: Markdown XSS vulnerabilities - **Mitigation**: Streamdown sanitizes by default, verify configuration
3. **Risk**: Performance with large outputs - **Mitigation**: Virtualized scrolling if needed (defer unless issues arise)

### Assumptions Requiring Confirmation
- [ ] Step outputStructured field contains parseable JSON for metrics extraction
- [ ] Step outputText always contains valid markdown (or plain text that renders safely)
- [ ] Shiki themes support both light and dark modes via CSS variables or dual highlighting

### Dependencies Between Steps
- Steps 1-2 can be done in parallel (utilities)
- Step 3 (MarkdownRenderer) must complete before Step 6
- Step 4 (StepMetrics) must complete before Step 5
- Steps 5-7 depend on Steps 1-4
- Steps 8-9 (seeding) can be done in parallel with Steps 5-7

### Parallelization Opportunities
```
Parallel Group 1: Steps 1, 2 (utilities/badges)
Parallel Group 2: Steps 3, 4 (new components) - after Group 1
Parallel Group 3: Steps 5, 6, 7 (integration) - after Group 2
Parallel Group 4: Steps 8, 9 (seeding) - can run parallel to Group 3
Sequential: Step 10 (optional), Step 11 (testing) - after all
```

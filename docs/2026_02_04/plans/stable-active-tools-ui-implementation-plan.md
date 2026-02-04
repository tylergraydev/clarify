# Stable Active Tools UI - Implementation Plan

**Generated**: 2026-02-04
**Original Request**: Stabilize the active tool calls UI section to prevent layout bouncing when tools appear/disappear
**Refined Request**: Maintain a stable, always-visible container for the active tools section that preserves its height and layout space even when no tools are active, displaying a placeholder message instead of removing the section entirely.

---

## Analysis Summary

- Feature request refined with project context
- Discovered 10 files across 5 directories
- Generated 1-step implementation plan

## File Discovery Results

### Critical Priority
- `components/workflows/clarification-streaming.tsx` - Main component with the issue at lines 358-367

### High Priority (Reference Only)
- `components/workflows/pipeline-step.tsx` - Parent component passing activeTools prop
- `components/workflows/pipeline-view.tsx` - Manages clarification state
- `components/ui/collapsible.tsx` - Reference for stable container patterns

### Supporting (No Changes)
- `lib/validations/clarification.ts` - Type definitions
- `electron/services/clarification-step.service.ts` - Backend service

---

## Implementation Plan

### Overview

**Estimated Duration**: 30 minutes
**Complexity**: Low
**Risk Level**: Low

### Quick Summary

- Remove conditional wrapper around active tools section to prevent layout shifts
- Always render the container div with consistent styling
- Conditionally render tool indicators or placeholder message inside the container
- Maintain stable layout space even when no tools are active
- Follow existing pattern used by tool history section for consistency

### Prerequisites

- [ ] Review `components/workflows/clarification-streaming.tsx` lines 358-367 to understand current conditional rendering
- [ ] Review `components/workflows/clarification-streaming.tsx` lines 369-405 to understand stable container pattern used by tool history section
- [ ] Understand that `hasActiveTools` is computed from `activeTools.length > 0` at line 229
- [ ] Verify placeholder message text aligns with project UX patterns

### Implementation Steps

#### Step 1: Modify Active Tools Section Container

**What**: Remove conditional wrapper and always render the container div, conditionally rendering content inside
**Why**: Prevents layout shifts by maintaining consistent DOM structure and height
**Confidence**: High

**Files to Modify:**

- `components/workflows/clarification-streaming.tsx` - Remove conditional wrapper, add placeholder message

**Changes:**

- Remove the conditional wrapper `{hasActiveTools && (...)}` around the active tools section container
- Always render the container div with classes `border-b border-border/50 px-4 py-2`
- Conditionally render tool indicators when `hasActiveTools` is true
- Add placeholder message when `hasActiveTools` is false, displaying text like "No active tools" or "Waiting for tool execution"
- Ensure placeholder message uses consistent styling with muted text color to match project patterns

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Container div is always rendered regardless of `hasActiveTools` value
- [ ] Tool indicators render when `hasActiveTools` is true
- [ ] Placeholder message renders when `hasActiveTools` is false
- [ ] No TypeScript errors introduced
- [ ] No linting errors introduced
- [ ] Layout remains stable when tools appear and disappear

---

### Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint:fix`
- [ ] Manual verification: Active tools section container remains visible and maintains height when no tools are active
- [ ] Manual verification: No layout shifts occur when tools transition from active to inactive state
- [ ] Manual verification: Placeholder message displays appropriately when no tools are active
- [ ] Manual verification: Tool indicators display correctly when tools are active

### Notes

**Edge Cases:**

- Empty state: When `activeTools` is an empty array, placeholder should display
- Transition state: When tools transition from active to inactive, container should remain stable
- Multiple tools: When multiple tools are active simultaneously, all should display correctly

**Considerations:**

- Placeholder message should be visually subtle (muted text color) to avoid drawing unnecessary attention
- Container height should remain consistent whether showing tools or placeholder
- Styling should match existing patterns in the component (e.g., tool history section uses similar border and padding)
- The fix should not affect the tool history section below, which already uses a stable collapsible pattern

**Assumptions:**

- Placeholder text "No active tools" or "Waiting for tool execution" is acceptable (may need UX review)
- No changes needed to parent components (`pipeline-step.tsx`, `pipeline-view.tsx`) as they only pass props
- No changes needed to type definitions as the fix is purely presentational

**Architecture Alignment:**

- Follows React best practices for stable DOM structure
- Maintains consistency with existing tool history section pattern
- Preserves existing component props and behavior
- No breaking changes to component API

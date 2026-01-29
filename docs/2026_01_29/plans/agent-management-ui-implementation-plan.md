# Agent Management UI - Implementation Plan

**Generated**: 2026-01-29
**Feature**: Agent Management UI

## Original Request

Agent Management UI

Why: Agents are central to the orchestration system (11 agents defined in design: clarification-agent, database-schema, tanstack-query, etc.). Backend fully implemented with CRUD operations, activation/deactivation, and project-scoped overrides. Users need to customize prompts and tool allowlists.

Scope:
- Build /agents page with agent list/grid view
- Create agent detail/edit form (name, description, prompt, allowed tools)
- Implement agent activation toggle
- Add "Reset to Default" functionality for built-in agents

Unblocks: Agent customization, project-specific agent overrides, advanced workflow configuration

## Refined Request

Clarify needs a comprehensive Agent Management UI to enable users to customize the 11 built-in agents (clarification-agent, database-schema, tanstack-query, frontend-component, and others) that drive the orchestration system, allowing teams to tailor agent behavior to their specific project requirements and coding standards. The backend is fully implemented with complete CRUD operations, agent activation and deactivation capabilities, and support for project-scoped agent overrides, but users currently lack a visual interface to access these features. The implementation should build an `/agents` page within the Next.js App Router that displays all available agents in a searchable list or grid view, with the ability to toggle agent activation status directly from the main interface. Each agent card should show the agent's display name, description, type, assigned color indicator, and activation status, providing quick context at a glance. Clicking an agent should open a detailed agent editor modal or dedicated form utilizing TanStack Form to manage the agent's editable properties including name, description, system prompt, and allowed tools configuration. For built-in agents, the form must include a "Reset to Default" button that reverts custom overrides back to the original system-defined prompt and tool allowlists. The UI should leverage existing Base UI primitives with CVA styling patterns consistent with the rest of the application, integrate with the existing TanStack Query hooks (useAgents, useAgent, useUpdateAgent, useActivateAgent, useDeactivateAgent, useResetAgent), and follow the established query key factory pattern for cache invalidation. The implementation should support toggling between agent activation states via dedicated toggle controls or buttons, visually distinguishing active agents from deactivated ones through color, opacity, or badge indicators. The form validation should ensure required fields are populated and provide helpful error messages via the existing Zod validation infrastructure. This feature unblocks critical functionality for agent customization, enables project-specific agent overrides where organizations can maintain centralized templates while allowing teams to customize for their needs, and provides the foundation for advanced workflow configuration where users can assign specific agents to particular workflow steps with tailored prompts and restricted tool access.

---

## Overview

**Complexity**: Medium
**Risk Level**: Low

## Quick Summary

Build a comprehensive Agent Management UI at `/agents` that displays all 11 built-in agents in a searchable grid/list view with activation toggle controls, and enables editing agent configuration (display name, description, system prompt) via a TanStack Form dialog. The implementation will leverage existing query hooks, UI components, and follow established patterns from the workflows page.

## Prerequisites

- [ ] Verify existing agent IPC handlers are working (`agent.list`, `agent.get`, `agent.update`, `agent.activate`, `agent.deactivate`, `agent.reset`)
- [ ] Confirm existing TanStack Query hooks are functional (`useAgents`, `useAgent`, `useUpdateAgent`, `useActivateAgent`, `useDeactivateAgent`, `useResetAgent`)
- [ ] Review agent schema to confirm all fields: `id`, `name`, `displayName`, `description`, `type`, `color`, `systemPrompt`, `deactivatedAt`, `builtInAt`, `parentAgentId`, `projectId`

## Implementation Steps

### Step 1: Create Agent Zod Validation Schema

**What**: Create Zod validation schema for the agent editor form
**Why**: Ensures form data integrity and provides helpful error messages consistent with existing validation patterns
**Confidence**: High

**Files to Create:**
- `lib/validations/agent.ts` - Agent form validation schema

**Changes:**
- Create `updateAgentSchema` with fields: `displayName` (required, max 255), `description` (optional, max 1000), `systemPrompt` (required, max 50000)
- Export `UpdateAgentFormValues` and `UpdateAgentOutput` types
- Follow the pattern from `lib/validations/workflow.ts`

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] Schema file exists at `lib/validations/agent.ts`
- [ ] Schema validates required fields with appropriate error messages
- [ ] Types are exported for form integration
- [ ] All validation commands pass

---

### Step 2: Create Agent Card Component

**What**: Build a reusable AgentCard component to display agent information in the grid view
**Why**: Provides consistent visual representation of agents with status indicators and action controls
**Confidence**: High

**Files to Create:**
- `components/agents/agent-card.tsx` - Agent card component

**Changes:**
- Create `AgentCard` component following `WorkflowCard` pattern
- Display: `displayName`, `description` (truncated), `type` badge, `color` indicator dot
- Show active/deactivated status via opacity or badge indicator
- Include activation toggle using `Switch` component
- Add "Edit" button to trigger editor dialog
- Add "Reset to Default" button for custom agents (check `parentAgentId !== null`)
- Apply visual distinction for deactivated agents (reduced opacity)
- Accept props: `agent`, `onEdit`, `onToggleActive`, `onReset`, `isToggling`, `isResetting`

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] Component renders agent display name, description, type badge
- [ ] Color indicator displays agent's assigned color
- [ ] Switch toggles activation state
- [ ] Edit and Reset buttons are present with appropriate visibility logic
- [ ] All validation commands pass

---

### Step 3: Create Agent Editor Dialog Component

**What**: Build a dialog for editing agent configuration using TanStack Form
**Why**: Enables users to customize agent name, description, and system prompt with proper validation
**Confidence**: High

**Files to Create:**
- `components/agents/agent-editor-dialog.tsx` - Agent editor dialog with TanStack Form

**Changes:**
- Create `AgentEditorDialog` component following `CreateWorkflowDialog` pattern
- Accept props: `trigger`, `agent` (the agent to edit), `onSuccess`
- Use `DialogRoot`, `DialogPortal`, `DialogBackdrop`, `DialogPopup`, `DialogTitle`, `DialogDescription`, `DialogClose`
- Integrate `useAppForm` with `updateAgentSchema` validator
- Form fields: `displayName` (TextField), `description` (TextareaField, optional), `systemPrompt` (TextareaField with larger rows)
- Show agent `type` and `color` as read-only display (not editable)
- Show "Built-in Agent" badge when `builtInAt !== null`
- Include "Reset to Default" button inside dialog for built-in agents with custom overrides
- Call `useUpdateAgent` mutation on submit
- Handle dialog open/close state and form reset

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] Dialog opens when trigger is clicked
- [ ] Form populates with current agent values
- [ ] Validation errors display for required fields
- [ ] Submit calls update mutation and closes dialog on success
- [ ] Reset button appears for agents with `parentAgentId !== null`
- [ ] All validation commands pass

---

### Step 4: Create Agent Card Loading Skeleton

**What**: Build a loading skeleton component for the agent cards grid
**Why**: Provides visual feedback during data loading, matching the pattern from workflows page
**Confidence**: High

**Files to Modify:**
- `app/(app)/agents/page.tsx` - Add skeleton component inline (following workflows page pattern)

**Changes:**
- Create `AgentCardSkeleton` component within the page file
- Match the visual structure of `AgentCard` with animated placeholder divs
- Include placeholder for: title, description, type badge, color indicator, switch, buttons

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] Skeleton visually matches AgentCard layout
- [ ] Uses animate-pulse class for loading animation
- [ ] All validation commands pass

---

### Step 5: Implement Agents Page Main Content

**What**: Replace placeholder content with full agent management UI
**Why**: This is the core feature that enables users to view, search, filter, and manage agents
**Confidence**: High

**Files to Modify:**
- `app/(app)/agents/page.tsx` - Replace placeholder with full implementation

**Changes:**
- Add "use client" directive
- Import required components: `QueryErrorBoundary`, `EmptyState`, `Input`, `Select` components, `Button`, `Badge`, `Switch`
- Import custom components: `AgentCard`, `AgentEditorDialog`
- Import hooks: `useAgents`, `useActivateAgent`, `useDeactivateAgent`, `useResetAgent`
- Import `agentTypes` from agents schema
- Set up URL state with nuqs: `search` (string), `type` (agent type filter), `showDeactivated` (boolean)
- Call `useAgents` with `includeDeactivated` based on URL state
- Implement client-side filtering by search term (matches `displayName` and `description`) and type
- Create page header with title "Agents" and description
- Add filter controls: search input, type select dropdown, "Show Deactivated" checkbox/switch
- Render grid of `AgentCard` components using `grid gap-4 md:grid-cols-2 lg:grid-cols-3`
- Handle activation toggle via `useActivateAgent` and `useDeactivateAgent`
- Handle reset via `useResetAgent`
- Implement empty states: no agents found, no matching filters
- Wrap content in `QueryErrorBoundary`
- Display loading skeletons during data fetch

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] Page displays all agents in grid layout
- [ ] Search filters agents by name and description
- [ ] Type filter limits agents by type
- [ ] Show/hide deactivated toggle works
- [ ] Activation toggle updates agent status
- [ ] Edit button opens agent editor dialog
- [ ] Reset button resets agent to defaults
- [ ] Loading and empty states display correctly
- [ ] All validation commands pass

---

### Step 6: Add Badge Variants for Agent Types and Colors

**What**: Add new badge variants to support agent types and agent colors
**Why**: Enables consistent visual styling for agent type badges and color indicators
**Confidence**: High

**Files to Modify:**
- `components/ui/badge.tsx` - Add agent-related variants

**Changes:**
- Add badge variants for agent types: `planning`, `specialist`, `review` (planning already exists, may need specialist and review)
- Add badge variants or utility for agent colors: `green`, `blue`, `yellow`, `cyan`, `red`
- Consider adding a small circular "dot" variant for color indicators

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] Badge variants exist for all agent types
- [ ] Color indicator styling is available
- [ ] All validation commands pass

---

### Step 7: Manual Testing and Refinement

**What**: Perform end-to-end testing of the agent management UI
**Why**: Ensures all interactions work correctly and the UI is polished
**Confidence**: High

**Files to Modify:**
- Any files requiring fixes discovered during testing

**Changes:**
- Test agent list loading
- Test search and filter functionality
- Test activation/deactivation toggle
- Test agent editor dialog open, edit, save, cancel flows
- Test reset to defaults functionality
- Test empty states
- Test error handling
- Verify accessibility (keyboard navigation, screen reader labels)
- Fix any discovered issues

**Validation Commands:**
```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**
- [ ] All agent CRUD operations work correctly
- [ ] Filters and search work as expected
- [ ] UI is responsive and accessible
- [ ] No console errors during normal operation
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint`
- [ ] Agent list displays correctly with all 11 built-in agents
- [ ] Activation toggle updates agent status in real-time
- [ ] Agent editor dialog saves changes correctly
- [ ] Reset functionality works for custom overrides
- [ ] Search and filter controls function correctly
- [ ] Loading states display during data fetch
- [ ] Empty states display when appropriate
- [ ] Error boundaries catch and display errors gracefully

## Notes

- **Agent Type Constants**: Use `agentTypes` from `db/schema/agents.schema.ts` for type filtering and display
- **Agent Colors**: Use `agentColors` from `db/schema/agents.schema.ts` for color indicators
- **Built-in Detection**: Check `builtInAt !== null` to identify built-in agents
- **Activation Status**: Check `deactivatedAt === null` to determine if agent is active
- **Reset Logic**: The reset operation deactivates the custom agent and activates its parent built-in agent
- **Form Pattern**: Follow the `CreateWorkflowDialog` pattern for TanStack Form integration with `useAppForm`
- **Query Key Pattern**: Mutations already handle cache invalidation via the existing hooks in `use-agents.ts`
- **No Tools Configuration**: The initial implementation focuses on core agent properties (name, description, prompt). Tools configuration can be added in a future iteration if needed
- **Project Scope**: This implementation covers global agents. Project-scoped agent overrides can be enhanced later

---

## File Discovery Results

### Critical Priority
- `app/(app)/agents/page.tsx` - Main agents page (currently placeholder)

### High Priority
- `hooks/queries/use-agents.ts` - Agent query hooks (already implemented)
- `lib/queries/agents.ts` - Query key factory (already implemented)
- `db/schema/agents.schema.ts` - Agent schema definition
- `db/schema/agent-tools.schema.ts` - Agent tools schema
- `electron/ipc/agent.handlers.ts` - IPC handlers for agent operations
- `db/repositories/agents.repository.ts` - Data access layer
- `types/electron.d.ts` - Type definitions
- `lib/forms/form-hook.ts` - Form hook factory

### Medium Priority (UI Components)
- `components/ui/card.tsx`, `dialog.tsx`, `badge.tsx`, `button.tsx`, `switch.tsx`, `input.tsx`, `empty-state.tsx`, `tooltip.tsx`
- Form components in `components/ui/form/`
- `components/data/query-error-boundary.tsx`

### Reference Patterns
- `app/(app)/workflows/page.tsx` - List page pattern
- `components/workflows/workflow-card.tsx` - Card component pattern
- `components/workflows/create-workflow-dialog.tsx` - Form dialog pattern
- `lib/validations/workflow.ts` - Zod validation pattern

### Files to Create
1. `lib/validations/agent.ts`
2. `components/agents/agent-card.tsx`
3. `components/agents/agent-editor-dialog.tsx`

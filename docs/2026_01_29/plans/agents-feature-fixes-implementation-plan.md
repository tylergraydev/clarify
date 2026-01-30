# Implementation Plan: Fix Agents Feature Issues

**Generated:** 2026-01-29
**Original Request:** Fix all issues identified in the Agents Feature Audit Report
**Refined Request:** Fix all issues identified in the Agents Feature Audit Report across the entire agent management system, addressing critical preload API deficiencies, high-priority gaps in agent CRUD operations and error handling, medium-priority issues with filtering and validation, and low-priority issues with input validation and built-in agent protection.

---

## Analysis Summary

- Feature request refined with project context
- Discovered 38 files across 7 directories
- Generated 13-step implementation plan

---

## File Discovery Results

### Critical Priority (4 files)
- `electron/preload.ts` - Fix agent.list() to pass filters, add create/delete methods
- `types/electron.d.ts` - Add filter types, create/delete signatures
- `electron/ipc/channels.ts` - Add agent:create and agent:delete channels
- `electron/ipc/agent.handlers.ts` - Add create/delete handlers, fix reset cascade

### High Priority (12 files)
- `db/repositories/agents.repository.ts` - Increment version on update, add Zod validation
- `db/repositories/agent-tools.repository.ts` - Add input validation
- `db/repositories/agent-skills.repository.ts` - Add input validation
- `hooks/queries/use-agents.ts` - Server-side filters, create/delete hooks, toast integration
- `hooks/queries/use-agent-tools.ts` - Add toast error handling
- `hooks/queries/use-agent-skills.ts` - Add toast error handling
- `components/agents/agent-editor-dialog.tsx` - Fix useEffect deps, add error toasts
- `components/agents/agent-card.tsx` - Add explicit color fallback
- `components/agents/agent-tools-manager.tsx` - Add Zod validation
- `components/agents/agent-skills-manager.tsx` - Add Zod validation
- `app/(app)/agents/page.tsx` - Update filtering, add error handling
- `lib/validations/agent.ts` - Add createAgentSchema, tool/skill schemas

### Medium/Low Priority (22 files)
- Query key factories, schema definitions, reference files

---

## Overview

**Estimated Duration**: 3-4 days
**Complexity**: High
**Risk Level**: Medium

## Quick Summary

- Fix IPC layer deficiencies: add filter parameter passing, create/delete channels, and built-in agent protection
- Implement proper version incrementing and cascade deletion in repository layer with Zod validation
- Add toast error handling and server-side filtering to query hooks
- Fix UI components: useEffect dependencies, color fallbacks, and form validation
- Create comprehensive Zod validation schemas for agent tools and skills

## Prerequisites

- [ ] Review existing agent schema definitions in `db/schema/agents.schema.ts`, `db/schema/agent-tools.schema.ts`, `db/schema/agent-skills.schema.ts`
- [ ] Understand the current IPC handler registration pattern in `electron/main.ts`
- [ ] Verify TanStack Query and toast integration patterns from existing hooks

## Implementation Steps

### Step 1: Add Agent List Filter Types and Channel Definitions

**What**: Define filter interface types for agent listing and add create/delete channel constants to the IPC channels file
**Why**: The IPC layer needs proper type definitions before handlers and preload can be updated; channels must be defined in the central channels.ts file
**Confidence**: High

**Files to Modify:**

- `electron/ipc/channels.ts` - Add `create` and `delete` channel constants to the agent namespace

**Changes:**

- Add `create: "agent:create"` channel constant to the agent object
- Add `delete: "agent:delete"` channel constant to the agent object
- Maintain alphabetical order within the agent namespace

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] New channel constants are defined
- [ ] All validation commands pass

---

### Step 2: Update Type Definitions with Filter Interface and New Method Signatures

**What**: Add AgentListFilters interface and update ElectronAPI type declarations with create, delete methods and filter parameter for list
**Why**: TypeScript type safety requires matching type declarations before implementation
**Confidence**: High

**Files to Modify:**

- `types/electron.d.ts` - Add AgentListFilters interface, update list signature, add create and delete method signatures

**Changes:**

- Add `AgentListFilters` interface with `includeDeactivated`, `projectId`, and `type` optional properties
- Update `list` method signature to accept optional `AgentListFilters` parameter
- Add `create(data: NewAgent): Promise<Agent>` method signature
- Add `delete(id: number): Promise<boolean>` method signature

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] AgentListFilters interface is exported
- [ ] All agent API method signatures are updated
- [ ] All validation commands pass

---

### Step 3: Update Preload API to Pass Filters and Add Create/Delete Methods

**What**: Modify preload.ts to pass filter parameters to agent.list and add create/delete methods with corresponding IpcChannels references
**Why**: The preload bridge must expose the full API to the renderer process
**Confidence**: High

**Files to Modify:**

- `electron/preload.ts` - Update list method, add create/delete methods in agent namespace, update IpcChannels constant

**Changes:**

- Update the duplicated IpcChannels constant to include `create` and `delete` in agent namespace
- Modify `agent.list` to accept and pass filters parameter: `list: (filters?) => ipcRenderer.invoke(IpcChannels.agent.list, filters)`
- Add `agent.create` method: `create: (data) => ipcRenderer.invoke(IpcChannels.agent.create, data)`
- Add `agent.delete` method: `delete: (id) => ipcRenderer.invoke(IpcChannels.agent.delete, id)`
- Update ElectronAPI interface in preload to match types/electron.d.ts

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] IpcChannels constant includes create and delete
- [ ] agent.list accepts filters parameter
- [ ] agent.create and agent.delete methods are implemented
- [ ] All validation commands pass

---

### Step 4: Update Agents Repository with Version Increment and Input Validation

**What**: Modify the update method to increment version field and add Zod validation for create/update operations
**Why**: Version tracking is required per the audit, and input validation prevents invalid data from reaching the database
**Confidence**: High

**Files to Modify:**

- `db/repositories/agents.repository.ts` - Add version increment in update method, add Zod validation
- `lib/validations/agent.ts` - Add createAgentSchema, agentToolSchema, and agentSkillSchema

**Changes:**

- In agents.repository.ts update method: increment version by reading current version and adding 1, or use SQL expression `sql\`version + 1\``
- Import Zod and validation schemas at the top
- Add validation in create method to parse input data through createAgentSchema
- Add validation in update method to parse input data through updateAgentSchema
- In lib/validations/agent.ts: add `createAgentSchema` with name, displayName, systemPrompt, type, and optional fields
- Add `agentToolInputSchema` for validating tool name and pattern
- Add `agentSkillInputSchema` for validating skill name

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Version is incremented on every update operation
- [ ] Create operations validate input through Zod schema
- [ ] Update operations validate input through Zod schema
- [ ] New validation schemas are exported
- [ ] All validation commands pass

---

### Step 5: Add Zod Validation to Agent Tools and Skills Repositories

**What**: Add input validation using Zod schemas in agent-tools and agent-skills repository create/update methods
**Why**: Prevents invalid tool/skill data from being persisted to the database
**Confidence**: High

**Files to Modify:**

- `db/repositories/agent-tools.repository.ts` - Add Zod validation for create and update methods
- `db/repositories/agent-skills.repository.ts` - Add Zod validation for create and update methods

**Changes:**

- Import validation schemas from lib/validations/agent.ts
- In agent-tools.repository.ts create method: validate data.toolName and data.toolPattern
- In agent-tools.repository.ts update method: validate data if toolName or toolPattern are present
- In agent-skills.repository.ts create method: validate data.skillName
- In agent-skills.repository.ts update method: validate data if skillName is present

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Tool name validation rejects empty strings
- [ ] Skill name validation rejects empty strings
- [ ] All validation commands pass

---

### Step 6: Add Create, Delete, and Reset Cascade Handlers to Agent IPC

**What**: Implement agent:create and agent:delete IPC handlers with built-in agent protection, fix reset handler to properly cascade delete orphaned custom agents
**Why**: Create functionality is missing, delete functionality is missing, reset creates orphaned records without proper cleanup
**Confidence**: Medium

**Files to Modify:**

- `electron/ipc/agent.handlers.ts` - Add create handler, add delete handler with built-in protection, fix reset handler cascade

**Changes:**

- Add create handler: validate input, check for duplicate names, call agentsRepository.create
- Add delete handler: check if agent is built-in (builtInAt !== null), return error if so, otherwise call agentsRepository.delete
- Modify reset handler: before deactivating custom agent, delete the custom agent entirely instead of just deactivating (prevents orphaned records)
- Add built-in agent protection check in delete handler that returns a boolean false or throws error for built-in agents
- Pass agentToolsRepository and agentSkillsRepository to registerAgentHandlers function signature for cascade cleanup

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] agent:create handler creates new agents
- [ ] agent:delete handler prevents deletion of built-in agents
- [ ] agent:reset properly cleans up custom agent records
- [ ] All validation commands pass

---

### Step 7: Update Query Hooks with Server-Side Filtering and Toast Integration

**What**: Modify useAgents and related hooks to pass filters to server, add error toast handling to mutation hooks
**Why**: Current implementation fetches all agents and filters client-side, errors are not surfaced to users
**Confidence**: High

**Files to Modify:**

- `hooks/queries/use-agents.ts` - Pass filters to API, add create/delete hooks, add toast error handling
- `hooks/queries/use-agent-tools.ts` - Add toast error handling to mutations
- `hooks/queries/use-agent-skills.ts` - Add toast error handling to mutations

**Changes:**

- In use-agents.ts: import useToast hook
- Update useAgents queryFn to pass filters directly: `api!.agent.list(filters)`
- Remove client-side filtering logic from useAgents
- Update useActiveAgents to use server-side filtering with includeDeactivated: false
- Update useAgentsByProject and useAgentsByType to pass filters to server
- Add useCreateAgent mutation hook with toast success/error handling
- Add useDeleteAgent mutation hook with toast success/error handling
- Add onError callbacks to all existing mutation hooks that show toast errors
- In use-agent-tools.ts: import useToast, add onError to each mutation
- In use-agent-skills.ts: import useToast, add onError to each mutation

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Filters are passed to server in all agent query hooks
- [ ] useCreateAgent hook is implemented
- [ ] useDeleteAgent hook is implemented
- [ ] All mutations have onError with toast notification
- [ ] All validation commands pass

---

### Step 8: Fix AgentEditorDialog useEffect Dependencies and Add Error Toasts

**What**: Fix the useEffect dependency array that may skip dependencies, add toast notifications for mutation errors
**Why**: Missing dependencies can cause stale closures; users need feedback when operations fail
**Confidence**: High

**Files to Modify:**

- `components/agents/agent-editor-dialog.tsx` - Fix useEffect deps, add error toast handling

**Changes:**

- Import useToast hook
- Review useEffect at line 102-109: ensure form.reset and updateSelectedColor are properly memoized or included in deps
- The current useEffect has `[agent, form]` but updateSelectedColor is used inside - verify this is an effectEvent (it is, via useEffectEvent)
- Add onError handler to updateAgentMutation that displays toast with error message
- Add onError handler to resetAgentMutation that displays toast with error message
- Remove the manual error throw in onSubmit catch block, let mutation onError handle it

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] useEffect dependencies are complete (or intentionally excluded with comments)
- [ ] Mutation errors display toast notifications
- [ ] All validation commands pass

---

### Step 9: Add Explicit Color Fallback Logic in AgentCard

**What**: Replace silent fallback for undefined agent colors with explicit default handling
**Why**: Silent failures make debugging difficult; explicit fallbacks are more maintainable
**Confidence**: High

**Files to Modify:**

- `components/agents/agent-card.tsx` - Add explicit color fallback with default constant

**Changes:**

- Define a DEFAULT_AGENT_COLOR constant at the top of the file (e.g., "blue")
- Modify getColorClasses function to use the constant instead of falling back silently
- Add a comment explaining the fallback behavior
- Optionally log a warning in development when color is undefined/invalid

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] DEFAULT_AGENT_COLOR constant is defined
- [ ] getColorClasses uses explicit fallback
- [ ] All validation commands pass

---

### Step 10: Add Input Validation to Agent Tools and Skills Manager Components

**What**: Add client-side Zod validation before submitting new tools/skills
**Why**: Validates user input before API calls, provides immediate feedback
**Confidence**: High

**Files to Modify:**

- `components/agents/agent-tools-manager.tsx` - Add validation for tool name and pattern inputs
- `components/agents/agent-skills-manager.tsx` - Add validation for skill name input

**Changes:**

- Import agentToolInputSchema and agentSkillInputSchema from lib/validations/agent
- In agent-tools-manager.tsx handleAddTool: parse input through Zod schema before calling mutation
- Add error state for validation errors
- Display validation error message below input fields
- In agent-skills-manager.tsx handleAddSkill: parse input through Zod schema before calling mutation
- Add error state for validation errors
- Display validation error message below input field

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Tool name/pattern validation occurs before API call
- [ ] Skill name validation occurs before API call
- [ ] Validation errors are displayed to user
- [ ] All validation commands pass

---

### Step 11: Update Agents Page to Use Server-Side Filtering

**What**: Update the agents page to leverage server-side filtering and add proper error handling
**Why**: Current implementation does additional client-side filtering after already fetching filtered data
**Confidence**: High

**Files to Modify:**

- `app/(app)/agents/page.tsx` - Pass type filter to useAgents, simplify client-side filtering

**Changes:**

- Update useAgents call to pass both includeDeactivated and type filters to the server
- Remove redundant type filtering from client-side filter logic
- Keep only search-based filtering on client side (search filtering should remain client-side for responsiveness)
- Add error boundary or error state handling for query errors
- Optionally add retry button when queries fail

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Type filter is passed to useAgents
- [ ] Client-side filtering only handles search
- [ ] All validation commands pass

---

### Step 12: Clean Up Unused Query Key Definitions

**What**: Review and remove or document unused query key definitions from agent-related query key factories
**Why**: Unused keys cause maintenance confusion as noted in the audit
**Confidence**: Medium

**Files to Modify:**

- `lib/queries/agents.ts` - Review and clean up unused keys
- `lib/queries/agent-tools.ts` - Review detail key usage
- `lib/queries/agent-skills.ts` - Review detail key usage

**Changes:**

- Review each query key definition against actual usage in hooks
- Remove `detail` key from agent-tools.ts if not used (currently only byAgent is used)
- Remove `detail` key from agent-skills.ts if not used (currently only byAgent is used)
- Add comments to any keys that are intentionally kept for future use
- Ensure all remaining keys have corresponding hook implementations

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Unused query keys are removed or documented
- [ ] All remaining keys have corresponding hooks
- [ ] All validation commands pass

---

### Step 13: Add Built-in Agent Protection in IPC Layer

**What**: Ensure built-in agents cannot be deleted or have their core properties modified through the IPC layer
**Why**: Built-in agents are system components that should not be removed or fundamentally changed
**Confidence**: High

**Files to Modify:**

- `electron/ipc/agent.handlers.ts` - Add protection checks to update and delete handlers

**Changes:**

- In delete handler: check if agent.builtInAt is not null, if so return false or throw error
- In update handler: if agent is built-in, restrict which fields can be modified (allow displayName, description, color but not name, type, systemPrompt)
- Add a helper function isBuiltInAgent that checks builtInAt field
- Return meaningful error messages when operations are blocked

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Built-in agents cannot be deleted
- [ ] Built-in agent core properties are protected
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint`
- [ ] Agent list filtering works with server-side parameters
- [ ] Agent create functionality works from UI
- [ ] Agent delete functionality works for non-built-in agents
- [ ] Built-in agent deletion is properly blocked
- [ ] Toast notifications appear for all mutation errors
- [ ] Version field increments on agent updates
- [ ] Form validation provides immediate feedback

## Notes

**Dependencies and Order Constraints:**
- Steps 1-3 (IPC layer) must be completed before Steps 6-7 (handlers and hooks)
- Step 4 (validation schemas) must be completed before Steps 5 and 10 (repository and component validation)
- Steps 6 and 7 can be done in parallel after Steps 1-3

**Rollback Considerations:**
- All database changes are additive (no schema migrations required for this plan)
- Version field already exists in schema, just needs to be incremented
- If issues arise, individual handlers can be reverted independently

**Testing Recommendations:**
- Test agent CRUD operations end-to-end after completing Steps 1-7
- Test built-in agent protection after Step 13
- Verify toast notifications appear for all error scenarios
- Test form validation in both tools and skills managers

**Assumptions Requiring Confirmation:**
- The `useEffectEvent` hook is being used correctly in AgentEditorDialog (it is - this is a React 19 feature)
- Cascade delete for tools/skills is already handled by database foreign keys (confirmed in schema - onDelete: "cascade")

# Implementation Plan: Extended Thinking Configuration for Agents

**Generated**: 2026-02-03
**Updated**: 2026-02-03 (SDK compliance review applied)
**Original Request**: "As a user I would like the ability to enable/disable extended thinking on my agents and set the thinking token budget"

**Refined Request**: As a user, I would like the ability to enable or disable extended thinking on individual agents and configure the thinking token budget when extended thinking is enabled. The extended thinking setting should be stored at the agent configuration level in the database alongside existing agent properties like model and permissionMode, allowing different agents to have different extended thinking configurations. By default, extended thinking should be disabled for all agents, with the thinking token budget input field only becoming visible and editable when extended thinking is explicitly enabled. The thinking token budget should be implemented as a numeric input field with server-side and client-side validation to ensure the value falls within a valid range (minimum 1000 tokens, maximum 128000 tokens), providing clear feedback to users if they attempt to enter values outside this range. This configuration will integrate with the existing @anthropic-ai/claude-agent-sdk integration by passing the maxThinkingTokens option during agent stream initialization in the agent stream service.

## Overview

**Estimated Duration**: 4-6 hours
**Complexity**: Medium
**Risk Level**: Low

## Quick Summary

This plan adds extended thinking configuration to agents, allowing users to enable/disable extended thinking and set a token budget (1000-128000 tokens) per agent. The configuration is stored in the database, exposed through the agent editor UI with a toggle and conditional number field, and passed to the Claude Agent SDK during stream initialization.

**SDK Compliance Note**: When extended thinking is enabled, the SDK disables partial streaming (`StreamEvent` messages). The implementation must handle this by dynamically adjusting the `isPartialStreaming` flag to ensure complete messages are processed correctly.

## Prerequisites

- [ ] Ensure development environment is running (`pnpm electron:dev`)
- [ ] Verify database migration tooling is functional (`pnpm db:generate`)
- [ ] Confirm access to all critical files listed in the discovered files
- [ ] Review SDK documentation: `.claude/skills/claude-agent-sdk/references/streaming-responses.md` (lines 387-388)

## Implementation Steps

### Step 1: Add Extended Thinking Columns to Database Schema

**What**: Add two new columns to the agents table for storing extended thinking configuration.
**Why**: The database schema is the foundation - all other layers depend on this data model.
**Confidence**: High

**Files to Modify:**

- `db/schema/agents.schema.ts` - Add new columns to agents table

**Changes:**

- Add `extendedThinkingEnabled` column as `integer('extended_thinking_enabled')` with default `0` (SQLite boolean pattern using 0/1)
- Add `maxThinkingTokens` column as `integer('max_thinking_tokens')` nullable (only relevant when extended thinking is enabled)
- Both columns should allow null values for backward compatibility with existing records

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
pnpm db:generate
pnpm db:migrate
```

**Success Criteria:**

- [ ] Schema file compiles without TypeScript errors
- [ ] Migration file generated successfully in `drizzle/` directory
- [ ] Migration applies without errors
- [ ] `Agent` and `NewAgent` types include new fields via inference

---

### Step 2: Add Zod Validation Schemas for Extended Thinking Fields

**What**: Add validation rules for extended thinking fields to all agent validation schemas.
**Why**: Ensures consistent validation across form submission and repository operations with proper min/max token constraints.
**Confidence**: High

**Files to Modify:**

- `lib/validations/agent.ts` - Add extended thinking field validations

**Changes:**

- Add `extendedThinkingEnabled` field to `createAgentSchema` as `z.boolean().optional().default(false)`
- Add `maxThinkingTokens` field to `createAgentSchema` as `z.number().int().min(1000, 'Minimum 1000 tokens').max(128000, 'Maximum 128000 tokens').nullable().optional()`
- Add same fields to `createAgentFormSchema` with matching validation
- Add same fields to `updateAgentSchema` with matching validation (all optional for updates)
- Add same fields to `updateAgentRepositorySchema` with matching validation
- Update corresponding type exports to include new fields

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] All Zod schemas compile without TypeScript errors
- [ ] Type exports include new fields
- [ ] Validation rejects values outside 1000-128000 range
- [ ] All validation commands pass

---

### Step 3: Update Agent Import/Export Types

**What**: Add extended thinking fields to the AgentImportInput interface for import/export compatibility.
**Why**: Ensures agents with extended thinking configuration can be imported/exported correctly.
**Confidence**: High

**Files to Modify:**

- `types/electron.d.ts` - Add fields to AgentImportInput frontmatter interface

**Changes:**

- Add `extendedThinkingEnabled?: boolean` to the `AgentImportInput.frontmatter` interface
- Add `maxThinkingTokens?: number` to the `AgentImportInput.frontmatter` interface

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Type definitions compile without errors
- [ ] Import/export interfaces include new fields
- [ ] All validation commands pass

---

### Step 4: Update AgentStreamOptions Type

**What**: Add maxThinkingTokens to the AgentStreamOptions interface with comprehensive JSDoc documentation.
**Why**: Documents the option in the type system, enables TypeScript checking, and clearly communicates the streaming behavior impact to developers.
**Confidence**: High

**Files to Modify:**

- `types/agent-stream.d.ts` - Add maxThinkingTokens to AgentStreamOptions

**Changes:**

- Add `maxThinkingTokens?: number` property to the `AgentStreamOptions` interface
- Add comprehensive JSDoc comment explaining:
  - Purpose: Maximum tokens for Claude's extended thinking/reasoning process
  - Streaming impact: When set, partial streaming messages (`StreamEvent`, `text_delta`, `thinking_delta`) are disabled by the SDK
  - Behavior: Only complete `AssistantMessage` objects will be received after each turn
  - Reference: SDK documentation `streaming-responses.md` lines 387-388

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Type definitions compile without errors
- [ ] AgentStreamOptions includes maxThinkingTokens field with JSDoc
- [ ] JSDoc clearly documents streaming behavior impact
- [ ] All validation commands pass

---

### Step 5: Update Agent Editor Form Hook with Default Values

**What**: Add default values for extended thinking fields in the agent editor form hook.
**Why**: Ensures form state is properly initialized for both create and edit modes.
**Confidence**: High

**Files to Modify:**

- `hooks/agents/use-agent-editor-form.ts` - Add default values for new fields

**Changes:**

- Add `extendedThinkingEnabled: false` to default values in `getDefaultValues()` function for create mode
- Add `maxThinkingTokens: null` to default values for create mode
- For edit mode, read `extendedThinkingEnabled` from agent (converting SQLite 0/1 to boolean) and `maxThinkingTokens`
- Update the `AgentInitialData` interface if needed for duplicating agents with extended thinking config

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Hook compiles without TypeScript errors
- [ ] Default values properly initialize extended thinking fields
- [ ] Edit mode correctly reads existing values from agent
- [ ] All validation commands pass

---

### Step 6: Add Extended Thinking UI Fields to Agent Editor Dialog

**What**: Add a switch toggle for enabling extended thinking and a conditional number input for the token budget, with clear user guidance about behavior changes.
**Why**: Provides the user interface for configuring extended thinking on agents.
**Confidence**: High

**Files to Modify:**

- `components/agents/agent-editor-dialog.tsx` - Add toggle and number field

**Changes:**

- Add `extendedThinkingEnabled` and `maxThinkingTokens` to the form's default values in `getDefaultValues()` function
- Add a new `SwitchField` for `extendedThinkingEnabled` with label "Extended Thinking"
- Add description explaining the feature AND the streaming behavior change: "Enables extended reasoning for complex tasks. Note: Real-time text streaming is disabled when extended thinking is active - responses will appear after thinking completes."
- Add a `form.Subscribe` component that watches `extendedThinkingEnabled` value
- Inside the Subscribe, conditionally render a `NumberFieldComponent` for `maxThinkingTokens` when `extendedThinkingEnabled` is true
- Configure the number field with min=1000, max=128000, step=1000, label "Thinking Token Budget"
- Add description text explaining the token range and suggesting a default (e.g., "1,000 - 128,000 tokens. Recommended: 10,000 for most tasks.")
- Place the new fields after the Permission Mode field in the form layout
- Update form submission handler to include new fields when calling create/update mutations
- Convert boolean to SQLite integer (0/1) before sending to database

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Component compiles without TypeScript errors
- [ ] Switch toggle renders and functions correctly
- [ ] Number field only appears when toggle is enabled
- [ ] Number field respects min/max constraints
- [ ] Form submission includes new field values
- [ ] Description clearly communicates streaming behavior change
- [ ] All validation commands pass

---

### Step 7: Pass maxThinkingTokens to Agent SDK and Handle Streaming Mode

**What**: Update the agent stream service to pass maxThinkingTokens option to the SDK AND dynamically adjust the `isPartialStreaming` flag based on extended thinking configuration.
**Why**: This is the integration point where the configuration affects actual agent behavior. The `isPartialStreaming` flag MUST be set correctly or text/thinking content will not be displayed.
**Confidence**: High

**SDK Reference**: `streaming-responses.md` lines 387-388 - "Extended thinking: when you explicitly set `maxThinkingTokens`, `StreamEvent` messages are not emitted. You'll only receive complete messages after each turn."

**Files to Modify:**

- `electron/services/agent-stream.service.ts` - Pass maxThinkingTokens to SDK options and handle streaming mode

**Changes:**

1. **Detect Extended Thinking Mode**: In `startSDKStream()`, before building `sdkOptions`, determine if extended thinking is enabled:
   - Check if `options.maxThinkingTokens` is defined and greater than 0
   - Store result in a `hasExtendedThinking` boolean

2. **Pass maxThinkingTokens to SDK**: If `hasExtendedThinking` is true, set `sdkOptions.maxThinkingTokens = options.maxThinkingTokens`

3. **CRITICAL - Update isPartialStreaming Flag**:
   - The current code has `isPartialStreaming: true` hardcoded (line ~195)
   - When extended thinking is enabled, SDK does NOT emit `StreamEvent` messages
   - If `isPartialStreaming` remains `true`, the service skips processing complete text/thinking blocks in `processAssistantMessage()`, resulting in NO content being sent to the renderer
   - **Fix**: Set `isPartialStreaming: !hasExtendedThinking` when creating/updating the session
   - Alternatively, update `activeSession.isPartialStreaming` after determining SDK options

4. **Add Debug Logging**: Log when extended thinking is enabled with the token budget and a note that partial streaming is disabled

5. **Add Code Comment**: Document that when `maxThinkingTokens` is set, partial streaming messages are disabled by the SDK per `streaming-responses.md`

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Service compiles without TypeScript errors
- [ ] maxThinkingTokens is conditionally passed to SDK options
- [ ] `isPartialStreaming` is set to `false` when extended thinking is enabled
- [ ] `isPartialStreaming` remains `true` when extended thinking is disabled
- [ ] Debug logging includes maxThinkingTokens and streaming mode when set
- [ ] Complete messages are processed correctly when extended thinking is active
- [ ] All validation commands pass

---

### Step 8: Synchronize Preload Script Type Definitions

**What**: Ensure preload script type definitions match the updated types.
**Why**: The preload script has duplicate type definitions that must stay synchronized with the canonical types.
**Confidence**: High

**Files to Modify:**

- `electron/preload.ts` - Verify/update any duplicate type definitions

**Changes:**

- Review preload.ts for any AgentStreamOptions or related type definitions that need updating
- If duplicate types exist, add maxThinkingTokens property to maintain consistency
- If types are imported from canonical sources, no changes needed

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Preload script compiles without TypeScript errors
- [ ] Type definitions are synchronized with canonical sources
- [ ] All validation commands pass

---

### Step 9: Manual Integration Testing

**What**: Verify the complete feature works end-to-end, including streaming behavior changes.
**Why**: Ensures all layers integrate correctly and the user experience is as expected.
**Confidence**: High

**Files to Modify:**

- None (testing only)

**Changes:**

- Test creating a new agent with extended thinking disabled (default)
- Test creating a new agent with extended thinking enabled and valid token budget
- Test validation errors for token budget outside range (below 1000, above 128000)
- Test editing an existing agent to enable extended thinking
- Test editing an existing agent to disable extended thinking
- Test that the number field appears/disappears based on toggle state
- Verify the configuration is persisted correctly in the database
- Test agent import/export with extended thinking configuration
- **NEW**: Test that with extended thinking DISABLED, text streams in real-time (character by character)
- **NEW**: Test that with extended thinking ENABLED, text appears after thinking completes (no real-time streaming)
- **NEW**: Verify thinking content is displayed when extended thinking is active

**Validation Commands:**

```bash
pnpm electron:dev
```

**Success Criteria:**

- [ ] Agent creation with extended thinking works correctly
- [ ] Agent editing preserves extended thinking configuration
- [ ] Toggle shows/hides number field appropriately
- [ ] Validation provides clear feedback for out-of-range values
- [ ] Database correctly stores configuration
- [ ] Import/export preserves extended thinking settings
- [ ] **Streaming mode changes correctly based on extended thinking setting**
- [ ] **Text content displays correctly in both streaming and non-streaming modes**

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm typecheck`
- [ ] All files pass `pnpm lint`
- [ ] Database migration generates and applies successfully
- [ ] Manual testing confirms end-to-end functionality
- [ ] Extended thinking toggle works in create and edit modes
- [ ] Number field validation enforces 1000-128000 range
- [ ] **`isPartialStreaming` flag correctly toggles based on extended thinking configuration**
- [ ] **Content displays correctly in both streaming modes**

## Notes

**Important Considerations:**

1. **SQLite Boolean Pattern**: SQLite does not have a native boolean type. Use integer with 0/1 values, converting to/from boolean in the application layer.

2. **CRITICAL - Streaming Impact**: When `maxThinkingTokens` is set, the SDK disables partial streaming messages (`StreamEvent`). Per SDK documentation (`streaming-responses.md` lines 387-388):
   - No `text_delta` or `thinking_delta` events are emitted
   - Only complete `AssistantMessage` objects arrive after each turn
   - The `isPartialStreaming` flag in `agent-stream.service.ts` MUST be set to `false` when extended thinking is enabled, otherwise the service will skip processing complete messages and no content will be displayed

3. **Backward Compatibility**: Existing agents will have null values for the new columns. The application should treat null `extendedThinkingEnabled` as false and null `maxThinkingTokens` as disabled.

4. **Default Token Budget**: When enabling extended thinking, consider suggesting a sensible default (e.g., 10,000 tokens) in the UI description to guide users.

5. **Form State Management**: The conditional rendering of the number field should preserve any previously entered value if the user toggles extended thinking off and back on during the same session.

6. **Token Range Constraints**: The 1000-128000 token range is based on Anthropic API constraints, not SDK constraints. The SDK documentation does not specify explicit limits for `maxThinkingTokens`. These values may need adjustment if Anthropic updates their API limits.

7. **UI Feedback**: Since real-time streaming is disabled with extended thinking, the UI description should clearly communicate this to users. Consider adding a visual indicator during agent execution when extended thinking is active.

## SDK Documentation References

| Topic | File | Lines |
|-------|------|-------|
| `maxThinkingTokens` option definition | `options-configuration.md` | 29 |
| Streaming disabled with extended thinking | `streaming-responses.md` | 387-388 |
| `StreamEvent` message type | `streaming-responses.md` | 71-101 |
| Default streaming behavior | `streaming-responses.md` | 7-8, 134 |

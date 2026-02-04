# File Discovery Step Implementation Plan

Generated: 2026-02-04
Original Request: File Discovery Step implementation from `docs/features/file-discovery-overview.md`
Refined Request: The file discovery step is a critical phase in the planning workflow that identifies which files in the codebase are relevant to implementing a feature request by receiving the refined feature request as input and outputting a curated list of files with rich metadata including path, priority level (High/Medium/Low), intended action (Create/Modify/Delete/Reference), relevance explanation, and functional role within the feature. A Claude Agent SDK-powered specialist agent performs autonomous discovery with real-time streaming output to users via Electron IPC, allowing users to cancel at any time while preserving partial results in the database.

## Analysis Summary

- Feature request refined with project context (2x expansion)
- Discovered 38 files across 7 directories
- Generated 12-step implementation plan with 3 quality gates

---

## Overview
- **Estimated Complexity**: High
- **Risk Level**: Medium
- **Key Dependencies**: Claude Agent SDK, TanStack Table, TanStack Query, Zustand, Electron IPC

## Quick Summary

Implement the file discovery step for the planning workflow pipeline. This feature enables autonomous file discovery using a Claude Agent SDK-powered specialist agent with real-time streaming output, a TanStack Table-based review interface with filtering capabilities, and interactive file management including toggle, edit, add, and delete operations with immediate database persistence.

## Prerequisites

- [ ] Ensure Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`) is properly installed
- [ ] Verify existing clarification step patterns are working as reference
- [ ] Confirm TanStack Table and query infrastructure is operational

## Implementation Steps

### Step 1: Extend Database Schema for Discovery

**What**: Add new fields to the discovered files schema to support rich metadata and re-discovery modes
**Why**: The schema needs `role` and `relevanceExplanation` fields for richer file metadata, and the repository needs re-discovery support
**Confidence**: High

**Files**:
- `db/schema/discovered-files.schema.ts` - Add `role` and `relevanceExplanation` text fields, add `reference` to fileActions const

**Changes**:
- Add `role` text field for functional role within the feature
- Add `relevanceExplanation` text field for why the file is relevant
- Add `reference` to the `fileActions` const array
- Export updated types

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Schema compiles without errors
- [ ] New fields are optional (nullable) for backward compatibility
- [ ] Types are properly exported

---

### Step 2: Extend Repository for Re-Discovery and Bulk Operations

**What**: Add repository methods for re-discovery modes (replace/additive), bulk toggle, and bulk delete
**Why**: Re-discovery requires clearing existing files (replace mode) or merging (additive mode with duplicate handling)
**Confidence**: High

**Files**:
- `db/repositories/discovered-files.repository.ts` - Add `clearByWorkflowStep`, `findByPath`, `upsertMany`, `toggleInclude`, `deleteMany` methods

**Changes**:
- Add `clearByWorkflowStep(stepId)` for replace mode re-discovery
- Add `findByPath(stepId, filePath)` for duplicate detection
- Add `upsertMany(files)` for additive mode with duplicate update
- Add `toggleInclude(id)` for single-click toggle functionality
- Add `deleteMany(ids)` for bulk removal

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] All new methods follow existing repository patterns
- [ ] Proper transaction handling for bulk operations
- [ ] Methods return expected types

---

### Step 3: Create Discovery Streaming Types and Service

**What**: Create the file discovery service that orchestrates Claude Agent SDK execution with streaming
**Why**: Mirrors the clarification service pattern to provide autonomous file discovery with real-time output
**Confidence**: Medium

**Files**:
- `electron/services/file-discovery.service.ts` (Create) - Claude Agent SDK-powered discovery engine

**Changes**:
- Create `FileDiscoveryService` class following `ClarificationStepService` patterns
- Define `FileDiscoveryStreamMessage` types for streaming events
- Define `FileDiscoveryOutcome` discriminated union for results
- Implement `startDiscovery`, `cancelDiscovery`, `getState` methods
- Build structured output schema for discovered files
- Handle re-discovery modes (replace vs additive)
- Implement session management with abort controller and timeout

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Service follows clarification service patterns
- [ ] Streaming events properly typed
- [ ] Structured output schema validates discovered file metadata

---

### Step 4: Extend IPC Channels and Handlers for Discovery

**What**: Add IPC channels and handlers for discovery streaming, cancellation, and re-discovery
**Why**: Enables communication between renderer and main process for discovery operations
**Confidence**: High

**Files**:
- `electron/ipc/channels.ts` - Add `start`, `cancel`, `getState`, `rediscover`, `delete`, `toggle`, `stream` channels
- `electron/ipc/discovery.handlers.ts` - Add streaming, cancel, re-discovery handlers

**Changes**:
- Add channels: `discovery:start`, `discovery:cancel`, `discovery:getState`, `discovery:rediscover`, `discovery:delete`, `discovery:toggle`, `discovery:stream`
- Register handlers that invoke FileDiscoveryService methods
- Set up IPC event emitter for streaming messages to renderer
- Add re-discovery handler with mode parameter (replace/additive)

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] All new channels follow naming conventions
- [ ] Handlers properly wrap service methods with error handling
- [ ] Streaming channel uses ipcMain.on pattern (not invoke)

---

### Step 5: Extend Preload Script and Types for Discovery

**What**: Add discovery API methods to preload script and update electron types
**Why**: Exposes discovery functionality to renderer with proper TypeScript types
**Confidence**: High

**Files**:
- `electron/preload.ts` - Add discovery API with streaming subscription
- `types/electron.d.ts` - Add discovery streaming types and API interface

**Changes**:
- Add `DiscoveryAPI` interface with `start`, `cancel`, `getState`, `rediscover`, `delete`, `toggle`, `onStreamMessage` methods
- Add `DiscoveryStreamMessage` type union
- Add `DiscoveryOutcome` types
- Implement IIFE pattern for streaming subscription (following clarification pattern)

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Types mirror clarification streaming patterns
- [ ] Preload API follows existing conventions
- [ ] Streaming callback properly handles unsubscribe

---

## Quality Gate 1: Backend Complete

After Step 5, verify:
- [ ] All database operations work via IPC
- [ ] Streaming messages flow from main to renderer
- [ ] Discovery service can execute and return results
- [ ] Run `pnpm lint && pnpm typecheck` passes

---

### Step 6: Create Validation Schemas and Query Infrastructure

**What**: Create Zod validation schemas and extend query key factory for discovery operations
**Why**: Provides type-safe validation for forms and proper cache management for queries
**Confidence**: High

**Files**:
- `lib/validations/discovered-file.ts` (Create) - Zod schemas for discovered file operations
- `lib/queries/discovered-files.ts` - Add query keys for streaming state, re-discovery
- `hooks/queries/use-discovered-files.ts` - Add delete, toggle, streaming hooks

**Changes**:
- Create schemas for `addDiscoveredFileSchema`, `editDiscoveredFileSchema`, `fileMetadataSchema`
- Add query keys for discovery session state
- Add mutation hooks for delete, toggle, start, cancel, rediscover operations
- Add `useDiscoveryStream` hook for streaming subscription

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Schemas validate all required metadata fields
- [ ] Mutation hooks properly invalidate affected queries
- [ ] Streaming hook handles cleanup on unmount

---

### Step 7: Create Zustand Store for Discovery UI State

**What**: Create a Zustand store to manage discovery step UI state including streaming, filters, and selection
**Why**: Provides client-side state management for the discovery workspace without prop drilling
**Confidence**: High

**Files**:
- `lib/stores/discovery-store.ts` (Create) - Zustand store for discovery state

**Changes**:
- Define `DiscoveryState` interface with: `phase`, `sessionId`, `activeTools`, `streamingText`, `error`, `filters`, `searchTerm`
- Define `DiscoveryActions` interface with: `setPhase`, `setFilters`, `setSearchTerm`, `reset`
- Create store with initial state following pipeline-store patterns
- Add filter state for action, priority, and inclusion status

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Store follows existing Zustand patterns
- [ ] Filter state properly typed with discriminated unions
- [ ] Reset action clears all state to defaults

---

### Step 8: Create Discovery Table and Toolbar Components

**What**: Build the TanStack Table for displaying discovered files with filtering and toolbar
**Why**: Provides the main review interface for users to view and manage discovered files
**Confidence**: High

**Files**:
- `components/workflows/discovered-files-table.tsx` (Create) - TanStack Table for files
- `components/workflows/discovery-table-toolbar.tsx` (Create) - Search, filters, toolbar

**Changes**:
- Create table columns: checkbox, path, priority, action, role, relevance, inclusion status, actions
- Implement row click to toggle inclusion
- Add priority badges with color coding (High=red, Medium=yellow, Low=green)
- Add action badges (Create=green, Modify=blue, Delete=red, Reference=gray)
- Implement toolbar with text search, action filter, priority filter, inclusion filter
- Add bulk action buttons for include all, exclude all

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Table follows agent-table patterns with memoized cells
- [ ] Filters properly integrate with Zustand store
- [ ] Column persistence works via tableId

---

### Step 9: Create File Edit and Add Dialogs

**What**: Build modal dialogs for editing file metadata and adding files manually
**Why**: Enables users to modify discovered file details and manually add files not found by discovery
**Confidence**: High

**Files**:
- `components/workflows/edit-discovered-file-dialog.tsx` (Create) - Edit metadata dialog
- `components/workflows/add-file-dialog.tsx` (Create) - Manual file addition dialog

**Changes**:
- Create edit dialog with fields: path (readonly), priority, action, role, relevance explanation
- Create add dialog with fields: path (file picker/text input), priority, action, role, relevance
- Implement file picker integration via `dialog.openFile` IPC
- Support clipboard paste for file paths
- Use TanStack Form with validation schemas

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Dialogs follow existing dialog patterns with Base UI
- [ ] Forms properly validate all required fields
- [ ] File picker correctly filters to relevant file types

---

## Quality Gate 2: UI Components Complete

After Step 9, verify:
- [ ] Table displays files with correct columns
- [ ] Filters work correctly
- [ ] Dialogs open, validate, and submit
- [ ] Run `pnpm lint && pnpm typecheck` passes

---

### Step 10: Create Discovery Streaming and Stale Indicator Components

**What**: Build the streaming output display and stale discovery indicator
**Why**: Provides real-time feedback during discovery and warns when refinement changes invalidate discovery
**Confidence**: High

**Files**:
- `components/workflows/discovery-streaming.tsx` (Create) - Streaming output display
- `components/workflows/stale-discovery-indicator.tsx` (Create) - Stale warning indicator

**Changes**:
- Create streaming component showing active tools, progress, cancel button
- Follow clarification-streaming patterns for tool display
- Create stale indicator that compares refinement `updatedAt` with discovery `completedAt`
- Add warning banner with "Re-discover" action button

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Streaming component handles all message types
- [ ] Stale indicator correctly detects timestamp differences
- [ ] Cancel button properly aborts discovery

---

### Step 11: Create Discovery Workspace Component

**What**: Build the main discovery step workspace that orchestrates all sub-components
**Why**: Provides the unified interface for the discovery step within the pipeline view
**Confidence**: Medium

**Files**:
- `components/workflows/discovery-workspace.tsx` (Create) - Main discovery step UI

**Changes**:
- Create workspace with three sections: streaming area, file table, action bar
- Integrate discovery store for state management
- Handle discovery lifecycle: idle, streaming, reviewing, complete
- Implement re-discovery with mode selection (replace/additive)
- Connect streaming subscription to update store
- Display stale indicator when applicable
- Add "Continue to Planning" button that only enables when files are included

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Workspace follows clarification-workspace patterns
- [ ] State transitions properly handled
- [ ] Re-discovery modes work correctly

---

### Step 12: Integrate Discovery Workspace into Pipeline View

**What**: Connect the discovery workspace to the main pipeline view and step handling
**Why**: Makes the discovery step visible and functional within the workflow pipeline
**Confidence**: High

**Files**:
- `components/workflows/pipeline-view.tsx` - Integrate DiscoveryWorkspace
- `components/workflows/pipeline-step.tsx` - Add discovery step handling

**Changes**:
- Add discovery step type detection in pipeline view
- Render `DiscoveryWorkspace` when discovery step is active
- Add discovery metrics to `computeStepMetrics` function
- Update `PipelineStepType` to include `'discovery'`
- Add discovery step props to `PipelineStep` component
- Handle discovery step completion and progression

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Discovery step renders correctly in pipeline
- [ ] Step metrics show included file count
- [ ] Step transitions work with existing pipeline flow

---

## Quality Gate 3: Integration Complete

After Step 12, verify:
- [ ] Discovery step visible in pipeline
- [ ] Full workflow from streaming to completion works
- [ ] Re-discovery modes function correctly
- [ ] Stale indicator appears when expected
- [ ] Run `pnpm lint && pnpm typecheck` passes

---

## Notes

- The discovery service closely mirrors the clarification service pattern for consistency
- Extended thinking mode may be disabled for discovery to enable streaming (unlike clarification which uses it)
- The file discovery agent definition should be created separately in `.claude/agents/` following agent conventions
- Partial results are preserved when cancellation occurs by persisting files to database as they are discovered
- The audit log integration should capture the final included file list when the step completes
- Consider adding file existence validation via `fs:exists` IPC when displaying files

---

## File Discovery Results

### Files to Create (9)
| Path | Priority | Role |
|------|----------|------|
| `electron/services/file-discovery.service.ts` | High | Core discovery service |
| `components/workflows/discovery-workspace.tsx` | High | Main discovery UI |
| `components/workflows/discovered-files-table.tsx` | High | File list table |
| `components/workflows/edit-discovered-file-dialog.tsx` | High | Edit metadata dialog |
| `components/workflows/add-file-dialog.tsx` | High | Manual add dialog |
| `lib/validations/discovered-file.ts` | High | Validation schemas |
| `lib/stores/discovery-store.ts` | High | UI state store |
| `components/workflows/discovery-streaming.tsx` | Medium | Streaming display |
| `components/workflows/discovery-table-toolbar.tsx` | Medium | Table toolbar |
| `components/workflows/stale-discovery-indicator.tsx` | Medium | Stale warning |

### Files to Modify (10)
| Path | Priority | Changes |
|------|----------|---------|
| `db/schema/discovered-files.schema.ts` | High | Add role, relevanceExplanation |
| `db/repositories/discovered-files.repository.ts` | High | Add bulk ops, re-discovery |
| `electron/ipc/discovery.handlers.ts` | High | Add streaming handlers |
| `electron/ipc/channels.ts` | High | Add new channels |
| `electron/preload.ts` | High | Add discovery API |
| `hooks/queries/use-discovered-files.ts` | High | Add mutation hooks |
| `lib/queries/discovered-files.ts` | High | Add query keys |
| `components/workflows/pipeline-view.tsx` | High | Integrate workspace |
| `components/workflows/pipeline-step.tsx` | High | Add step handling |
| `types/electron.d.ts` | High | Add streaming types |

### Files for Reference (19)
Pattern files for service, streaming, workspace, table, dialog implementations.

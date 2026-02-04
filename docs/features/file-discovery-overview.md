# File Discovery Step Overview

## Purpose

The file discovery step is a critical phase in the planning workflow that identifies which files in the codebase are relevant to implementing a feature request. It bridges the gap between the refined feature requirements and the implementation plan by providing upfront context about the files that will need to be created, modified, deleted, or referenced.

## Position in Workflow

```
Feature Request → Clarification → Refinement → [File Discovery] → Planning → Routing
```

File discovery receives the refined feature request as input and outputs a curated list of relevant files with rich metadata for the planning step.

---

## Core Concepts

### Discovered Files

Each discovered file captures the following metadata:

| Field | Description |
|-------|-------------|
| **Path** | Relative path from repository root (e.g., `components/ui/Button.tsx`) |
| **Priority** | Importance level: `High`, `Medium`, or `Low` |
| **Action** | What needs to happen: `Create`, `Modify`, `Delete`, or `Reference` |
| **Relevance** | Explanation of why this file matters to the feature (includes agent reasoning) |
| **Role** | The purpose the file serves (e.g., "data model", "UI component", "utility") |

### Action Types

- **Create**: File does not exist and needs to be created
- **Modify**: Existing file that requires changes
- **Delete**: Existing file that should be removed
- **Reference**: Existing file needed for context but not directly changed

### Priority Levels

- **High**: Core files essential to the feature implementation
- **Medium**: Supporting files that contribute to the feature
- **Low**: Peripheral files with minor relevance

---

## Discovery Process

### Input

The discovery step receives only the refined feature request output from the refinement step. It does not receive the original feature request or clarification outputs directly.

### Execution

A specialized agent powered by the Claude Agent SDK performs the discovery. The agent:

1. Analyzes the refined feature request
2. Explores the codebase autonomously
3. Identifies relevant files based on its analysis
4. Returns structured output with file metadata

The agent determines its own search depth and strategy. There is no user-configurable "aggressiveness" setting.

### Progress Visibility

During discovery execution, users see the full agent output streamed in real-time, including the agent's reasoning and file discoveries as they happen.

### Cancellation

Users can cancel discovery at any time. Cancellation is immediate and any partially discovered files are preserved.

### Failure Handling

If discovery fails or times out:
- Any files discovered before the failure are preserved
- Users can retry discovery or work with the partial results
- Users can manually add files to supplement partial results

---

## User Review Interface

### Organization

Discovered files are displayed organized by priority level:
- High priority files appear first
- Medium priority files appear second
- Low priority files appear last

Within each priority group, files appear in discovery order (no manual reordering).

### Path Display

Files show their relative path from the repository root (e.g., `components/ui/Button.tsx`), not just the filename.

### Inclusion State

All discovered files are **included by default** (opt-out model). Users exclude files they don't want passed to the planning step.

### Visual Treatment

Reference action files receive the same visual treatment as actionable files (Create/Modify/Delete). They are not dimmed or separated.

### Search and Filtering

The review interface provides:
- **Text search**: Filter files by path/name matching
- **Attribute filters**: Filter by action type, priority level, or inclusion status
- Combined search and filters work together

---

## User Interactions

### Excluding Files

Users click to exclude files from the discovery results. Excluded files:
- Remain visible in the list (with visual indication)
- Are not passed to the planning step
- Can be re-included at any time

### Editing Files

Users edit file metadata through a dialog interface:
- Click a file to open the edit dialog
- Dialog shows all editable fields (priority, action, relevance, role)
- Changes save when the dialog is confirmed

No inline editing is supported. No bulk editing is supported.

### Adding Files Manually

Users can add files that weren't discovered using three methods:
1. **File picker**: Browse the repository file tree
2. **Search**: Search for files by name or path pattern
3. **Paste**: Enter file paths directly

When adding a file manually, users specify all metadata fields:
- Path (required)
- Priority (required)
- Action (required)
- Relevance (required)
- Role (required)

Users can add paths for files that don't exist yet. This is useful for planning new files. No filesystem validation occurs.

### Removing Files

Users can remove any file from the discovery results, including:
- Files discovered by the agent
- Files added manually

Removed files are deleted entirely (not just excluded).

### Re-running Discovery

Users can re-run discovery in two modes:

**Replace Mode**
- Clears all existing discovery results
- Runs discovery fresh
- User modifications are lost

**Additive Mode**
- Keeps existing files and user modifications
- Runs discovery and adds newly discovered files
- If a newly discovered file already exists, its metadata is updated from the new discovery
- User-modified files have their metadata updated (not preserved)

---

## Validation and Confirmation

### Proceeding to Planning

Users click an explicit "Continue to Planning" button to proceed. The workflow does not auto-advance.

### Empty State

If all files are excluded (zero included files):
- A warning is displayed
- Users can still proceed to planning
- Planning will work without pre-discovered file context

### File Existence

No validation occurs against the actual filesystem:
- "Create" action files are not checked for existence
- "Modify" action files are not verified to exist
- This is intentional—the agent determines actions based on its analysis

### Repository State

Discovery runs regardless of uncommitted changes in the repository. No warning or blocking occurs for dirty working directories.

---

## Persistence

### Automatic Saving

All changes persist immediately to the database:
- Exclusions
- Edits to file metadata
- Manual file additions
- File removals

Users can navigate away and return without losing changes.

### No Edit History

The system does not track edit history:
- Only the current state is stored
- No "original vs modified" comparison
- No undo/rollback to original discovery results

### Stale Indicator

If the user returns to the refinement step and re-runs refinement (changing its output), the discovery results are marked as potentially stale. This indicates to the user that discovery was based on a previous version of the refined request.

---

## Output to Planning

### What Planning Receives

The planning step receives:
- Only included files (excluded files are not passed)
- Full metadata for each file (path, priority, action, relevance, role)
- Structured format for easy consumption

### Planning Independence

The planning agent can still explore the codebase independently. Discovery results provide upfront context but do not constrain the planning agent's ability to look at additional files.

---

## Audit Trail

### Logging

The audit log captures:
- The final list of included files when proceeding to planning
- No statistics or changelog of user modifications

This keeps the audit log focused on outcomes rather than process details.

---

## Navigation

### Back Navigation

Users can return to the discovery step from later steps (planning, etc.):
- Discovery results remain editable
- Changes do not automatically invalidate later steps
- Users decide whether to re-run subsequent steps after making discovery changes

### Pause Behavior

Discovery follows the workflow's configured pause behavior:
- Pausing only occurs **between steps**, not during step execution
- When discovery completes, the workflow pauses (based on settings) before planning begins
- Users cannot pause mid-discovery; they can only cancel

---

## Acceptance Criteria

### Discovery Execution
- [ ] Discovery receives only the refined feature request as input
- [ ] Full agent output streams to the UI in real-time during execution
- [ ] User can cancel discovery at any time
- [ ] Partial results are preserved if discovery fails or is cancelled
- [ ] Discovery can be retried after failure

### File Metadata
- [ ] Each file has: path, priority (High/Medium/Low), action (Create/Modify/Delete/Reference), relevance, and role
- [ ] Paths display as relative paths from repository root
- [ ] All discovered files are included by default

### Review Interface
- [ ] Files are organized by priority level (High → Medium → Low)
- [ ] Text search filters files by path/name
- [ ] Attribute filters work for action type, priority, and inclusion status
- [ ] Search and filters can be combined

### User Editing
- [ ] Users can exclude/include files via click
- [ ] Users can edit file metadata through a dialog
- [ ] Users can remove files from results entirely
- [ ] Users can add files manually via file picker, search, or paste
- [ ] Manual file addition requires all metadata fields
- [ ] Users can add non-existent file paths

### Re-discovery
- [ ] Replace mode clears all results and runs fresh
- [ ] Additive mode keeps existing files and adds new discoveries
- [ ] Additive mode updates metadata for duplicate files

### Persistence
- [ ] All changes persist immediately to database
- [ ] User can navigate away and return without losing changes
- [ ] Discovery results marked stale when refinement output changes

### Validation
- [ ] Warning shown when proceeding with zero included files
- [ ] User can proceed with zero files if desired
- [ ] No filesystem validation occurs

### Navigation
- [ ] Explicit button required to proceed to planning
- [ ] User can navigate back from planning to re-edit discovery
- [ ] Pause behavior applies between discovery and planning steps

### Output
- [ ] Only included files passed to planning step
- [ ] Full metadata included for each file
- [ ] Audit log captures final included file list

---

## Out of Scope

The following are explicitly not part of the file discovery feature:

- Bulk editing of multiple files
- Manual reordering of files within priority groups
- Edit history or undo functionality
- Filesystem validation of file existence
- Repository state checking (uncommitted changes)
- File count limits
- Inline editing of metadata
- Automatic action correction (e.g., Create → Modify if file exists)
- Separate visual treatment for Reference files
- Per-file agent reasoning (separate from relevance field)

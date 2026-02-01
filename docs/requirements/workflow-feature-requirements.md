# Workflow Feature Requirements

> High-level requirements and user flow for the Planning Workflows feature in Clarify.

## Overview

The workflows feature enables users to orchestrate Claude Code CLI for feature planning through a visual, interactive pipeline. Users can watch progress in real-time, intervene at any step, edit outputs, and produce an implementation plan they can refine before execution.

## Scope

**In Scope (MVP):**
- Planning workflows only (4-step pipeline)
- Full intervention capabilities (pause, edit, regenerate, skip)
- Workflow detail, active list, and history pages
- Interactive plan editor
- Entry point: "Start Implementation" from completed planning workflow

**Out of Scope (MVP):**
- Implementation workflows (execution via specialist agents)
- Workflow cloning/duplication
- Git worktree management

---

## User Flow

### Starting a Workflow

1. User navigates to **Project Detail Page → Workflows Tab**
2. Clicks **"New Workflow"** button in toolbar
3. **Create Workflow Dialog** opens with:
   - Workflow type (Planning selected by default)
   - Feature name (required)
   - Feature request textarea (required)
   - Repository selection with primary designation
   - Template selector (optional, auto-populates request)
   - "Skip Clarification" toggle
4. User clicks **"Create"** → workflow created in `created` status
5. User clicks **"Start"** → workflow transitions to `running`

### Pipeline View (Workflow Detail Page)

**URL:** `/workflows/[id]`

**Layout:** Horizontal pipeline with 4 steps flowing left-to-right

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Clarify     │───▶│ Refine      │───▶│ Discover    │───▶│ Plan        │
│ (optional)  │    │             │    │ Files       │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

**Step Display States:**

| State | Visual | Behavior |
|-------|--------|----------|
| Pending | Dimmed, empty | Not yet reached |
| Running | Expanded, highlighted | Shows input + live output stream |
| Paused | Expanded, amber indicator | Shows current output + resume button |
| Completed | Collapsed | Shows status icon, title, key metrics |
| Failed | Expanded, red indicator | Shows error + retry/skip options |
| Skipped | Collapsed, skip icon | Shows as intentionally skipped |

**Collapsed Step Display:**
- Status icon (✓ completed, ⏭ skipped, ✗ failed)
- Step title
- Duration (e.g., "2m 34s")
- Key metric (e.g., "12 files discovered", "8 clarifying questions")
- Click to expand and view full output

**Expanded Step Display:**
- Step title and status
- Input section (what went into this step)
- Output section (live streaming or completed)
- Action buttons: Edit, Regenerate, Skip (where applicable)

### Navigation

- **Breadcrumbs:** Project Name > Workflows > [Workflow Name]
- **Back button:** Returns to project workflows tab
- **Sidebar:** Remains visible during workflow detail view

---

## Step Details

### Step 1: Clarification (Optional)

**Purpose:** Agent assesses feature request and asks clarifying questions if needed.

**Interaction Model:**
1. Agent analyzes feature request
2. Agent generates clarifying questions
3. Questions rendered as **form fields** (text inputs, selects, textareas)
4. User fills out answers and submits
5. Q&A captured as step output
6. Proceeds to Refinement with Q&A context

**Skip Behavior:**
- User can skip this step via toggle in create dialog
- Skipped step shows as "Skipped" in pipeline
- Refinement receives original feature request only

**Output:** Structured Q&A pairs

### Step 2: Refinement

**Purpose:** Agent rewrites feature request to be more specific and actionable.

**Output Display:** **Diff view** showing:
- Original feature request (left)
- Refined feature request (right)
- Visual diff highlighting changes

**User Actions:**
- Accept refined version
- Edit refined version (opens modal editor)
- Regenerate with different prompt

**Output:** Refined feature request text

### Step 3: File Discovery

**Purpose:** Agent identifies files relevant to implementing the feature.

**Interaction Model:**
1. File Discovery Agent receives:
   - Refined feature request
   - Clarification Q&A (if present)
2. Agent searches codebase and identifies relevant files
3. Results displayed with:
   - File path
   - Relevance reason
   - Priority level (high/medium/low)

**User Actions:**
- Add files manually (file picker or path input)
- Remove files from list
- Edit file priority
- Edit relevance notes

**Output:** List of files with priority and notes

### Step 4: Planning

**Purpose:** Agent generates a detailed implementation plan based on all prior context.

**Input:**
- Refined feature request
- Clarification Q&A
- Discovered files with priorities

**Output:** Interactive implementation plan

---

## Interactive Plan Editor

The planning step produces an editable implementation plan, not just a markdown document.

### Plan Step Structure

Each step in the plan contains:

| Field | Description |
|-------|-------------|
| Title | Short name for the step |
| Description | Detailed explanation of what to do |
| Files | List of files this step will create/modify |
| Suggested Agent | Which specialist agent should handle this |
| Dependencies | Which other steps must complete first |

### Editor Capabilities

**View Mode:**
- Steps displayed as cards in order
- Each card shows title, description preview, file count, agent badge
- Click card to expand and see full details

**Edit Mode:**
- **Add Step:** Button opens blank step form; user fills in all fields
- **Edit Step:** Click edit icon on card; opens form pre-filled with current values
- **Remove Step:** Delete icon with confirmation
- **Reorder Steps:** Drag and drop cards to reorder
- Dependency lines update automatically based on new order

### Agent Assignment

Each step can have a suggested agent:
- Database Schema Agent
- Frontend Component Agent
- IPC Handler Agent
- Page/Route Agent
- Form Agent
- etc.

User can change the suggested agent via dropdown.

---

## Intervention Capabilities

### Pause

- **Trigger:** "Pause" button visible on running workflow
- **Behavior:** Immediately stops CLI process
- **Resume:** "Resume" button continues from where it stopped
- Pause state persisted; user can close app and return

### Edit Output

- **Trigger:** "Edit" button on any completed step
- **Opens:** Modal editor with:
  - Full output in editable textarea
  - Markdown preview pane
  - Save / Discard buttons
- **On Save:**
  - Step output updated
  - `outputEditedAt` timestamp recorded
  - All subsequent steps marked as "needs regeneration"
  - User must manually trigger regeneration of following steps

### Regenerate

- **Trigger:** "Regenerate" button on completed step
- **Behavior:** Re-runs the step with current inputs
- **Effect:** Output replaced; subsequent steps invalidated

### Skip (Clarification Only)

- **Trigger:** "Skip" button on clarification step
- **Behavior:** Step marked as skipped; workflow proceeds to refinement
- Only available for clarification step

### Failure Handling

When a step fails:
1. Workflow auto-pauses
2. Step expands to show error message
3. User reviews error
4. Options: **Retry** (re-run step) or **Skip** (if clarification)

---

## Pages

### 1. Workflow Detail Page

**URL:** `/workflows/[id]`

**Components:**
- Breadcrumb navigation
- Workflow header (name, type, status, project)
- Horizontal pipeline with step cards
- Action bar (Pause/Resume, Cancel, Start Implementation)

**Auto-refresh:** Polls for updates while workflow is active (+ manual refresh button)

### 2. Active Workflows Page

**URL:** `/workflows/active`

**Purpose:** Dashboard monitoring of all running workflows across all projects

**Display:**
- Card or table showing all active workflows
- Columns: Workflow name, Project, Type, Status, Current Step, Progress, Duration
- Status badges with color coding
- Click to navigate to workflow detail

**Filters:** None needed (only shows active workflows)

### 3. Workflow History Page

**URL:** `/workflows/history`

**Purpose:** Searchable archive of completed, failed, and cancelled workflows

**Columns:**
- Feature name
- Project
- Type (planning/implementation)
- Status (completed/failed/cancelled)
- Duration
- Date completed

**Filters:**
- Status multi-select
- Type multi-select
- Project dropdown
- Date range picker
- Full-text search (searches feature name and request)

**Pagination:** Server-side with configurable page size

---

## Post-Planning Flow

When a planning workflow completes:
1. Workflow status changes to `completed`
2. Plan editor remains **fully editable** (auto-saves changes, tracks versions)
3. User can review and continue refining the plan
4. **"Start Implementation"** button visible
5. Clicking opens confirmation dialog:
   - Shows plan summary (current version)
   - Allows configuration of implementation settings
   - Confirms repository/branch for worktree
6. On confirm: Creates new implementation workflow with a **snapshot** of current plan state
7. Further edits to the planning workflow's plan do not affect the implementation

---

## Data Model

### Workflow

```
- id
- featureName
- featureRequest
- type: 'planning' | 'implementation'
- status: 'created' | 'running' | 'paused' | 'editing' | 'completed' | 'failed' | 'cancelled'
- pauseBehavior: 'continuous' | 'auto_pause' | 'gates_only'
- skipClarification: boolean
- projectId
- parentWorkflowId (for implementation linked to planning)
- currentStepNumber
- totalSteps
- timestamps (created, started, completed, updated)
- durationMs
- errorMessage
```

### Workflow Step

```
- id
- workflowId
- stepNumber
- stepType: 'clarification' | 'refinement' | 'discovery' | 'planning'
- title
- description
- status
- inputText
- outputText
- originalOutputText (for tracking edits)
- outputEditedAt
- outputStructured (JSON for Q&A, file lists, plan steps)
- timestamps
- durationMs
- retryCount
- errorMessage
```

### Implementation Plan Step (for plan editor)

```
- id
- workflowId (or planId)
- stepNumber
- title
- description
- files: string[]
- suggestedAgentId
- dependencies: number[] (step numbers)
```

### Plan Version (for version history)

```
- id
- workflowId
- versionNumber
- action: 'initial' | 'edit_step' | 'add_step' | 'remove_step' | 'reorder' | 'restore'
- stepId (if action affects a specific step)
- previousState: JSON (snapshot of plan before change)
- currentState: JSON (snapshot of plan after change)
- createdAt
```

---

## Resolved Decisions

### Plan Editing After Completion

**Decision:** Plans remain **always editable** after workflow completion.

- Users can continue refining the plan even after the planning workflow completes
- No lock is applied when starting implementation (implementation uses a snapshot)
- Editing a completed plan does not affect any in-progress implementation workflows

### Plan Versioning

**Decision:** Track **full version history** of plan edits.

- Every save creates a new version
- Users can view previous versions
- Users can restore a previous version (creates a new version with old content)
- Version history includes:
  - Timestamp
  - User action (edit step, add step, remove step, reorder, restore)
  - Diff from previous version

### Auto-Save Behavior

**Decision:** **Auto-save on every change.**

- Changes save automatically as user edits
- No "unsaved changes" prompts
- Undo functionality available to revert recent changes
- Each auto-save creates a version entry

### Implementation Workflow Timeline

**Decision:** Build **immediately after planning MVP.**

- Implementation workflows are the next priority after planning ships
- MVP should be architected to support this transition
- "Start Implementation" button can be present but disabled until implementation is ready
- Plan step structure already includes fields needed for implementation (agent, files, dependencies)

---

## Success Criteria

| Metric | Target |
|--------|--------|
| User can start a planning workflow | ✓ |
| User can watch live progress | ✓ |
| User can pause/resume at any point | ✓ |
| User can edit step outputs | ✓ |
| User can answer clarifying questions | ✓ |
| User can manage discovered files | ✓ |
| User can edit implementation plan | ✓ |
| User can start implementation from plan | ✓ |

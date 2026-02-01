# Workflow Feature - Implementation Phases

> Incremental implementation plan for the Planning Workflows feature. Each phase is a standalone deliverable that can be tested and validated before proceeding.

## Philosophy

- **Small, testable increments** - Each phase produces something you can click through and verify
- **Foundation before features** - Get the boring stuff working before the exciting stuff
- **One step at a time** - Build one pipeline step fully before the next
- **UI before execution** - Build the display layer before the CLI integration
- **Course correction built-in** - Each phase ends with a natural checkpoint

---

## Phase 1: Page Shell & Navigation

**Goal:** Routes exist and navigation works. Nothing functional yet.

**Deliverables:**
- [ ] `/workflows/[id]/page.tsx` - Empty page with "Workflow Detail" placeholder
- [ ] `/workflows/active/page.tsx` - Empty page with "Active Workflows" placeholder
- [ ] `/workflows/history/page.tsx` - Empty page with "Workflow History" placeholder
- [ ] Breadcrumb component showing: Project > Workflows > [Workflow Name]
- [ ] Sidebar links to Active and History pages
- [ ] Click workflow row in project tab → navigates to `/workflows/[id]`

**Validation:**
- Can navigate from project workflows tab to workflow detail page
- Can navigate to /workflows/active and /workflows/history from sidebar
- Breadcrumbs show and link back correctly

**Checkpoint:** Does the navigation feel right? Any routing changes needed?

---

## Phase 2: Workflow Detail - Header & Metadata

**Goal:** Workflow detail page shows real data (no pipeline yet).

**Deliverables:**
- [ ] Fetch workflow by ID using existing `useWorkflow(id)` hook
- [ ] Header section showing:
  - Feature name (large)
  - Status badge
  - Workflow type badge
  - Project name (linked)
  - Created/started timestamps
- [ ] Action bar with placeholder buttons (Pause, Cancel, etc. - not functional)
- [ ] Loading and error states

**Validation:**
- Navigate to a workflow, see its real data
- Status badge reflects actual workflow status
- Error shown if workflow doesn't exist

**Checkpoint:** Is the header layout right? What else should be visible at a glance?

---

## Phase 3: Horizontal Pipeline - Static Display

**Goal:** Pipeline UI renders based on workflow step data.

**Deliverables:**
- [ ] `PipelineView` component with horizontal layout
- [ ] `PipelineStep` component for individual steps
- [ ] Four hardcoded steps: Clarify, Refine, Discover, Plan
- [ ] Step states based on status: pending (dimmed), completed (collapsed), running (expanded)
- [ ] Collapsed step shows: icon, title, "No data yet" placeholder
- [ ] Expanded step shows: title, status, "Output will appear here" placeholder
- [ ] Connecting lines between steps

**Validation:**
- Pipeline renders with 4 steps in horizontal layout
- Steps show correct visual state based on mock/seeded data
- Clicking collapsed step expands it
- Responsive behavior (what happens on narrow screens?)

**Checkpoint:** Does the horizontal layout work? Should we adjust spacing, sizing, or visual hierarchy?

---

## Phase 4: Workflow Steps - Data Layer

**Goal:** Workflow steps are created and tracked in the database.

**Deliverables:**
- [ ] Verify `workflow_steps` schema has all needed fields
- [ ] Create steps when workflow transitions from `created` → `running`
  - Step 1: Clarification (or skipped if `skipClarification`)
  - Step 2: Refinement
  - Step 3: File Discovery
  - Step 4: Planning
- [ ] `useWorkflowSteps(workflowId)` query hook
- [ ] IPC handler: `workflowStep:list` - get steps for workflow
- [ ] IPC handler: `workflowStep:update` - update step status/output
- [ ] Pipeline reads from actual step data (not hardcoded)

**Validation:**
- Start a workflow → 4 steps created in DB
- Start with skipClarification → step 1 marked as 'skipped'
- Pipeline shows correct state for each step from real data

**Checkpoint:** Is the step data model complete? Any fields missing for what we need to display?

---

## Phase 5: Step Output Display

**Goal:** Completed steps show their actual output.

**Deliverables:**
- [ ] Collapsed step metrics:
  - Duration (e.g., "2m 34s")
  - Key metric based on step type (questions count, file count, etc.)
- [ ] Expanded step output area:
  - Markdown rendering for output text
  - Scroll for long outputs
  - "No output yet" for pending steps
- [ ] Seed some test data with step outputs to verify rendering

**Validation:**
- Completed step shows duration and metric in collapsed view
- Expanding a completed step shows markdown-rendered output
- Code blocks in output render with syntax highlighting

**Checkpoint:** Is the output display readable? Any formatting issues with real-world outputs?

---

## Phase 6: Clarification Step - Q&A UI

**Goal:** Clarification step renders questions as a form and captures answers.

**Deliverables:**
- [ ] Define `outputStructured` JSON schema for clarification:
  ```json
  {
    "questions": [
      { "id": "q1", "question": "...", "type": "text|select|textarea", "options": [...] }
    ],
    "answers": { "q1": "user answer" }
  }
  ```
- [ ] `ClarificationForm` component that renders questions as form fields
- [ ] Submit answers → saved to step's `outputStructured.answers`
- [ ] Step transitions to completed after answers submitted
- [ ] "Skip" button for clarification step
- [ ] Display Q&A summary in collapsed view (e.g., "8 questions answered")

**Validation:**
- Clarification step shows form with questions
- User can fill out and submit answers
- Answers persisted and visible when re-opening
- Skip button marks step as skipped

**Checkpoint:** Does the Q&A form feel right? Should questions have different input types?

---

## Phase 7: Refinement Step - Diff View

**Goal:** Refinement step shows before/after comparison.

**Deliverables:**
- [ ] `DiffView` component showing side-by-side or inline diff
- [ ] Input: original feature request
- [ ] Output: refined feature request
- [ ] Visual highlighting of changes (additions green, removals red)
- [ ] "Accept" button to proceed
- [ ] Collapsed view shows: "Refined" with preview snippet

**Validation:**
- Diff view clearly shows what changed
- Long texts scroll properly
- Accept proceeds to next step

**Checkpoint:** Is the diff view clear? Side-by-side vs. inline - which works better?

---

## Phase 8: File Discovery Step - File List UI

**Goal:** File discovery shows editable list of discovered files.

**Deliverables:**
- [ ] Define `outputStructured` JSON schema for discovery:
  ```json
  {
    "files": [
      { "path": "...", "reason": "...", "priority": "high|medium|low", "included": true }
    ]
  }
  ```
- [ ] `FileDiscoveryList` component showing files in a table/list
- [ ] Priority badge (high/medium/low) with color coding
- [ ] Include/exclude toggle per file
- [ ] "Add File" button → input for manual file path
- [ ] "Remove" action per file
- [ ] Edit reason/priority inline or via popover
- [ ] Collapsed view shows: "12 files (8 high, 3 medium, 1 low)"

**Validation:**
- Files display with all metadata
- Can add/remove files
- Can change priority and include/exclude
- Changes persist to database

**Checkpoint:** Is the file list easy to work with? Need sorting, filtering, or grouping?

---

## Phase 9: Planning Step - Basic Output

**Goal:** Planning step displays the generated plan (not yet interactive).

**Deliverables:**
- [ ] Plan output renders as structured cards (not just markdown)
- [ ] Each plan step shows: number, title, description preview
- [ ] Expand step to see full description
- [ ] Files listed per step
- [ ] Agent badge per step (if assigned)
- [ ] Collapsed pipeline view shows: "12 implementation steps"

**Validation:**
- Plan renders as a readable list of steps
- Steps are numbered and clearly delineated
- File references are visible

**Checkpoint:** Is the plan readable? Before making it interactive, is the display right?

---

## Phase 10: Pause & Resume

**Goal:** User can pause a running workflow and resume it.

**Deliverables:**
- [ ] "Pause" button in action bar (visible when status = running)
- [ ] Pause → workflow status changes to `paused`
- [ ] Pause → current step shows paused indicator
- [ ] "Resume" button (visible when status = paused)
- [ ] Resume → workflow status changes to `running`
- [ ] Pause state persists across page refresh / app restart

**Validation:**
- Click pause → workflow pauses, UI reflects paused state
- Close app, reopen → workflow still paused
- Click resume → workflow continues

**Checkpoint:** Is pause/resume working reliably? Any edge cases (pause during step transition)?

---

## Phase 11: Edit Step Output

**Goal:** User can edit any completed step's output.

**Deliverables:**
- [ ] "Edit" button on completed steps
- [ ] `StepOutputEditor` modal component:
  - Full-screen or large modal
  - Textarea with current output
  - Markdown preview pane (live)
  - Save / Discard buttons
- [ ] On save:
  - Update `outputText`
  - Set `originalOutputText` if first edit
  - Set `outputEditedAt` timestamp
  - Mark subsequent steps as `needs_regeneration` (new status? or flag?)
- [ ] Visual indicator on edited steps ("Edited" badge)
- [ ] Subsequent steps show "Needs regeneration" state

**Validation:**
- Can open editor, modify output, save
- Original preserved for audit
- Following steps show invalidated state
- Discard reverts changes

**Checkpoint:** Is the editing experience good? Modal size, preview behavior?

---

## Phase 12: Regenerate Step

**Goal:** User can regenerate a step to get new output.

**Deliverables:**
- [ ] "Regenerate" button on completed/edited steps
- [ ] Confirmation: "This will replace the current output. Continue?"
- [ ] Regenerate → step status back to `running`
- [ ] (For now: simulate regeneration with delay, keep same output)
- [ ] On completion → subsequent steps still invalidated (user must regenerate those too)

**Validation:**
- Click regenerate → step shows running state
- After completion → new output displayed
- Subsequent steps still marked for regeneration

**Checkpoint:** Is the regeneration flow intuitive? Should we auto-regenerate following steps?

---

## Phase 13: Interactive Plan Editor

**Goal:** User can add, edit, remove, and reorder plan steps.

**Deliverables:**
- [ ] Plan editor UI replacing read-only plan display
- [ ] Each step is a draggable card
- [ ] Drag handle for reordering
- [ ] "Edit" button per step → opens step form:
  - Title
  - Description (textarea)
  - Files (multi-select or text input)
  - Suggested agent (dropdown)
  - Dependencies (multi-select of other step numbers)
- [ ] "Remove" button per step with confirmation
- [ ] "Add Step" button → opens blank step form
- [ ] Auto-save on every change
- [ ] Undo for recent changes (cmd/ctrl+z or undo button)

**Validation:**
- Can drag steps to reorder
- Can add new step with all fields
- Can edit existing step
- Can remove step
- Changes auto-save
- Undo reverts last change

**Checkpoint:** Is drag-and-drop smooth? Is the step form complete? Dependencies UX?

---

## Phase 14: Plan Version History

**Goal:** Track and display version history of plan edits.

**Deliverables:**
- [ ] `plan_versions` table (or add to existing schema)
- [ ] Create version entry on each auto-save
- [ ] "Version History" button/panel in plan editor
- [ ] Version list showing: timestamp, action description, user
- [ ] Click version → view that snapshot (read-only)
- [ ] "Restore" button → creates new version with old content

**Validation:**
- Make several edits → see version history grow
- Click old version → see that state
- Restore → plan reverts, new version created

**Checkpoint:** Is version history useful? Too granular? Need to batch/debounce?

---

## Phase 15: Active Workflows Page

**Goal:** Dashboard showing all running workflows across projects.

**Deliverables:**
- [ ] `/workflows/active` page with real content
- [ ] Card or table layout showing active workflows
- [ ] Each row: name, project, status, current step, progress indicator, duration
- [ ] Auto-refresh every 5 seconds (already have polling in `useActiveWorkflows`)
- [ ] Click row → navigate to workflow detail
- [ ] Empty state when no active workflows

**Validation:**
- Start workflows in multiple projects → all appear on this page
- Progress updates in real-time
- Click navigates correctly

**Checkpoint:** Is this view useful? Cards vs. table? Any additional info needed?

---

## Phase 16: Workflow History Page

**Goal:** Searchable archive of completed workflows.

**Deliverables:**
- [ ] `/workflows/history` page with full content
- [ ] Data table with columns: name, project, type, status, duration, completed date
- [ ] Filters:
  - Status multi-select (completed, failed, cancelled)
  - Type multi-select (planning, implementation)
  - Project dropdown
  - Date range picker
  - Search input (full-text on name and request)
- [ ] Server-side pagination
- [ ] Click row → navigate to workflow detail

**Validation:**
- Filters work correctly and combine
- Search finds workflows by name or request content
- Pagination works smoothly
- Performance acceptable with many workflows

**Checkpoint:** Are filters sufficient? Any sorting needs?

---

## Phase 17: Start Implementation Flow

**Goal:** User can initiate implementation from a completed planning workflow.

**Deliverables:**
- [ ] "Start Implementation" button on completed planning workflows
- [ ] Confirmation dialog showing:
  - Plan summary (step count, files involved)
  - Repository/branch selection
  - Implementation settings (pause behavior, etc.)
- [ ] On confirm:
  - Create new workflow with type = 'implementation'
  - Set `parentWorkflowId` to planning workflow ID
  - Snapshot current plan state
  - Show toast: "Implementation workflow created"
  - Navigate to new workflow detail (or stay with message)
- [ ] Button disabled with tooltip: "Coming soon" until implementation phase

**Validation:**
- Button visible on completed planning workflows
- Dialog shows accurate plan summary
- New workflow created with correct linkage
- (Implementation execution is future phase)

**Checkpoint:** Is the handoff from planning to implementation clear? Settings needed?

---

## Future Phases (Post-MVP)

These are out of scope for the planning workflows MVP but documented for reference:

- **CLI Integration** - Actually spawn Claude Code CLI and parse output
- **Live Streaming** - Stream CLI output to step display in real-time
- **Implementation Execution** - Execute plan steps via specialist agents
- **Worktree Management** - Create/manage git worktrees for implementations
- **Workflow Cloning** - Duplicate workflows to try different approaches
- **Bulk Operations** - Pause all, cancel all from active page
- **Notifications** - Desktop notifications for workflow completion/failure
- **Export** - Export workflow audit log as markdown

---

## Implementation Order Summary

| Phase | Deliverable | Dependencies |
|-------|-------------|--------------|
| 1 | Page shells & navigation | None |
| 2 | Workflow detail header | Phase 1 |
| 3 | Horizontal pipeline (static) | Phase 2 |
| 4 | Workflow steps data layer | Phase 3 |
| 5 | Step output display | Phase 4 |
| 6 | Clarification Q&A UI | Phase 5 |
| 7 | Refinement diff view | Phase 5 |
| 8 | File discovery list | Phase 5 |
| 9 | Planning output (read-only) | Phase 5 |
| 10 | Pause & resume | Phase 4 |
| 11 | Edit step output | Phase 5 |
| 12 | Regenerate step | Phase 11 |
| 13 | Interactive plan editor | Phase 9 |
| 14 | Plan version history | Phase 13 |
| 15 | Active workflows page | Phase 1, 4 |
| 16 | History page | Phase 1 |
| 17 | Start implementation flow | Phase 9 |

**Parallelization opportunities:**
- Phases 6, 7, 8, 9 can be built in parallel after Phase 5
- Phases 15, 16 can be built in parallel, independent of step UIs
- Phase 10 can start after Phase 4, parallel to output display work

---

## Checkpoints & Course Correction

After each phase, ask:

1. **Does it work?** - Basic functionality validation
2. **Does it feel right?** - UX assessment, any friction?
3. **What's missing?** - Gaps discovered during implementation
4. **What should change?** - Requirements adjustments based on reality
5. **Still on track?** - Is the overall direction still correct?

Document decisions and changes in the phase's implementation log.

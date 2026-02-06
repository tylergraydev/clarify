# Workflow Page Redesign - Requirements

## Overview

Redesign the workflow detail page to provide a focused, step-by-step experience for the 4-phase AI planning workflow: Clarification, Refinement, File Discovery, and Implementation Planning. The new design uses a collapsible accordion layout, a unified bottom streaming panel, and gives users full control over each step with re-run, skip, and edit capabilities.

---

## Page Layout

### Structure

The workflow page is divided into three main zones:

1. **Sticky Top Bar** - Global workflow info and actions (always visible)
2. **Main Content Area** - Collapsible accordion of workflow steps
3. **Bottom Streaming Panel** - Resizable agent activity log (collapsible)

### Sticky Top Bar

- Displays: workflow name, overall status badge, elapsed time
- Global actions: **Pause**, **Cancel**, **Restart Workflow**
- Advance mode indicator (Continuous / Pause Between Steps / Gates Only)
- The bar is always visible at the top regardless of scroll position

### URL Strategy

- Uses query params for internal step state: `/workflows/[id]?step=clarification`
- Since this is an Electron app, the URL is not visible to users but maintains internal navigation state

---

## Pre-Start State

Before the workflow is started, the page shows a **full editable settings form** in place of the accordion:

- Workflow name and description
- Feature request text
- Agent selections (per-step defaults)
- Skip toggles for each step (Clarification, Refinement, File Discovery, Implementation Planning)
- Advance mode selector (Continuous / Pause Between Steps / Gates Only)
- Any other workflow configuration options
- Prominent **Start Workflow** button

This allows last-minute tweaks to all settings before kicking off the workflow.

---

## Accordion Step Layout

### Behavior

- Steps stack vertically in order: Clarification > Refinement > File Discovery > Implementation Planning
- The **active step** is always expanded
- When a step completes and the next step begins:
  - The completed step **auto-collapses**
  - The new active step **auto-expands**
- Users **can manually expand multiple steps** simultaneously (e.g., to compare clarification answers while reviewing file discovery)
- The auto-collapse/expand is the default behavior; user-initiated expansions are preserved

### Collapsed Step Summary Bar

Each collapsed step shows a summary bar with:

- **Step name** (e.g., "Clarification", "File Discovery")
- **Status badge**: Completed, Skipped, Running, Pending, Paused
- **Key metrics** specific to the step:
  - Clarification: "3 questions answered" or "No questions needed" or "Skipped"
  - Refinement: "Refined with 2 context files" or "Skipped"
  - File Discovery: "12 files discovered (4 high, 5 med, 3 low)"
  - Implementation Planning: "8 steps generated, 3 quality gates"
- Click to expand and view/interact with full step content

---

## Common Step Features

Every step shares these capabilities:

### Agent Selection

- Dropdown selector showing available agents for that step's type (e.g., only clarification agents for the clarification step)
- Defaults to the agent configured in the workflow settings
- Can be changed at any time before or during the step

### Re-run & Iterate

- **Re-run** button: Runs the step from scratch with a fresh agent invocation. Previous results are kept as version history.
- **"More" button** (step-specific label like "Ask More Questions", "Discover More Files", "Refine Plan"): Runs the agent again incrementally, keeping existing results and looking for additions/improvements.
- **Inline text field** next to both buttons: Optional prompt to give the agent additional direction (e.g., "You missed the auth middleware files" or "Focus on the database layer").

### Skip

- **Skip button** visible on each step before it runs
- Also configurable as a **pre-set toggle** in the workflow settings form (for continuous mode where the user won't be present to click Skip)
- Skipping a step marks it as "Skipped" and advances to the next non-skipped step

### Version History

- When a step is re-run, previous results are preserved as numbered versions (Run 1, Run 2, etc.)
- Only the latest version is "active" and feeds into subsequent steps
- Users can view past run versions but the current/latest is always the default view

---

## Step 1: Clarification

### Purpose

An AI agent analyzes the feature request and generates clarifying questions if the request is ambiguous.

### UI When Running

- Agent streams activity to the bottom panel
- Step area shows a loading/running state indicator

### UI When Complete (No Questions)

- Summary message: "The agent found no clarifying questions needed"
- The full agent summary/output is displayed
- Auto-advances to Refinement (in continuous mode) or waits for user to proceed

### UI When Complete (Questions Found)

- **Stacked form** with all questions displayed vertically in a single scrollable area
- Each question renders according to its type:
  - **Radio button questions**: Radio group with options. "Other" text input always visible below the options.
  - **Checkbox questions**: Checkbox group with options. "Other" text input always visible below the options.
  - **Text input questions**: Simple text area for free-form response.
- For radio/checkbox: user can select an option AND also fill in the "Other" field (both are sent to the agent)
- **Submit Answers** button sends all responses back to the agent
- After submission, the step can auto-advance or wait (based on advance mode)

### Actions

- Re-run Clarification (new agent run, fresh questions)
- Ask More Questions (send answers back, agent may generate follow-up questions)
- Skip Clarification
- Change agent via dropdown

---

## Step 2: Refinement

### Purpose

Takes the original feature request plus clarification Q&A and produces a polished, comprehensive feature request.

### Pre-run UI

- **Read-only formatted markdown** display showing the combined content:
  - Original feature request
  - Clarification questions and answers (if any)
- **"Edit" button** switches the display to an editable markdown text area for manual modifications
- **File picker** to attach additional context files (markdown files, package.json, config files, etc.)
  - Shows list of attached files with remove option
- **Start Refinement** button

### Post-run UI

- Displays the refined feature request as formatted markdown (read-only by default)
- "Edit" button to make manual adjustments to the refined output
- The refined text is what gets passed to File Discovery

### Actions

- Re-run Refinement
- Refine More (incremental improvement pass)
- Skip Refinement
- Change agent via dropdown

---

## Step 3: File Discovery

### Purpose

An AI agent explores the codebase and identifies all files relevant to implementing the feature request.

### Pre-run UI

- Shows the refined feature request (read-only) for reference
- Agent selector dropdown
- **Start Discovery** button

### Post-run UI: Data Table

A sortable, filterable, searchable data table with columns:

| Column | Description |
|--------|-------------|
| File Path | Relative path to the file |
| Action | Create / Modify / Delete / Reference (badge/tag style) |
| Priority | High / Medium / Low (color-coded badge) |
| Relevance | Brief explanation of why this file matters |

#### Table Features

- **Sort** by any column
- **Filter** by action type, priority level
- **Search** across file paths and relevance text
- **Inline editing**: Click to edit priority, action type, or relevance text for any row
- **Delete rows**: Remove files the user deems irrelevant
- **Row selection** for bulk actions (bulk delete, bulk priority change)

#### File Preview

- **"View" button** on each row opens a **slide-over panel** from the right
- Panel shows syntax-highlighted code (using Shiki)
- Language auto-detected from file extension
- Panel can be closed to return to the table
- Scrollable for long files

#### Manual File Addition

- **"Add File" button** above the table
- Opens a file picker to select a file from the project
- After selection, a small form appears for the user to enter:
  - Action type (Create / Modify / Delete / Reference)
  - Priority (High / Medium / Low)
  - Relevance description
- Added file appears in the table with all other discovered files

### Actions

- Re-run Discovery (fresh run, replaces results but old run kept in version history)
- Discover More Files (keep existing results, agent looks for what it missed)
- Skip File Discovery
- Change agent via dropdown

---

## Step 4: Implementation Planning

### Purpose

An AI agent takes the refined feature request and file discovery results to generate a detailed, step-by-step implementation plan.

### Pre-run UI

- Shows refined feature request and file discovery summary for reference
- Agent selector dropdown
- **Start Planning** button

### Post-run UI: List + Detail Panel

Split layout within the step's expanded area:

#### Left Panel: Step List

- Ordered list of implementation step titles
- Each item shows: step number, title, brief status
- **Drag handles** for reordering steps
- **Add Step** button at the bottom to insert user-defined steps
- **Delete** button/icon on each step to remove it
- Clicking a step selects it and loads its details in the right panel

#### Right Panel: Step Detail

Displays full details for the selected step:

- **Title** (editable)
- **Description / What**: What needs to happen in this step (editable text area)
- **Why / Reasoning**: Why this step is necessary, confidence level (editable)
- **Files Involved**: Which files from discovery are relevant to this step
- **Validation Commands**: Quality gates - commands that must pass (e.g., `pnpm typecheck`, `pnpm lint`, `pnpm db:generate`)
  - Add/remove validation commands
- **Success Criteria**: Checkboxes defining acceptance criteria for the step
  - One criteria is always: "All validation commands pass"
  - Add/remove custom criteria
  - Editable text for each criterion

### Actions

- Re-run Planning (fresh plan, old kept in version history)
- Refine Plan (agent reviews existing plan for gaps/improvements)
- Skip Implementation Planning
- Change agent via dropdown

---

## Bottom Streaming Panel

### Layout

- Resizable panel docked to the bottom of the page (like a terminal/IDE console)
- Drag handle on top edge to resize
- Can be fully collapsed when not needed
- Default height: ~30% of viewport when open

### Content: Tabbed by Step

- Each step that has been run gets its own tab: "Clarification", "Refinement", "File Discovery", "Planning"
- Active step's tab is auto-selected when a step starts running
- User can switch tabs to view previous steps' streaming logs
- Tabs only appear once a step has been started (not for pending/skipped steps)

### Activity Log Detail (per tab)

Full verbose activity log showing:

- **Streaming text output** from the agent (real-time)
- **Tool calls**: Tool name, arguments (collapsible), status (running/completed/failed)
- **Tool results**: Collapsible sections showing what each tool returned
- **Running history**: Scrollable log of all activity in chronological order
- **Auto-scroll**: Sticks to bottom for live output, detaches when user scrolls up
- When returning from navigating away: **catch-up scroll** loads full history and scrolls to live position

---

## Background Execution & Notifications

### Navigation Behavior

- Users can **freely navigate away** from a running workflow
- The agent continues running in the background
- No blocking dialogs or navigation guards

### Toast Notifications

- **Workflow completed**: Toast with workflow name + "completed all steps" + clickable link to go to the workflow
- **Workflow paused** (needs user input, e.g., clarification questions): Toast with workflow name + reason + clickable link
- **Workflow failed/errored**: Toast with workflow name + error summary + clickable link
- Toasts appear regardless of which page the user is currently viewing

---

## Completion State

### Export Actions

When all steps are complete (or all non-skipped steps), an **export/action bar** appears:

- **Export Plan as Markdown**: Downloads the implementation plan as a `.md` file
- **Copy to Clipboard**: Copies the plan text to clipboard
- **Start Implementation**: Initiates the implementation phase (future feature, can be placeholder for now)

### Post-completion

- All steps remain browsable in the accordion
- The streaming panel tabs remain accessible for reviewing agent activity
- The workflow can be re-opened at any time from the workflows list

---

## Summary of Design Decisions

| Decision | Choice |
|----------|--------|
| Step layout | Collapsible accordion (vertical) |
| Accordion mode | Multi-expand allowed, auto-collapse on step transition |
| Streaming panel location | Bottom panel (resizable, collapsible) |
| Streaming panel organization | Tabbed by step |
| Streaming detail level | Full activity log (verbose) |
| File discovery display | Data table (sortable, filterable) |
| File preview | Slide-over panel from right |
| Plan step editor | Editable list (left) + detail panel (right) |
| Pre-start view | Full editable settings form |
| Collapsed step info | Status badge + key metrics |
| Re-run prompt | Inline text field |
| Clarification questions | Stacked form |
| Refinement text | Read-only markdown + edit toggle |
| Re-run results | Version history preserved |
| URL strategy | Query params |
| Navigation during run | Silent background, toast notifications |
| Final output | Export-focused action bar |
| Global actions | Sticky top bar |

---
allowed-tools: Read(*), Glob(*), Grep(*), Task(subagent_type:Explore), AskUserQuestion(*)
argument-hint: "[--list|--interactive]"
description: Identify the next logical feature area to work on based on design document and codebase analysis
---

# Next Feature Recommendation

## Purpose

Analyze the design document and current codebase implementation to recommend the next logical, bite-sized feature area to work on. Prioritizes based on dependencies and logical progression of functionality.

@CLAUDE.md

## Command Usage

```
/next-feature [options]
```

**Options:**

- (default): Single recommendation with detailed reasoning
- `--list`: Show ranked top 3-5 feature areas with brief justifications
- `--interactive`: Present top options and let user choose, then provide detailed context

**Examples:**

- `/next-feature` - Get single best recommendation
- `/next-feature --list` - See ranked list of next features
- `/next-feature --interactive` - Choose from options with follow-up context

---

## Execution Flow

### Phase 1: Parse Design Document

1. Read the design document at `docs/clarify-design-document.md`
2. Extract all feature areas and their descriptions, organized by:
   - Core features (MVP requirements)
   - Phase 1 features (post-MVP)
   - Phase 2+ features (future roadmap)
3. Identify dependencies between features (what must exist before something else can work)
4. Note the logical progression implied in the document

### Phase 2: Analyze Current Implementation

Use the Explore agent to thoroughly scan the codebase:

1. **Project Infrastructure:**
   - Check `app/` for existing pages and routes
   - Check `components/` for implemented UI components
   - Check `db/schema/` for database tables
   - Check `db/repositories/` for data access layers
   - Check `electron/ipc/` for IPC handlers
   - Check `lib/stores/` for state management
   - Check `hooks/` for custom hooks

2. **Feature-Specific Checks:**
   - Projects: CRUD operations, list view, detail view
   - Repositories: Add/remove, scanning, file indexing
   - Feature Requests: Entry, workflow steps, lifecycle states
   - AI Integration: API key management, model selection, streaming
   - Orchestration: 3-step workflow (Refine → Research → Plan)
   - Settings: Global and project-specific configuration
   - Export: Markdown, PDF, JSON export capabilities

3. **Create Implementation Status Map:**
   For each major feature area, determine:
   - **Fully Implemented**: All functionality working
   - **Partially Implemented**: Some functionality exists
   - **Not Started**: No implementation exists
   - **Infrastructure Only**: Schema/routes exist but no UI/logic

### Phase 3: Gap Analysis

1. Compare design document requirements against implementation status
2. Identify features that are:
   - Completely missing
   - Partially implemented (good candidates for completion)
   - Blocked by missing dependencies
   - Ready to implement (all dependencies satisfied)

### Phase 4: Prioritization

Score each gap/incomplete feature based on:

1. **Dependency Satisfaction** (highest weight):
   - Does this feature have all prerequisites implemented?
   - Will implementing this unblock other features?

2. **Logical Progression**:
   - Does this fit naturally with what's already built?
   - Is this the next step in the user journey?

3. **Bite-Size Scope**:
   - Can this be implemented in a focused session?
   - Is the scope well-defined and bounded?

4. **MVP Priority**:
   - Is this core functionality or nice-to-have?

### Phase 5: Output

**Default Mode (single recommendation):**

```markdown
## Next Feature Recommendation

### Feature: [Feature Name]

**Area**: [Section of design doc]
**Priority**: [Why this is next]

### Current State

- What exists: [Brief description of related implementation]
- What's missing: [Specific gaps]

### Why This Feature Now

1. [Dependency reasoning]
2. [Logical progression reasoning]
3. [Scope reasoning]

### Suggested Scope

- [Specific, actionable items to implement]
- [Bounded to bite-sized work]

### Unblocks

- [What this enables next]
```

**List Mode (`--list`):**

```markdown
## Top 5 Feature Recommendations

### 1. [Feature Name] ⭐ (Recommended)

**Why**: [1-2 sentence justification]
**Scope**: [Brief scope description]
**Unblocks**: [What it enables]

### 2. [Feature Name]

**Why**: [1-2 sentence justification]
**Scope**: [Brief scope description]

### 3. [Feature Name]

...

### 4. [Feature Name]

...

### 5. [Feature Name]

...
```

**Interactive Mode (`--interactive`):**

1. Present top 3-4 options using AskUserQuestion
2. After user selects, provide detailed recommendation (same format as default mode)

---

## Feature Area Checklist

Use this checklist to assess implementation status. Each area maps to sections in the design document.

### Core Infrastructure

- [ ] Electron main process setup
- [ ] IPC channel architecture
- [ ] Database initialization and migrations
- [ ] Preload/context bridge

### Projects (Section 3.4)

- [ ] Project list view
- [ ] Create new project modal
- [ ] Project detail view with tabs
- [ ] Edit project
- [ ] Delete project with confirmation

### Repositories (Section 3.4)

- [ ] Add repository via file picker
- [ ] Repository list in project view
- [ ] Remove repository
- [ ] Rescan repository
- [ ] Repository stats display
- [ ] File indexing and structure

### Feature Requests - Entry (Section 3.2, Phase 1)

- [ ] Feature request list view
- [ ] New feature request entry
- [ ] Draft save/auto-save
- [ ] Load previous as template

### Feature Requests - Workflow (Section 3.2, Phases 2-4)

- [ ] Step 1: Feature Refinement UI
- [ ] Step 2: File Discovery UI
- [ ] Step 3: Plan Generation UI
- [ ] Step indicator/breadcrumb
- [ ] Back/forward navigation

### AI Integration (Section 4)

- [ ] API key configuration
- [ ] Model selection per step
- [ ] Prompt customization
- [ ] Streaming response display
- [ ] Token usage tracking
- [ ] Error handling/retry

### Orchestration (Section 4.1)

- [ ] Step 1 execution (refine)
- [ ] Step 2 execution (research)
- [ ] Step 3 execution (plan)
- [ ] Orchestration logging
- [ ] Non-linear workflow (go back)

### Settings (Section 6)

- [ ] Global settings page
- [ ] API key input
- [ ] Default model selection
- [ ] Theme toggle
- [ ] Project-specific settings

### Export (Section 5.3)

- [ ] Markdown export
- [ ] Copy to clipboard
- [ ] PDF export
- [ ] JSON export
- [ ] Export with logs

---

## Implementation Notes

1. **Always read the design document first** - It's the source of truth for planned features
2. **Use Explore agent for codebase analysis** - Don't manually grep/glob extensively
3. **Be specific about gaps** - Don't just say "feature is incomplete", specify what's missing
4. **Consider vertical slices** - Sometimes the next feature is completing a vertical slice rather than adding a new horizontal layer
5. **Keep recommendations actionable** - The output should be immediately useful for planning work

---

## Example Analysis

```
DESIGN: Projects should have a detail view with tabs for Features, Repositories, Settings

CODEBASE CHECK:
- app/(app)/projects/[projectId]/page.tsx exists → detail view started
- features/ directory exists → tab structure exists
- repositories/ directory exists → tab structure exists
- settings/ directory exists → tab structure exists
- Tab content implementation → needs verification

STATUS: Partially Implemented (tab structure exists, verify content)

NEXT STEPS: Check each tab's content implementation depth
```

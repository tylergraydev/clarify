# Plan Feature Desktop App - Design Document

## Executive Summary

This document outlines the design for a desktop application that brings Claude Code's feature planning orchestration workflow into an interactive, local-first environment. The app enables developers to programmatically generate detailed implementation plans for features/fixes using Claude AI, with full control over models, prompts, and each step of the planning process.

**Tech Stack**: Electron + Next.js + Vercel AI SDK

**Core Value Proposition**: Transform ad-hoc feature planning into a structured, reproducible process with deep visibility and control over AI-driven planning stages.

---

## 1. Product Overview

### 1.1 Core Purpose

The app solves a specific developer pain point: translating informal feature requests into actionable implementation plans that account for actual codebase context. It does this by:

1. **Automating complexity**: Multi-step workflow with subagent orchestration happens automatically
2. **Maintaining control**: Users can intervene at any step, modify prompts, switch models, or override outputs
3. **Preserving context**: Plans are tied to specific code repositories and captured for reproducibility
4. **Enabling iteration**: Users never lose their work; they can revisit, refine, and regenerate at any point

### 1.2 Key Differentiators

- **Local-first architecture**: Repo analysis happens locally; plans are stored locally
- **Model flexibility**: Users can use any Claude model (or supported alternatives) and swap mid-workflow
- **Prompt customization**: Every step (refine, research, plan) has overridable prompts
- **Non-linear workflow**: Users can backtrack, modify, and restart without losing progress
- **Export/sharing**: Multiple export formats for plans and orchestration logs
- **Multi-repo support**: Single project can analyze multiple repositories

### 1.3 Target User

- Senior/mid-level software engineers (professional developers)
- Teams using Claude or other AI for code-related tasks
- Developers who want reproducible feature planning workflows
- Engineers managing complex projects with multiple feature requests

---

## 2. Architecture & Technology Stack

### 2.1 Technology Decisions

**Frontend**: Next.js + React

- Server-side rendering for performance
- File system access via Electron IPC
- Component-based architecture for complex workflows

**Desktop**: Electron

- Direct file system access (repo scanning, plan export)
- Native OS integrations (file dialogs, notifications)
- Local data persistence

**AI Integration**: Vercel AI SDK

- Unified interface across AI models
- Streaming support for real-time feedback
- Token usage tracking for cost awareness

**Data Layer**: Local storage + File system

- SQLite storage for metadata (projects, feature requests, orchestration logs)
- Plans and logs stored as Markdown files (human-readable, version-control friendly)
- No cloud sync by default (users can implement via Git/Sync tools if desired)

**State Management**: Zustand

- Manage multi-step workflow state
- Handle model/prompt configuration
- Track active project and feature request

### 2.3 Electron-Specific Considerations

**Main Process Responsibilities**:

- File system operations (read repo files, write plans, manage project directories)
- Repo analysis (file discovery, codebase scanning)
- IPC bridging to AI operations
- Dialog management (file pickers, confirmations)

**Preload Security**:

- Limited IPC channels for specific operations
- No direct `require()` in renderer
- Validate all file paths to prevent directory traversal

**Renderer Process Responsibilities**:

- UI rendering and state management
- Workflow orchestration logic
- Model/prompt configuration
- Plan visualization and editing

---

## 3. User Interface & Workflows

### 3.1 Main Navigation Structure

**Sidebar Navigation**:

- Projects (list view)
- Settings
- Help/Documentation

**Primary Sections**:

1. **Projects Dashboard**
   - List of all projects
   - Quick stats per project (# of feature requests, latest plan generated)
   - Create new project button
   - Project card with actions (open, edit, delete)

2. **Project View**
   - Project header with name, description, repository list
   - Tabs:
     - **Feature Requests**: List of all requests for this project (active, archived)
     - **Repositories**: Manage associated repos (add/remove/rescan)
     - **Settings**: Project-specific config (API keys, model defaults, prompt templates)

3. **Feature Request Workflow** (see section 3.2 for detailed flow)
   - Multi-step interface with clear step indicators
   - Back/forward navigation
   - Save and return capability
   - Model/prompt customization per step

4. **Settings Panel**
   - Global API key management (for AI API)
   - Default model selection
   - Custom prompt template library
   - App preferences (theme, auto-save, export defaults)
   - Data directory location

### 3.2 Feature Request Workflow (Detailed UX)

**Phase 1: Request Entry**

User initiates workflow by selecting "New Feature Request" from a project.

**Screen: Feature Request Entry**

- Text input field for feature description
- Optional rich text editor or markdown support
- Character counter and preview pane
- "Continue" button to proceed to Step 1
- "Save Draft" option (auto-saves to avoid data loss)
- Ability to load previous request as template

---

**Phase 2: Step 1 - Feature Refinement**

**Screen: Feature Refinement**

_Layout_:

- Left panel: Original request (read-only)
- Center panel: Model/prompt customization
  - Model selector dropdown (with info on token costs, response time)
  - Prompt template selector (default provided, custom options available)
  - Inline prompt editor with real-time preview
  - "Show expert mode" toggle for advanced users
  - Advanced options (temperature, max tokens, custom instructions)
- Right panel: Live preview of refined request (updates as you type the prompt)
- Bottom: Action buttons

_Behavior_:

- Auto-saves prompt customizations to orchestration history
- "Generate Refinement" button triggers Step 1 execution
- Real-time streaming of response in preview pane
- "Accept" and "Regenerate" buttons after completion
- "Edit and Regenerate" allows modifying the input before re-running
- Visual indicator of token usage and cost for this step
- Can go back to edit original request

_Advanced Features_:

- "Compare" mode: side-by-side view of previous refinements
- "Rollback" option: restore previously accepted refinement
- Refinement history tab with all previous attempts for this request

---

**Phase 3: Step 2 - File Discovery / Research**

**Screen: File Discovery**

_Layout_:

- Top: Indicates "analyzing repositories..." with progress bar
- Left panel: Research customization
  - Model selector (can differ from Step 1)
  - Prompt template selector
  - Inline prompt editor
  - Repository selector (if project has multiple repos)
  - File discovery depth/scope selector (shallow/medium/deep scan)
- Center panel: Discovered files list
  - Categorized by priority (Critical, High, Medium, Low)
  - Each file shows:
    - File path (with syntax highlighting)
    - Relevance score (0-100%)
    - Brief summary of why it's relevant
    - File size and modification date
    - Preview toggle (shows first 50 lines)
  - Filter/search by filename, path, or category
  - Checkbox selection for manual file inclusion/exclusion
- Right panel: AI reasoning panel
  - Why files were discovered
  - Analysis metrics (files analyzed, coverage %, discovery confidence)
  - Codebase structure summary

_Behavior_:

- Auto-saves repository configuration and file discovery results
- "Analyze Files" button triggers Step 2 execution
- Files appear dynamically as AI analyzes (streaming)
- User can:
  - Deselect files they know aren't relevant (refinement for Step 3)
  - Add files manually if discovery missed them (file picker dialog)
  - Adjust discovery depth and re-run
- Visual diff between previous file discoveries if regenerating

_Advanced Features_:

- File preview with syntax highlighting
- Codebase structure visualization (tree view)
- Search/filter across discovered files
- "Export file list" for external review

---

**Phase 4: Step 3 - Implementation Planning**

**Screen: Plan Generation**

_Layout_:

- Left panel: Plan customization
  - Model selector
  - Prompt template selector
  - Inline prompt editor
  - Optional: output format selector (Markdown, JSON, PDF export)
  - Plan detail level selector (summary / standard / detailed)
- Center panel: Live plan preview
  - Markdown rendered in real-time as it streams in
  - Syntax highlighting for code blocks (none expected, but just in case)
  - Table of contents auto-generated
  - Scrollable with smooth updates
- Right panel: Plan metadata and actions
  - Plan generation timestamp
  - Model used and token statistics
  - Estimated implementation time (if AI provides it)
  - Plan export options (see below)

_Behavior_:

- "Generate Plan" button triggers Step 3
- Real-time streaming of plan into preview (satisfying UX)
- After completion, four key buttons appear:
  - **Edit Plan** (inline markdown editor for manual tweaks)
  - **Regenerate** (run again with current settings)
  - **Adjust Scope** (go back to Step 2, adjust files, come back)
  - **Export** (multiple formats, see below)
  - **Save Plan** (confirm and save to project)

_Plan Editing_:

- Toggle between preview and edit modes
- Markdown syntax highlighting
- Undo/redo support
- Diff view showing changes from generated version

---

**Phase 5: Post-Plan Actions**

**Screen: Plan Review & Export**

After generating (or editing) a plan:

_Adjustments & Regeneration_:

- "Adjust" buttons allow jumping back to previous steps
  - Adjust refinement → modify refined request → regenerate all downstream steps
  - Adjust file discovery → add/remove files → regenerate plan only
  - Adjust plan → regenerate plan only
- Changes are tracked and versioned
- Option to auto-regenerate downstream steps or skip

_Export Options_:

- **Markdown export** (for team docs, version control)
- **PDF export** (for sharing, printing, archival)
- **JSON export** (structured data with metadata)
- **Copy to clipboard** (quick sharing)
- **Export orchestration logs** (full audit trail of steps and decisions)
- Custom export templates (user-definable format)

_Plan Archival_:

- Save to project
- Archive old plans
- Mark as "implemented" with completion notes
- Link to pull requests or commits (future enhancement)

---

### 3.3 Feature Request Lifecycle States

```
Draft (in-progress)
├─ Can save and leave at any time
├─ Auto-saves every 30 seconds or on major changes
└─ "Resume" button on project dashboard

Step 1: Refine (in-progress or completed)
├─ Can accept, regenerate, or return to draft
└─ Can move to Step 2 only if Step 1 is completed

Step 2: Research (in-progress or completed)
├─ Can regenerate, adjust file list, or return to Step 1
└─ Can move to Step 3 only if Step 2 is completed

Step 3: Plan (in-progress, completed, or edited)
├─ Can regenerate, edit, or return to Step 2
├─ Can export in multiple formats
└─ Can save as final or archive

Completed
├─ Plan finalized and saved
├─ Can regenerate or create variants
└─ Can mark as "implemented" with notes

Archived
└─ Hidden from main list, but recoverable
```

---

### 3.4 Project & Repository Management

**Create New Project**:

1. Modal dialog with:
   - Project name (required)
   - Description (optional)
   - Initial repository path(s) (file picker, support multiple)
   - Confirm to create

2. App scans selected repository and:
   - Indexes file structure
   - Estimates project size
   - Shows summary (X files, Y directories, main languages detected)

3. User redirected to project view

**Manage Repositories**:

- Add repository: File picker, auto-detects if it's a Git repo
- Remove repository: Confirm (does not delete local files)
- Rescan repository: Re-index files (useful if repo has changed)
- View repository stats: File count, languages, last scanned

---

## 4. AI Integration & Orchestration

### 4.1 Multi-Step Orchestration

The app strictly follows the 3-step process from your Claude Code workflow:

**Step 1: Feature Refinement**

- Input: User's feature request + project context
- Process: Enhance request with technical details from repo context
- Output: Refined, contextual feature description (single paragraph, 200-500 words)
- Model: Configurable (default: Claude 4.5 Sonnet)

**Step 2: File Discovery / Research**

- Input: Refined feature request + all repo files
- Process: Intelligent file analysis to find relevant files for implementation
- Output: Categorized list of relevant files with reasoning
- Model: Configurable (default: Claude 4.5 Sonnet)

**Step 3: Implementation Planning**

- Input: Refined request + discovered files (with content)
- Process: Generate step-by-step implementation plan
- Output: Markdown implementation plan (no code examples, just instructions)
- Model: Configurable (default: Claude 4.5 Sonnet)

### 4.2 Prompt Management

**Default Prompts**:

- App ships with battle-tested default prompts for each step
- Prompts are based on your existing Claude Code workflow

**Prompt Customization**:

- Users can create custom prompt templates per step
- Template variables available: `{{refinedRequest}}`, `{{projectContext}}`, `{{discoveredFiles}}`, etc.
- Prompt editor with syntax highlighting and variable hints
- Save custom templates for reuse across projects

**Prompt Versioning**:

- Track which prompt template was used for each step
- Compare outputs from different prompts (A/B testing)
- Rollback to previous prompt if needed

### 4.3 Model Management

**Supported Models**:

- Claude 3.5 Sonnet (recommended default)
- Claude 3.5 Haiku (for quick iterations, lower cost)
- Claude 3 Opus (for complex analysis, higher token limit)
- Claude 3 Sonnet (legacy, for compatibility)
- Future: Support for other providers (OpenAI, etc.) via Vercel AI SDK

**Model Selection**:

- Per-step model selection (Step 1 might use Haiku, Step 3 uses Sonnet)
- Model info card showing: costs, token limits, response time estimates
- Preset configurations (e.g., "budget mode" uses Haiku, "quality mode" uses Sonnet)

**Token Usage Tracking**:

- Real-time token count during generation
- Historical cost analysis per project
- Estimated costs before generation
- Cost breakdown by step and model

### 4.4 Error Handling & Fallbacks

**Failure Scenarios**:

- API rate limits → Queue request with exponential backoff
- Token limits exceeded → Suggest switching to longer-context model
- Malformed response → Retry with clearer prompt
- Network timeout → Retry logic with user notification

**Logging**:

- Every API call logged with timestamp, model, tokens, duration
- Error logs saved for debugging
- User can view detailed logs for any step
- Export logs for support/debugging

---

## 5. Feature Deep Dives

### 5.1 Non-Linear Workflow (Back & Forth)

Users should never feel locked into their choices. At any step:

1. **Go Back**: Return to previous step, modify input, re-run all downstream steps or just affected steps
2. **Skip Ahead**: If user is confident, they can skip re-running upstream steps
3. **Regenerate**: Re-run current step with same or modified settings
4. **Adjust Scope**: From Step 3, directly adjust file selection in Step 2, then regenerate plan

_UX Implementation_:

- "Back" button always available (with confirmation if there are unsaved changes)
- Breadcrumb trail at top showing: Request > Refine > Research > Plan
- Toast notifications indicating "regenerating downstream steps..."
- Visual indicators on steps showing "modified" or "current"

### 5.2 Orchestration Logging & Audit Trail

Every feature request maintains a complete history:

**Orchestration Log** includes:

- Original request
- Each step's input/output
- Model and prompt used for each step
- Token usage for each step
- Timestamps and duration for each step
- User actions (regenerate, edit, adjust)
- Final plan and any manual edits

**View Options**:

- **Timeline view**: Visual timeline of all steps and modifications
- **Raw logs**: JSON export of complete orchestration data
- **Comparison view**: Side-by-side comparison of different plan versions

**Use Cases**:

- Debugging why plan looks a certain way
- Audit trail for team reviews
- Reproducibility (can re-run with same settings)
- Cost analysis per project/request

### 5.3 Plan Export & Sharing

Multiple export formats for different use cases:

**Markdown Export**:

- Plain markdown file
- Suitable for committing to repo or sharing
- Includes metadata header (request, date, model used)

**PDF Export**:

- Professional formatting
- Includes table of contents
- Embeds request and refinement for context
- Suitable for client sharing or archival

**JSON Export**:

- Structured data format
- Includes all metadata (model, tokens, timestamps)
- Suitable for integration with other tools
- Can be parsed by scripts

**Markdown with Orchestration Logs**:

- Plan + all step logs in single document
- Shows complete decision trail
- Useful for internal reviews

**Email Export** (future enhancement):

- Generate shareable link (if deployed with backend)
- Email plan to team members

### 5.4 Multi-Repo Projects

Some projects span multiple repositories. The app supports:

**Repository Selection per Feature Request**:

- When creating a feature request, optionally scope to specific repo(s)
- If not specified, analysis includes all project repos
- File discovery can prioritize specific repos

**Repo-Aware Analysis**:

- Step 2 (Research) can indicate which repo each file belongs to
- Plan can be organized by repo if multiple are involved
- Filters to view files by repo

**Use Case Examples**:

- Monorepo with frontend/backend/shared
- Microservices where one feature touches multiple repos
- Plugin architecture with separate plugin repos

---

## 6. Settings & Configuration

### 6.1 Global Settings

**API Configuration**:

- API key input (masked for security)
- Option to load from environment variable `ANTHROPIC_API_KEY`
- Connection test button
- Warning if API key not set

**Default Model**:

- Dropdown selector
- "Best for speed" vs "best for quality" preset suggestions

**UI Preferences**:

- Theme (light/dark)
- Auto-save interval
- Default export format
- Font size for plan preview

### 6.2 Project-Specific Settings

**Project Defaults**:

- Override global default model per project
- Project-specific API key (optional, for multi-account users)
- Custom prompt templates for this project
- Preferred file discovery depth (shallow/medium/deep)

**Repository Configuration**:

- Rescan frequency (manual or automatic)
- Exclude patterns (directories or files to ignore during analysis)
- File size limits (skip very large files)

### 6.3 Prompt Template Management

**Built-In Templates**:

- Feature Refinement (standard)
- File Discovery (standard)
- Implementation Planning (standard)

**Custom Templates**:

- Create new templates with template variable support
- Organize into categories
- Mark as "public" (available to all projects) or "private" (project-specific)
- Clone and modify existing templates

**Template Editor**:

- Syntax-highlighted markdown editor
- Variable hints dropdown
- Test prompt with sample data
- Version history

---

## 7. Advanced Features (Future Roadmap)

### 7.1 Phase 2 Enhancements

- **Plan Comparison**: Side-by-side diff of multiple plan versions
- **Collaborative Review**: Comments/suggestions on plans (local only, or cloud-optional)
- **Git Integration**: Link plans to commits/PRs, mark plans as implemented
- **Metrics Dashboard**: Track planning efficiency, most common patterns
- **Custom Agents**: Define custom substeps or additional analysis phases
- **Batch Processing**: Queue multiple feature requests for analysis

### 7.2 Phase 3 Enhancements

- **Cloud Sync** (optional): Sync projects to cloud, access from multiple machines
- **Team Workspace**: Share projects and plans with team members
- **Integration API**: Allow external tools to trigger plan generation
- **Analytics**: Project analytics, planning time trends, model performance
- **Web UI**: Companion web app for viewing plans, not editing
- **Slack Integration**: Trigger plan generation from Slack, share results

---

## 8. Data Privacy & Security

### 8.1 Local-First by Default

- All code repository analysis happens locally (no files sent to cloud)
- Plans and logs stored on user's machine by default
- API calls to Claude only send the refined request and file metadata (not raw files)

### 8.2 API Key Security

- API keys stored in encrypted local storage (Electron secure store)
- Keys never logged or exposed in UI
- Option to use environment variables (bypasses storage)
- Warning if API key appears to be compromised

### 8.3 Repository Content Handling

- By default, only file paths and names sent to AI for analysis (not content)
- User can opt-in to send file content for deeper analysis (Step 2 advanced mode)
- When content is sent, it's streamed directly to Claude API (not logged locally)
- Large files (>10MB) excluded by default

### 8.4 User Data

- Projects and plans stored in user-specified directory (default: ~/.plan-feature-app/)
- User has full control over data location
- No automatic cloud sync
- App deletion removes all local data (user can backup manually)

---

## 9. User Experience Principles

### 9.1 Design Philosophy

1. **Transparency**: Users always see what's being sent to AI (prompts, files, etc.)
2. **Control**: Every default is overridable; no "magic" decisions
3. **Non-destructive**: Changes are never permanent; users can always go back and modify
4. **Informative**: Real-time feedback on progress, token usage, costs
5. **Efficient**: Minimize clicks to get value; quick workflows for simple requests
6. **Discoverable**: Help text and tooltips guide users to advanced features

### 9.2 Interaction Patterns

**Progressive Disclosure**:

- Simple path: Just generate a plan with defaults
- Advanced path: Customize every aspect (model, prompt, file discovery depth)
- Expert mode: Deep configuration options, API inspection, logging

**Real-Time Feedback**:

- Streaming plan generation (user sees content appear live)
- Token count updates in real-time
- Progress indicators for file scanning

**Safe Defaults**:

- Recommend best practices (e.g., Sonnet for accuracy, Haiku for speed)
- Pre-filled templates based on common use cases
- Auto-save everything to prevent data loss

---

## 10. Technical Considerations

### 10.1 Repository Scanning Performance

**Challenge**: Scanning large repos (50k+ files) without freezing UI

**Solutions**:

- Worker threads for file system operations
- Chunked processing (scan 1000 files at a time)
- Debounced UI updates
- Skip common non-code directories (.node_modules, .git, dist, build)
- User can configure exclude patterns

### 10.2 Large File Handling

**Challenge**: Repos with large binary files, node_modules, etc.

**Solutions**:

- Default file size limit (skip files >1MB)
- Exclude patterns configured during repo setup
- User can manually adjust limits
- Warning if repo contains very large files

### 10.3 Streaming & Real-Time Updates

**Implementation**:

- Use Vercel AI SDK's streaming support
- Stream plan directly to renderer for real-time preview
- Update preview as chunks arrive
- Display token count as it updates

### 10.4 Electron-Specific Challenges

**File Access**:

- Main process handles all file I/O
- IPC for safe communication between renderer and main
- Validate all file paths (prevent directory traversal)

**Updater**:

- Electron-updater for app updates
- Auto-update checking (optional, user can disable)
- Safe update rollback

**Platform Differences**:

- Handle path separators (Windows vs Unix)
- File dialog APIs vary by OS
- Native notifications via native-notify or similar

---

## 11. Success Metrics

### 11.1 User Engagement

- Feature requests generated per project per month
- Average plan complexity (number of steps, files analyzed)
- User satisfaction with plan quality (subjective feedback)
- Plan adoption rate (% of plans that lead to implementation)

### 11.2 Performance

- Repo scan time for various sizes
- Plan generation latency (steps to completion)
- Token usage efficiency per feature type
- Cost per plan generated

### 11.3 Technical

- Error rate per step
- API retry success rate
- App crash rate and memory usage
- File system operation reliability

---

## 12. Implementation Priorities

### 12.1 MVP (Minimum Viable Product)

**Core Features**:

1. Single project with single repo
2. Linear workflow (no going back)
3. Basic 3-step orchestration
4. Export to Markdown only
5. Default prompts and Claude 3.5 Sonnet only
6. Simple UI (functional, not polished)

**Omit for MVP**:

- Multi-repo projects
- Prompt customization
- Advanced exports (PDF, JSON)
- Collaboration features
- Analytics

### 12.2 Phase 1 (Post-MVP)

**Features to Add**:

1. Non-linear workflow (go back, adjust, regenerate)
2. Prompt customization per step
3. Model selection per step
4. Multiple export formats (PDF, JSON)
5. Orchestration logging and audit trail
6. UI polish and theming

### 12.3 Phase 2 (Scale)

**Features to Add**:

1. Multi-repo projects
2. Team collaboration (comments, sharing)
3. Git integration
4. Advanced analytics
5. Cloud sync (optional)

---

## 13. Open Questions & Decisions

### 13.1 Scope Clarifications Needed

1. **Offline Capability**: Should the app work without internet, or is Claude API access required? (Assume required for now)

2. **File Content in Analysis**: For file discovery, should we send full file content to Claude or just file paths and names? (Propose: paths/names by default, content opt-in)

3. **Team Features**: Is this a single-user tool or multi-user from the start? (Assume single-user, team features added later)

4. **Versioning**: How should we handle plan versioning? Keep all versions or just active + archived? (Propose: all versions with diff support)

5. **Integration with Existing Workflow**: Should app generate files in the same format as your Claude Code workflow for compatibility? (Recommend: yes, for consistency)

### 13.2 Design Decisions to Confirm

1. **Workflow Direction**: Should users always go through 3 steps in order, or allow skipping steps? (Recommend: all 3 required; they're fast)

2. **File Limit**: How many files should the app handle before warning user about performance? (Propose: 5000+ files triggers warning, option to continue anyway)

3. **Export Default**: What should be the default export format? (Recommend: Markdown + orchestration logs)

4. **Auto-Save Frequency**: How often should work be auto-saved? (Recommend: every 30 seconds or on major changes)

5. **Model Cost Visibility**: Should we prominently display cost per step, or keep it subtle? (Recommend: subtle but available on demand)

---

## 14. Glossary & Terminology

- **Orchestration**: The 3-step process of refinement → research → planning
- **Feature Request**: The user's original description of what they want to build
- **Refined Request**: The enhanced version of the feature request with project context
- **File Discovery**: The process of identifying relevant files for a feature
- **Implementation Plan**: The final step-by-step guide for implementing a feature
- **Orchestration Log**: The complete audit trail of all steps, models, and decisions for a feature request

---

## 15. Conclusion

This desktop app transforms your Claude Code feature planning workflow into an interactive, user-controlled tool that maintains the rigor of the original process while adding flexibility, transparency, and local-first security. The three-step orchestration remains the heart of the system, but wrapped in an intuitive UI that guides users from request entry through plan generation and beyond.

**Key Advantages Over Current Workflow**:

1. Persistent, non-linear workflow (users don't lose work)
2. Configurable models and prompts per step
3. Multi-repo support in a single project
4. Visibility into every AI decision
5. Offline file analysis (security and privacy)
6. Reproducible planning (same settings = same results)

**Next Steps**:

1. Clarify open questions (Section 13.1)
2. Confirm design decisions (Section 13.2)
3. Create wireframes/prototypes for main screens
4. Define detailed API contracts between Electron main and renderer
5. Establish data schema and test with sample projects

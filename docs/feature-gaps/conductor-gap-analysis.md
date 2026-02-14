# Conductor vs. Clarify - Missing Features Gap Analysis

> Generated: 2026-02-12
> Reference: https://www.conductor.build / https://docs.conductor.build

---

## P0 - Critical

### 1. Parallel Multi-Agent Execution
**Conductor:** Run multiple Claude Code / Codex agents simultaneously, each in an isolated git worktree workspace with a unique city name. Launch a "team" of coding agents working in parallel on different features.
**Clarify:** Supports parallel workflow execution with configurable concurrency limits (default 3). Workflows exceeding the limit are automatically queued and dequeued when slots free up. Each workflow gets its own git worktree. Dashboard shows running/queued counts and queue positions.
**Status:** Complete

### 2. Direct Chat Interface with AI Agents
**Conductor:** Full conversational chat with Claude/Codex - multiple chat tabs (Cmd+T), chat forking with summaries, reverting to previous turns, chat search (Cmd+F), table of contents navigation, chat compaction for long conversations, auto-generated chat titles, export to new chat.
**Clarify:** Full chat interface at `/chat` with project selector, conversation sidebar, chat forking with summaries, revert to previous turns, message search, table of contents navigation, chat compaction with token tracking, AI-generated titles, export selected messages to new chat, keyboard shortcuts, and streaming AI responses via the Agent SDK.
**Status:** Complete

### 3. Integrated Diff Viewer & Code Review
**Conductor:** Built-in diff viewer with inline commenting, turn-by-turn change viewing per message, file-level comments, "Review" button for AI code review, customizable review prompts, mark files as viewed, committed vs uncommitted grouping, markdown preview in diffs.
**Clarify:** Full diff viewer with unified and split views, file tree sidebar with search/filter/sort, syntax highlighting via Shiki, inline commenting with threading, AI-powered code review with customizable prompts, mark files as viewed tracking, committed vs uncommitted grouping via accordion sections, keyboard shortcuts (j/k/n/p/v/c/u/s), Ctrl+F search across diffs, workflow integration as a "Changes" tab, and standalone `/changes` page with project/repo/branch selectors.
**Status:** Complete

---

## P1 - High

### 4. GitHub / PR Integration
**Conductor:** Create PRs from UI, view/edit PR titles & descriptions, sync GitHub comments to diffs, view GitHub Actions CI status in Checks tab, re-run failed checks, merge from UI, PR templates, link GitHub issues, view deployments (Vercel/GitHub), draft PRs.
**Clarify:** Full GitHub PR management via `gh` CLI. `/pulls` page with PR listing, filtering, and creation. PR detail view with 5 tabs: Overview (editable title/description, metadata, review decision), Changes (reuses DiffViewer with parsed PR diffs), Comments (grouped by file with reply support), Checks (CI status with re-run actions), Deployments (environment status with links). Create/merge/close PRs, draft PR support, convert draft to ready, PR templates auto-detection, bidirectional comment sync between local diff comments and GitHub, "Create PR" button on completed workflows pre-filled from workflow data, connection status monitoring with offline handling.
**Status:** Complete

### 5. Embedded Terminal
**Conductor:** Full terminal emulator in each workspace with WebGL rendering, multiple terminal tabs (Cmd+T/W), setup & run scripts (conductor.json), terminal context highlighting, Cmd+L to send terminal output to chat, reading terminal output tool.
**Clarify:** VS Code-style bottom panel terminal powered by node-pty and xterm.js. Multiple tabs, resizable panel, auto-cwd to worktree, Ctrl+` toggle, terminal settings (shell path, font size, font family, cursor blink, scrollback), status bar indicator with tab count, "Open Terminal" button on workflows with worktrees.
**Status:** Complete

### 6. File Explorer & File Mentions
**Conductor:** Workspace file tree explorer, Cmd+P file search with fuzzy matching, @-mention files in chat, drag-and-drop files/folders from Finder, file picker for attachments, image pasting, clickable file paths in agent responses.
**Clarify:** Has file discovery (AI-powered) but no interactive file browser, no file mentions in chat, no file attachments.
**Status:** Not started

### 7. Plan Mode (Interactive Planning)
**Conductor:** Interactive plan mode where Claude proposes a plan, asks questions, user approves/provides feedback before implementation begins. Hand off plans to other agents.
**Clarify:** Has implementation planning as a workflow step, but it's a one-shot generation, not interactive with back-and-forth.
**Status:** Not started

### 8. Multi-Model Support
**Conductor:** Claude (Opus, Sonnet, Haiku), GPT-5/Codex (with reasoning levels: low/medium/high/xhigh), model switching per chat, thinking level toggles (Cmd+Shift+.), Bedrock/Vertex/custom API providers.
**Clarify:** Claude models only (Sonnet/Opus/Haiku). No OpenAI/Codex support, no custom providers.
**Status:** Not started

---

## P2 - Medium

### 9. Command Palette
**Conductor:** Cmd+K command palette for quick actions - create workspace, search workspaces, open files, archive, switch repos, etc.
**Clarify:** No command palette.
**Status:** Not started

### 10. MCP (Model Context Protocol) Support
**Conductor:** MCP server integration, .mcp.json recognition, MCP status display, MCP output handling.
**Clarify:** No MCP support.
**Status:** Not started

### 11. IDE / Editor Integration
**Conductor:** "Open In" menu for Cursor, VS Code, Zed, IntelliJ, Sublime, XCode, Android Studio. Smooth file opening from diff viewer.
**Clarify:** No IDE integration.
**Status:** Not started

### 12. Keyboard Shortcut System
**Conductor:** 50+ keyboard shortcuts, Cmd+/ cheatsheet, Zen mode (Ctrl+Z), shortcuts for every major action (review, fix errors, merge, create PR, etc.), custom send key config, Colemak/Dvorak support.
**Clarify:** Minimal keyboard shortcuts (Ctrl+Shift+D for debug). No shortcut cheatsheet.
**Status:** Not started

### 13. Cost & Token Tracking (Per-Message)
**Conductor:** Token/cost display below each AI response, detailed context usage breakdown on hover, response duration metadata, context window indicator near composer.
**Clarify:** Has aggregate token tracking per workflow step, but no per-message breakdown visible inline.
**Status:** Not started

### 14. Slash Commands
**Conductor:** Claude Code slash commands integrated (/clear, /compact, /restart, /add-dir, etc.), custom project-level slash commands, fuzzy search autocomplete.
**Clarify:** No slash command system for the AI chat.
**Status:** Not started

---

## P3 - Lower

### 15. Linear Integration
**Conductor:** Link workspaces to Linear issues, create workspaces from Linear issues, search Linear issues, chronological sorting, issue status display.
**Clarify:** No project management tool integration.
**Status:** Not started

### 16. Notes / Scratchpad / .context
**Conductor:** Workspace scratchpad/notes tab, .context directory for persistent attachments/plans/notes shared across agents, WYSIWYG markdown notes.
**Clarify:** No notes or scratchpad feature. No shared context directory.
**Status:** Not started

### 17. Notification & Sound System
**Conductor:** Sound effects on workspace completion, macOS notification badges, user input notifications, toast notifications linking to workspaces, configurable notification sounds.
**Clarify:** Basic toast notifications only. No sound effects or OS-level notifications.
**Status:** Not started

### 18. Mermaid Diagrams & LaTeX
**Conductor:** Mermaid diagram rendering with fullscreen expansion, LaTeX support, themed diagrams.
**Clarify:** Markdown rendering but no Mermaid or LaTeX support.
**Status:** Not started

### 19. Environment Variable Management
**Conductor:** Configure environment variables in Settings, auto-migration of provider env vars, CONDUCTOR_* variable visibility, shell config access.
**Clarify:** No env var management UI.
**Status:** Not started

### 20. Todos / Merge Checklist
**Conductor:** Todo items as merge requirements, workspace blocking until todos complete, enter key creates TODO in Checks tab.
**Clarify:** No todo/checklist system tied to merging.
**Status:** Not started

### 21. Agent Instructions / Persistent Memory
**Conductor:** Agent instruction configuration per repository, "Update memory" after PR merge, AI memory updates for addressing comments, global hooks/memory config.
**Clarify:** Has agent system prompts and per-project overrides but no persistent memory that evolves.
**Status:** Not started

### 22. Workspace Archiving & History
**Conductor:** Archive workspaces with git state saving (including uncommitted), browse archived workspaces, restore/unarchive, "History" view replacing "Workspaces".
**Clarify:** Can archive projects but no workspace-level archiving with git state preservation.
**Status:** Not started

### 23. Setup / Run Scripts
**Conductor:** conductor.json for setup and run scripts, script editing in Settings, setup script logs visible in UI, re-run scripts from terminal panel.
**Clarify:** No project-level setup/run script system.
**Status:** Not started

### 24. Intelligent Chat Features
**Conductor:** AI-generated chat summaries with TOC previews, chat forking with summaries, context compaction with notification, "Compact and Retry" for context limits, export to new chat.
**Clarify:** AI-generated chat titles, table of contents with message previews, chat forking with summaries, context compaction with token threshold notification and dialog, export selected messages to new chat, message revert, and message search with match navigation.
**Status:** Complete

### 25. Workspace Organization & Status
**Conductor:** Workspaces organized by status (backlog, in progress, in review, done), workspace pinning, search by branch/repo/PR number, auto-archive on merge.
**Clarify:** Workflows have statuses but no Kanban-style organization, no pinning.
**Status:** Not started

---

## Priority Summary

| # | Priority | Feature | Impact |
|---|----------|---------|--------|
| 1 | **P0** | ~~Parallel Multi-Agent Execution~~ | Complete |
| 2 | **P0** | ~~Direct Chat Interface~~ | Complete |
| 3 | **P0** | ~~Integrated Diff Viewer & Code Review~~ | Complete |
| 4 | **P1** | ~~GitHub/PR Integration~~ | Complete |
| 5 | **P1** | ~~Embedded Terminal~~ | Complete |
| 6 | **P1** | File Explorer & Mentions | Essential context sharing |
| 7 | **P1** | Plan Mode (Interactive) | Quality of output |
| 8 | **P1** | Multi-Model Support | Flexibility |
| 9 | **P2** | Command Palette | UX polish |
| 10 | **P2** | MCP Support | Extensibility |
| 11 | **P2** | IDE Integration | Developer convenience |
| 12 | **P2** | Keyboard Shortcuts | Power user productivity |
| 13 | **P2** | Cost/Token Per-Message | Transparency |
| 14 | **P2** | Slash Commands | Power user feature |
| 15 | **P3** | Linear Integration | Specific audience |
| 16 | **P3** | Notes/Scratchpad | Nice to have |
| 17 | **P3** | Notification/Sound System | Polish |
| 18 | **P3** | Mermaid/LaTeX | Content rendering |
| 19 | **P3** | Env Var Management | Configuration |
| 20 | **P3** | Todos/Merge Checklist | Workflow management |
| 21 | **P3** | Agent Instructions/Memory | Evolving context |
| 22 | **P3** | Workspace Archiving & History | State management |
| 23 | **P3** | Setup/Run Scripts | Project configuration |
| 24 | **P3** | ~~Intelligent Chat Features~~ | Complete |
| 25 | **P3** | Workspace Organization & Status | Workflow management |

---

## Sources
- [Conductor.build](https://www.conductor.build/)
- [Conductor Docs](https://docs.conductor.build)
- [Conductor Changelog](https://www.conductor.build/changelog)

# Implementation Plan: Debug Log Window with electron-log Integration

**Generated**: 2026-02-02
**Original Request**: "integrate electron-log into the app to track everything the Claude Agent SDK does. There should be a debug window in the app where the user can view and search these logs"

## Analysis Summary

- Feature request refined with project context
- Discovered 45 files across 12 directories
- Generated 13-step implementation plan

## Overview

**Estimated Duration**: 4-5 days
**Complexity**: High
**Risk Level**: Medium

## Quick Summary

Integrate electron-log into Clarify to track all Claude Agent SDK events with file-based persistence, then create an independent debug window with a searchable interface for viewing, filtering, and analyzing logs by level, message type, and session ID. The implementation requires a new logging service, IPC handlers, a separate Electron window with its own preload script, and React components for the debug UI.

## Prerequisites

- [ ] Install electron-log dependency: `pnpm add electron-log`
- [ ] Verify electron-log compatibility with Electron v35
- [ ] Review existing agent-stream.service.ts for all logging injection points

## Implementation Steps

### Step 1: Add electron-log Dependency and Create Type Definitions

**What**: Install electron-log and create TypeScript type definitions for the debug logging system
**Why**: Establishes the foundation for type-safe logging throughout the application and defines the data structures for log entries, filters, and API interfaces
**Confidence**: High

**Files to Create:**
- `types/debug-log.d.ts` - Type definitions for debug log entries, filters, and IPC API

**Files to Modify:**
- `package.json` - Add electron-log dependency

**Changes:**
- Add electron-log to dependencies
- Define DebugLogEntry interface with fields: id, timestamp, level, category, sessionId, message, metadata
- Define DebugLogLevel type: 'info' | 'warn' | 'error' | 'debug'
- Define DebugLogCategory type: 'sdk_event' | 'tool_use' | 'tool_result' | 'thinking' | 'text' | 'permission' | 'session' | 'system'
- Define DebugLogFilters interface with text search, level filter, category filter, sessionId filter, date range
- Define DebugLogAPI interface for IPC methods

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] electron-log package installed successfully
- [ ] Type definitions compile without errors
- [ ] All validation commands pass

---

### Step 2: Create Debug Logger Service

**What**: Create a service that wraps electron-log with methods for logging Agent SDK events and querying logs
**Why**: Centralizes logging logic, configures file transport settings (rotation, path, archival), and provides an API for log retrieval with filtering
**Confidence**: High

**Files to Create:**
- `electron/services/debug-logger.service.ts` - Main logging service with electron-log integration

**Changes:**
- Initialize electron-log with custom file transport configuration
- Set log file path to app.getPath('logs') directory
- Configure maxSize for rotation (5MB default)
- Configure archiveLogFn for log rotation handling
- Implement log methods for each category (logSdkEvent, logToolUse, logToolResult, etc.)
- Implement getLogFilePath() method
- Implement readLogs(filters) method to read and filter log entries from file
- Implement clearLogs() method for log management
- Export singleton instance

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Service initializes electron-log correctly
- [ ] File transport configured with rotation settings
- [ ] Log retrieval methods return properly typed results
- [ ] All validation commands pass

---

### Step 3: Inject Logging into Agent Stream Service

**What**: Add logging calls at key points in the agent-stream.service.ts to capture all SDK events
**Why**: Enables comprehensive tracking of message exchanges, tool invocations, results, permissions, thinking output, and streaming deltas
**Confidence**: High

**Files to Modify:**
- `electron/services/agent-stream.service.ts` - Add logging at SDK event points

**Changes:**
- Import debug-logger.service singleton
- Add logging in createSession() for session lifecycle start
- Add logging in cancelSession() for session cancellation
- Add logging in mapAndSendSDKMessage() for each message type (assistant, result, stream_event, system)
- Add logging in processAssistantMessage() for text, thinking, tool_use, tool_result blocks
- Add logging in processStreamEvent() for text_delta, thinking_delta events
- Add logging in processResultMessage() for success/error outcomes
- Add logging in canUseTool callback for permission requests and responses
- Add logging in startSDKStream() for session start/complete events

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All major SDK event types are logged
- [ ] Logs include sessionId for correlation
- [ ] Logs include appropriate metadata (toolName, toolInput, etc.)
- [ ] All validation commands pass

---

### Step 4: Add Debug Log IPC Channel Definitions

**What**: Define IPC channels for debug log operations following the existing channel pattern
**Why**: Enables type-safe communication between main process and debug renderer window for log retrieval and management
**Confidence**: High

**Files to Modify:**
- `electron/ipc/channels.ts` - Add debugLog channel definitions
- `electron/preload.ts` - Add debugLog channel definitions (duplicate for sandboxed preload)

**Changes:**
- Add debugLog domain object with channels: getLogs, getLogPath, clearLogs, openLogFile, getSessionIds
- Follow existing naming pattern: `debugLog:getLogs`, `debugLog:getLogPath`, etc.
- Duplicate channel definitions in preload.ts (required due to sandbox restrictions)

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Channel definitions match in both files
- [ ] Channel naming follows project conventions
- [ ] All validation commands pass

---

### Step 5: Create Debug Log IPC Handlers

**What**: Implement IPC handlers that expose debug log operations to renderer processes
**Why**: Provides the bridge between the debug logger service and the renderer UI
**Confidence**: High

**Files to Create:**
- `electron/ipc/debug-log.handlers.ts` - IPC handlers for debug log operations

**Files to Modify:**
- `electron/ipc/index.ts` - Register debug log handlers

**Changes:**
- Implement handler for debugLog:getLogs that calls debugLoggerService.readLogs(filters)
- Implement handler for debugLog:getLogPath that returns current log file path
- Implement handler for debugLog:clearLogs that clears log file
- Implement handler for debugLog:openLogFile that opens log file in system default application
- Implement handler for debugLog:getSessionIds that returns unique session IDs from logs
- Register handlers in registerAllHandlers function

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All handlers follow existing handler patterns
- [ ] Handlers properly validate input parameters
- [ ] Error handling follows project conventions
- [ ] All validation commands pass

---

### Step 6: Create Debug Window Preload Script and Update Main Process

**What**: Create a separate preload script for the debug window and add window creation logic to main process
**Why**: The debug window needs its own preload with the debugLog API exposed, and requires separate BrowserWindow management with support for secondary monitor positioning
**Confidence**: Medium

**Files to Create:**
- `electron/debug-window/preload.ts` - Preload script exposing debugLog API

**Files to Modify:**
- `electron/main.ts` - Add debug window creation, keyboard shortcut registration
- `electron/tsconfig.json` - Include debug-window directory in compilation

**Changes:**
- Create preload script that exposes debugLogAPI via contextBridge
- Implement debugLogAPI with methods: getLogs, getLogPath, clearLogs, openLogFile, getSessionIds
- Add createDebugWindow() function in main.ts with BrowserWindow configuration
- Configure debug window to allow positioning on secondary monitors
- Register global keyboard shortcut (Ctrl+Shift+D / Cmd+Shift+D) to toggle debug window
- Export getDebugWindow() function for IPC access
- Add menu item for debug window in application menu (if exists)

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Debug window preload compiles correctly
- [ ] Debug window can be created and positioned independently
- [ ] Keyboard shortcut toggles debug window visibility
- [ ] All validation commands pass

---

### Step 7: Update Type Definitions for Debug Window API

**What**: Add DebugLogAPI interface to electron.d.ts for renderer type safety
**Why**: Ensures type-safe access to debug log API from React components
**Confidence**: High

**Files to Modify:**
- `types/electron.d.ts` - Add DebugLogAPI interface to ElectronAPI
- `electron/preload.ts` - Add debugLog API implementation to main window preload

**Changes:**
- Import debug log types from debug-log.d.ts
- Add debugLog property to ElectronAPI interface with all method signatures
- Implement debugLog API in main preload to allow opening debug window from settings
- Add IPC channel for opening debug window from main preload

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] DebugLogAPI types properly integrated
- [ ] Both preload scripts expose consistent APIs
- [ ] Window type declarations updated
- [ ] All validation commands pass

---

### Step 8: Create Debug Log Zustand Store

**What**: Create a Zustand store to manage debug log UI state including filters, selected entries, and auto-refresh
**Why**: Centralizes debug log UI state management with persistence support for filter preferences
**Confidence**: High

**Files to Create:**
- `lib/stores/debug-log-store.ts` - Zustand store for debug log state

**Changes:**
- Define DebugLogState interface with: logs, filters, isLoading, selectedLogId, autoRefresh, error
- Define DebugLogActions interface with: setFilters, setLogs, selectLog, toggleAutoRefresh, reset
- Implement store with initial state and actions
- Add filter persistence via electron-store (optional)

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Store manages all debug log UI state
- [ ] Filter changes trigger state updates
- [ ] Store follows project Zustand patterns
- [ ] All validation commands pass

---

### Step 9: Create Debug Log Query Key Factory and TanStack Query Hooks

**What**: Create query key factory and hooks for fetching debug logs with caching and automatic refetch
**Why**: Integrates with existing TanStack Query infrastructure for data fetching with proper cache management
**Confidence**: High

**Files to Create:**
- `lib/queries/debug-logs.ts` - Query key factory for debug logs
- `hooks/queries/use-debug-logs.ts` - TanStack Query hooks for debug log operations

**Files to Modify:**
- `lib/queries/index.ts` - Export debug log keys
- `hooks/queries/index.ts` - Export debug log hooks

**Changes:**
- Create debugLogKeys with: list(filters), sessionIds, logPath
- Implement useDebugLogs(filters) hook with polling interval support for auto-refresh
- Implement useDebugLogSessionIds() hook for session dropdown
- Implement useDebugLogPath() hook for log file location
- Implement useClearDebugLogs() mutation hook
- Export all hooks from index file

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Query keys follow project conventions
- [ ] Hooks properly handle loading/error states
- [ ] Auto-refresh polling works correctly
- [ ] All validation commands pass

---

### Step 10: Create Debug Window Layout and Page

**What**: Create the Next.js layout and page for the debug window
**Why**: Provides the standalone UI structure for the debug window that loads in the separate Electron window
**Confidence**: High

**Files to Create:**
- `app/debug/layout.tsx` - Minimal layout for debug window (no sidebar/header)
- `app/debug/page.tsx` - Main debug window page

**Changes:**
- Create minimal layout without AppShell components (standalone window)
- Include necessary providers (QueryProvider, ThemeProvider)
- Create page component that renders DebugLogViewer
- Configure page to use full viewport height

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Layout renders without app shell
- [ ] Page loads debug log viewer
- [ ] Theme support works in standalone window
- [ ] All validation commands pass

---

### Step 11: Create Debug Log UI Components

**What**: Create the React components for the debug log viewer interface
**Why**: Provides the interactive UI for viewing, searching, and filtering logs with virtual scrolling for performance
**Confidence**: Medium

**Files to Create:**
- `components/debug/debug-log-viewer.tsx` - Main container component
- `components/debug/debug-log-toolbar.tsx` - Toolbar with refresh, clear, and export actions
- `components/debug/debug-log-filters.tsx` - Filter controls (search, level, category, session)
- `components/debug/debug-log-list.tsx` - Virtualized log list using @tanstack/react-virtual
- `components/debug/debug-log-entry.tsx` - Individual log entry display
- `components/debug/debug-log-search.tsx` - Search input with debounce
- `components/debug/index.ts` - Barrel export file

**Changes:**
- DebugLogViewer: orchestrates data fetching and state management
- DebugLogToolbar: refresh button, clear logs button, open log file button, auto-refresh toggle
- DebugLogFilters: text input, level multi-select, category multi-select, session dropdown
- DebugLogList: virtual list with @tanstack/react-virtual for performance
- DebugLogEntry: expandable entry showing timestamp, level badge, category, message, metadata
- DebugLogSearch: input with search icon and clear button

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Components follow project CVA/Base UI patterns
- [ ] Virtual scrolling handles large log files
- [ ] Filters properly narrow displayed logs
- [ ] All validation commands pass

---

### Step 12: Add Debug Settings Section to Settings Page

**What**: Add a section to the settings form for debug configuration and a button to open the debug window
**Why**: Provides user-accessible way to open debug window and configure logging preferences
**Confidence**: High

**Files to Create:**
- `components/settings/debug-settings-section.tsx` - Debug configuration section

**Files to Modify:**
- `components/settings/settings-form.tsx` - Include debug settings section
- `lib/validations/settings.ts` - Add debug settings validation schema (if needed)

**Changes:**
- Create DebugSettingsSection with "Open Debug Window" button
- Add button handler that calls IPC to show debug window
- Optionally add settings for log level threshold, auto-clear on startup
- Import and render section in SettingsForm

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Debug section displays in settings
- [ ] Open Debug Window button functions correctly
- [ ] Section follows existing settings section patterns
- [ ] All validation commands pass

---

### Step 13: Integration Testing and Polish

**What**: Test the complete debug logging flow and polish UI interactions
**Why**: Ensures all components work together correctly and the user experience is smooth
**Confidence**: High

**Files to Modify:**
- Various files as needed for bug fixes and polish

**Changes:**
- Verify logs are written during agent stream operations
- Test all filter combinations work correctly
- Verify keyboard shortcut works from any window
- Test debug window positioning on secondary monitor
- Ensure log rotation works when maxSize exceeded
- Verify clear logs functionality
- Test auto-refresh polling behavior

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Agent SDK events are logged comprehensively
- [ ] Debug window opens and positions correctly
- [ ] Filters work in combination
- [ ] Performance acceptable with large log files
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint:fix`
- [ ] Debug window opens via keyboard shortcut (Ctrl+Shift+D / Cmd+Shift+D)
- [ ] Debug window opens via Settings button
- [ ] Logs persist across application restarts
- [ ] Log filtering works for text search, level, category, and session ID
- [ ] Virtual scrolling performs well with 10,000+ log entries
- [ ] Log rotation occurs when file exceeds configured size

## Notes

- **Separate Window Architecture**: The debug window is a completely separate BrowserWindow with its own preload script. This allows independent positioning (including secondary monitors) and prevents the debug UI from affecting main application performance.

- **electron-log Configuration**: Use electron-log's file transport with maxSize set to 5MB and custom archiveLogFn for rotation. The log path should use `app.getPath('logs')` for platform-appropriate location.

- **Performance Considerations**: Use @tanstack/react-virtual for the log list to handle potentially large log files. Implement debounced search to prevent excessive filtering during typing.

- **IPC Channel Duplication**: Due to Electron's sandboxed preload restrictions, channel constants must be duplicated in both `electron/ipc/channels.ts` and `electron/preload.ts`. Keep these synchronized.

- **Session ID Correlation**: All logs include sessionId to enable filtering by specific agent stream sessions. The session ID dropdown should show only sessions present in the current log file.

/**
 * Debug Log Type Definitions
 *
 * Defines the data structures for debug logging functionality including
 * log entries, filters, and the IPC API interface.
 *
 * This is the single source of truth for all debug log types.
 * Other files should import from this module rather than duplicating types.
 */

/**
 * IPC API interface for debug log operations.
 * Exposed via window.electronAPI.debugLog in the renderer.
 */
export interface DebugLogAPI {
  /** Clear all log entries from the current log file */
  clearLogs: () => Promise<{ error?: string; success: boolean }>;
  /** Get the file path of the current log file */
  getLogPath: () => Promise<string>;
  /** Retrieve filtered log entries */
  getLogs: (filters?: DebugLogFilters) => Promise<Array<DebugLogEntry>>;
  /** Get list of unique session IDs from log entries */
  getSessionIds: () => Promise<Array<string>>;
  /** Open the log file in the system's default application */
  openLogFile: () => Promise<{ error?: string; success: boolean }>;
}

/**
 * Categories for classifying the source or type of log entries.
 * Maps to different aspects of the orchestration system.
 */
export type DebugLogCategory =
  | 'permission'
  | 'sdk_event'
  | 'session'
  | 'system'
  | 'text'
  | 'thinking'
  | 'tool_result'
  | 'tool_use';

/**
 * A single debug log entry with full context.
 */
export interface DebugLogEntry {
  /** Category classifying the log source/type */
  category: DebugLogCategory;
  /** Unique identifier for the log entry */
  id: string;
  /** Log severity level */
  level: DebugLogLevel;
  /** Human-readable log message */
  message: string;
  /** Optional structured data associated with the log entry */
  metadata?: Record<string, unknown>;
  /** Associated session ID for correlation */
  sessionId: string;
  /** ISO 8601 timestamp when the log entry was created */
  timestamp: string;
}

/**
 * Filter criteria for querying debug log entries.
 * All fields are optional; omitted fields are not used for filtering.
 */
export interface DebugLogFilters {
  /** Filter by specific category */
  category?: DebugLogCategory;
  /** Filter entries created on or before this date (ISO 8601) */
  dateEnd?: string;
  /** Filter entries created on or after this date (ISO 8601) */
  dateStart?: string;
  /** Filter by specific log level */
  level?: DebugLogLevel;
  /** Filter by associated session ID */
  sessionId?: string;
  /** Text search across message content */
  text?: string;
}

/**
 * Log severity levels for categorizing debug entries.
 * Ordered from most verbose (debug) to most severe (error).
 */
export type DebugLogLevel = 'debug' | 'error' | 'info' | 'warn';

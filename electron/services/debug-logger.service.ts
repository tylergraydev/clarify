/**
 * Debug Logger Service
 *
 * Provides centralized logging for Claude Agent SDK events and system operations.
 * Uses electron-log with file transport configuration for persistent log storage.
 *
 * ## Features
 *
 * - Structured JSON logging for all Agent SDK events
 * - Log rotation with configurable max size (5MB default)
 * - Category-based filtering for efficient log retrieval
 * - Session ID correlation for tracking agent workflows
 *
 * ## Usage
 *
 * ```typescript
 * import { debugLoggerService } from './debug-logger.service';
 *
 * // Log Agent SDK events
 * debugLoggerService.logSdkEvent(sessionId, 'Stream started', { prompt });
 * debugLoggerService.logToolUse(sessionId, 'Read', { file_path: '/src/index.ts' });
 * debugLoggerService.logToolResult(sessionId, 'Read', { content: '...' });
 *
 * // Query logs
 * const logs = await debugLoggerService.readLogs({ sessionId, category: 'tool_use' });
 * ```
 *
 * @see {@link ../../types/debug-log.d.ts Debug Log Types}
 */

import { randomUUID } from 'crypto';
import { app } from 'electron';
import log from 'electron-log';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

import type {
  DebugLogCategory,
  DebugLogEntry,
  DebugLogFilters,
  DebugLogLevel,
} from '../../types/debug-log';

/**
 * Default maximum log file size in bytes (5MB).
 * When exceeded, log rotation occurs.
 */
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024;

/**
 * Log file name for debug logs.
 */
const LOG_FILE_NAME = 'clarify-debug.log';

/**
 * Internal structure for log entries as stored in the file.
 * Matches DebugLogEntry but with timestamp as ISO string.
 */
interface LogFileEntry {
  category: DebugLogCategory;
  id: string;
  level: DebugLogLevel;
  message: string;
  metadata?: Record<string, unknown>;
  sessionId: string;
  timestamp: string;
}

/**
 * Debug Logger Service
 *
 * Manages debug logging for the Clarify application.
 * Provides structured logging with JSON format for easy parsing
 * and filtering.
 */
class DebugLoggerService {
  private isInitialized = false;
  private logFilePath: string;

  constructor() {
    // Initialize log file path - will be set properly when app is ready
    this.logFilePath = '';
  }

  /**
   * Clear all log entries.
   *
   * @returns Promise resolving to success status
   */
  async clearLogs(): Promise<{ error?: string; success: boolean }> {
    this.ensureInitialized();

    try {
      // Truncate the log file
      fs.writeFileSync(this.logFilePath, '');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { error: errorMessage, success: false };
    }
  }

  /**
   * Get the path to the current log file.
   *
   * @returns The absolute path to the log file
   */
  getLogFilePath(): string {
    this.ensureInitialized();
    return this.logFilePath;
  }

  /**
   * Get unique session IDs from log entries.
   *
   * @returns Promise resolving to array of unique session IDs
   */
  async getSessionIds(): Promise<Array<string>> {
    this.ensureInitialized();

    const sessionIds = new Set<string>();

    if (!fs.existsSync(this.logFilePath)) {
      return [];
    }

    const fileStream = fs.createReadStream(this.logFilePath, { encoding: 'utf8' });
    const rl = readline.createInterface({
      crlfDelay: Infinity,
      input: fileStream,
    });

    for await (const line of rl) {
      if (!line.trim()) continue;

      try {
        const entry = JSON.parse(line) as LogFileEntry;
        if (entry.sessionId && entry.sessionId !== 'system') {
          sessionIds.add(entry.sessionId);
        }
      } catch {
        // Skip malformed lines
        continue;
      }
    }

    return Array.from(sessionIds);
  }

  /**
   * Initialize the logger with proper file transport configuration.
   * Must be called after app.whenReady() resolves.
   */
  initialize(): void {
    if (this.isInitialized) return;

    // Set up log file path in app's log directory
    const logsPath = app.getPath('logs');
    this.logFilePath = path.join(logsPath, LOG_FILE_NAME);

    // Configure electron-log file transport
    log.transports.file.resolvePathFn = () => this.logFilePath;
    log.transports.file.maxSize = DEFAULT_MAX_SIZE;
    log.transports.file.format = '{text}'; // Use raw text for JSON logging

    // Configure archive function for log rotation
    log.transports.file.archiveLogFn = (file) => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const archivePath = file.path.replace('.log', `-${timestamp}.log`);

      try {
        fs.renameSync(file.path, archivePath);
      } catch {
        // If rename fails, try to copy and clear
        try {
          fs.copyFileSync(file.path, archivePath);
          fs.writeFileSync(file.path, '');
        } catch {
          // Silently fail - logging should not crash the app
        }
      }
    };

    // Disable console transport in production
    if (process.env.NODE_ENV !== 'development') {
      log.transports.console.level = false;
    }

    this.isInitialized = true;
  }

  /**
   * Log a permission request or decision.
   *
   * @param sessionId - The session ID for correlation
   * @param permission - Description of the permission
   * @param granted - Whether the permission was granted
   */
  logPermission(
    sessionId: string,
    permission: string,
    granted: boolean
  ): void {
    this.writeLog(
      granted ? 'info' : 'warn',
      'permission',
      sessionId,
      `Permission ${granted ? 'granted' : 'denied'}: ${permission}`,
      { granted, permission }
    );
  }

  /**
   * Log a generic SDK event.
   *
   * @param sessionId - The session ID for correlation
   * @param message - Human-readable event message
   * @param metadata - Optional structured data
   */
  logSdkEvent(
    sessionId: string,
    message: string,
    metadata?: Record<string, unknown>
  ): void {
    this.writeLog('info', 'sdk_event', sessionId, message, metadata);
  }

  /**
   * Log a session lifecycle event.
   *
   * @param sessionId - The session ID for correlation
   * @param event - The session event type
   * @param metadata - Optional additional data
   */
  logSession(
    sessionId: string,
    event: 'cancel' | 'end' | 'start',
    metadata?: Record<string, unknown>
  ): void {
    const levelMap: Record<string, DebugLogLevel> = {
      cancel: 'warn',
      end: 'info',
      start: 'info',
    };

    this.writeLog(
      levelMap[event] ?? 'info',
      'session',
      sessionId,
      `Session ${event}`,
      metadata
    );
  }

  /**
   * Log a system-level event (not tied to a specific session).
   *
   * @param message - Human-readable event message
   * @param metadata - Optional structured data
   */
  logSystem(message: string, metadata?: Record<string, unknown>): void {
    this.writeLog('info', 'system', 'system', message, metadata);
  }

  /**
   * Log Claude's text output.
   *
   * @param sessionId - The session ID for correlation
   * @param content - The text content
   */
  logText(sessionId: string, content: string): void {
    // Truncate long text content
    const truncatedContent = content.length > 2000
      ? content.slice(0, 2000) + '... [truncated]'
      : content;

    this.writeLog('info', 'text', sessionId, 'Text output', {
      content: truncatedContent,
    });
  }

  /**
   * Log Claude's thinking/reasoning content.
   *
   * @param sessionId - The session ID for correlation
   * @param content - The thinking content
   */
  logThinking(sessionId: string, content: string): void {
    // Truncate long thinking content
    const truncatedContent = content.length > 2000
      ? content.slice(0, 2000) + '... [truncated]'
      : content;

    this.writeLog('debug', 'thinking', sessionId, 'Thinking block', {
      content: truncatedContent,
    });
  }

  /**
   * Log a tool result event.
   *
   * @param sessionId - The session ID for correlation
   * @param toolName - Name of the tool that produced the result
   * @param result - The tool's output/result
   */
  logToolResult(
    sessionId: string,
    toolName: string,
    result: unknown
  ): void {
    // Truncate large results to avoid bloating logs
    let resultSummary: unknown = result;
    if (typeof result === 'string' && result.length > 1000) {
      resultSummary = result.slice(0, 1000) + '... [truncated]';
    }

    this.writeLog('info', 'tool_result', sessionId, `Tool completed: ${toolName}`, {
      result: resultSummary,
      toolName,
    });
  }

  /**
   * Log a tool use event.
   *
   * @param sessionId - The session ID for correlation
   * @param toolName - Name of the tool being used
   * @param toolInput - Input parameters for the tool
   */
  logToolUse(
    sessionId: string,
    toolName: string,
    toolInput: Record<string, unknown>
  ): void {
    this.writeLog('info', 'tool_use', sessionId, `Tool invoked: ${toolName}`, {
      toolInput,
      toolName,
    });
  }

  /**
   * Read and filter log entries from the log file.
   *
   * @param filters - Optional filters to apply
   * @returns Promise resolving to filtered log entries
   */
  async readLogs(filters?: DebugLogFilters): Promise<Array<DebugLogEntry>> {
    this.ensureInitialized();

    const entries: Array<DebugLogEntry> = [];

    // Check if log file exists
    if (!fs.existsSync(this.logFilePath)) {
      return entries;
    }

    // Read file line by line
    const fileStream = fs.createReadStream(this.logFilePath, { encoding: 'utf8' });
    const rl = readline.createInterface({
      crlfDelay: Infinity,
      input: fileStream,
    });

    for await (const line of rl) {
      if (!line.trim()) continue;

      try {
        const entry = JSON.parse(line) as LogFileEntry;

        // Validate entry structure
        if (!this.isValidLogEntry(entry)) continue;

        // Apply filters
        if (this.matchesFilters(entry, filters)) {
          entries.push(entry as DebugLogEntry);
        }
      } catch {
        // Skip malformed lines
        continue;
      }
    }

    return entries;
  }

  /**
   * Ensure the service is initialized before use.
   * Auto-initializes if app is ready.
   */
  private ensureInitialized(): void {
    if (!this.isInitialized && app.isReady()) {
      this.initialize();
    }
  }

  /**
   * Validate that a parsed object is a valid log entry.
   */
  private isValidLogEntry(entry: unknown): entry is LogFileEntry {
    if (typeof entry !== 'object' || entry === null) return false;

    const e = entry as Record<string, unknown>;

    return (
      typeof e.id === 'string' &&
      typeof e.sessionId === 'string' &&
      typeof e.message === 'string' &&
      typeof e.timestamp === 'string' &&
      isValidCategory(e.category) &&
      isValidLevel(e.level)
    );
  }

  /**
   * Check if a log entry matches the given filters.
   */
  private matchesFilters(entry: LogFileEntry, filters?: DebugLogFilters): boolean {
    if (!filters) return true;

    // Filter by session ID
    if (filters.sessionId && entry.sessionId !== filters.sessionId) {
      return false;
    }

    // Filter by category
    if (filters.category && entry.category !== filters.category) {
      return false;
    }

    // Filter by level
    if (filters.level && entry.level !== filters.level) {
      return false;
    }

    // Filter by date range (start)
    if (filters.dateStart) {
      const entryDate = new Date(entry.timestamp);
      const startDate = new Date(filters.dateStart);
      if (entryDate < startDate) {
        return false;
      }
    }

    // Filter by date range (end)
    if (filters.dateEnd) {
      const entryDate = new Date(entry.timestamp);
      const endDate = new Date(filters.dateEnd);
      if (entryDate > endDate) {
        return false;
      }
    }

    // Filter by text search
    if (filters.text) {
      const searchText = filters.text.toLowerCase();
      const messageMatch = entry.message.toLowerCase().includes(searchText);
      const metadataMatch = entry.metadata
        ? JSON.stringify(entry.metadata).toLowerCase().includes(searchText)
        : false;

      if (!messageMatch && !metadataMatch) {
        return false;
      }
    }

    return true;
  }

  /**
   * Write a log entry to the file.
   *
   * @param level - Log severity level
   * @param category - Log category
   * @param sessionId - Session ID for correlation
   * @param message - Human-readable message
   * @param metadata - Optional structured data
   */
  private writeLog(
    level: DebugLogLevel,
    category: DebugLogCategory,
    sessionId: string,
    message: string,
    metadata?: Record<string, unknown>
  ): void {
    this.ensureInitialized();

    const entry: LogFileEntry = {
      category,
      id: randomUUID(),
      level,
      message,
      metadata,
      sessionId,
      timestamp: new Date().toISOString(),
    };

    // Write as JSON line
    log.info(JSON.stringify(entry));
  }
}

/**
 * Validates that a value is a valid DebugLogCategory.
 */
function isValidCategory(value: unknown): value is DebugLogCategory {
  const validCategories: Array<DebugLogCategory> = [
    'permission',
    'sdk_event',
    'session',
    'system',
    'text',
    'thinking',
    'tool_result',
    'tool_use',
  ];
  return typeof value === 'string' && validCategories.includes(value as DebugLogCategory);
}

/**
 * Validates that a value is a valid DebugLogLevel.
 */
function isValidLevel(value: unknown): value is DebugLogLevel {
  const validLevels: Array<DebugLogLevel> = ['debug', 'error', 'info', 'warn'];
  return typeof value === 'string' && validLevels.includes(value as DebugLogLevel);
}

// Export singleton instance
export const debugLoggerService = new DebugLoggerService();

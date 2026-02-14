/**
 * Terminal Types
 *
 * TypeScript interfaces for the embedded terminal feature.
 * Covers the PTY backend, IPC API, and UI tab state.
 */

/**
 * API exposed via window.electronAPI.terminal for renderer process use.
 */
export interface TerminalAPI {
  /** Create a new PTY session */
  create(options?: TerminalCreateOptions): Promise<TerminalInfo>;
  /** Get info about a specific terminal */
  getInfo(terminalId: string): Promise<null | TerminalInfo>;
  /** Send user keystrokes to the PTY */
  input(terminalId: string, data: string): void;
  /** Kill a PTY session */
  kill(terminalId: string): Promise<boolean>;
  /** List all active terminal IDs */
  listActive(): Promise<Array<string>>;
  /** Subscribe to PTY output data. Returns unsubscribe function. */
  onData(terminalId: string, callback: (data: string) => void): () => void;
  /** Subscribe to PTY exit events. Returns unsubscribe function. */
  onExit(terminalId: string, callback: (exitCode: number) => void): () => void;
  /** Resize the PTY */
  resize(terminalId: string, cols: number, rows: number): void;
}

/**
 * Options for creating a new terminal PTY session.
 */
export interface TerminalCreateOptions {
  /** Number of columns for the terminal */
  cols?: number;
  /** Working directory for the shell process */
  cwd?: string;
  /** Environment variables to pass to the shell */
  env?: Record<string, string>;
  /** Number of rows for the terminal */
  rows?: number;
  /** Path to the shell executable (empty = system default) */
  shellPath?: string;
}

/**
 * Information about an active terminal PTY session.
 */
export interface TerminalInfo {
  /** Number of columns */
  cols: number;
  /** Current working directory */
  cwd: string;
  /** Number of rows */
  rows: number;
  /** Path to the shell executable */
  shellPath: string;
  /** Unique identifier for this terminal session */
  terminalId: string;
}

/**
 * UI state for a single terminal tab.
 */
export interface TerminalTab {
  /** Working directory when the terminal was created */
  cwd: string;
  /** Whether this terminal was opened from a worktree link */
  isWorktreeLinked: boolean;
  /** Unique identifier matching the backend PTY session */
  terminalId: string;
  /** Display title for the tab */
  title: string;
  /** Optional workflow ID if opened from a workflow's worktree */
  workflowId?: number;
}

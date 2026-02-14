import * as pty from 'node-pty';
/**
 * Terminal Service
 *
 * Singleton service managing PTY (pseudo-terminal) process lifecycles.
 * Uses node-pty to spawn shell processes and manages data streaming
 * with output batching for performance (~60fps flush rate).
 */
import * as os from 'os';

import type { TerminalCreateOptions, TerminalInfo } from '../../types/terminal';

interface TerminalEntry {
  cols: number;
  cwd: string;
  dataCallbacks: Set<(data: string) => void>;
  exitCallbacks: Set<(exitCode: number) => void>;
  flushTimer: null | ReturnType<typeof setInterval>;
  outputBuffer: string;
  process: pty.IPty;
  rows: number;
  shellPath: string;
  terminalId: string;
}

/** Flush interval in ms (~60fps) */
const FLUSH_INTERVAL_MS = 16;

/** Counter for generating unique terminal IDs */
let idCounter = 0;

/**
 * Detect the default shell for the current platform.
 */
function getDefaultShell(): string {
  if (process.platform === 'win32') {
    return process.env.COMSPEC || 'cmd.exe';
  }
  return process.env.SHELL || '/bin/bash';
}

/**
 * Map of active terminal entries keyed by terminalId.
 */
const terminals = new Map<string, TerminalEntry>();

/**
 * Create a new PTY session.
 */
export function createTerminal(options?: TerminalCreateOptions): TerminalInfo {
  const terminalId = `term_${++idCounter}_${Date.now()}`;
  const shellPath = options?.shellPath || getDefaultShell();
  const cwd = options?.cwd || os.homedir();
  const cols = options?.cols || 80;
  const rows = options?.rows || 24;

  const shellArgs = process.platform === 'win32' ? [] : ['--login'];

  const proc = pty.spawn(shellPath, shellArgs, {
    cols,
    cwd,
    env: {
      ...process.env,
      ...options?.env,
      TERM: 'xterm-256color',
    } as Record<string, string>,
    name: 'xterm-256color',
    rows,
  });

  const entry: TerminalEntry = {
    cols,
    cwd,
    dataCallbacks: new Set(),
    exitCallbacks: new Set(),
    flushTimer: null,
    outputBuffer: '',
    process: proc,
    rows,
    shellPath,
    terminalId,
  };

  // Buffer PTY output and flush at ~60fps
  proc.onData((data: string) => {
    entry.outputBuffer += data;

    // Start flush timer if not already running
    if (!entry.flushTimer) {
      entry.flushTimer = setInterval(() => {
        flushOutput(entry);

        // Stop timer if buffer is empty
        if (entry.outputBuffer.length === 0 && entry.flushTimer) {
          clearInterval(entry.flushTimer);
          entry.flushTimer = null;
        }
      }, FLUSH_INTERVAL_MS);
    }
  });

  proc.onExit(({ exitCode }) => {
    // Flush any remaining output
    flushOutput(entry);

    // Notify exit callbacks
    for (const cb of entry.exitCallbacks) {
      try {
        cb(exitCode);
      } catch (error) {
        console.error('[Terminal] Error in exit callback:', error);
      }
    }

    // Cleanup
    if (entry.flushTimer) {
      clearInterval(entry.flushTimer);
    }
    terminals.delete(terminalId);
  });

  terminals.set(terminalId, entry);

  return { cols, cwd, rows, shellPath, terminalId };
}

/**
 * Get info about a specific terminal.
 */
export function getTerminalInfo(terminalId: string): null | TerminalInfo {
  const entry = terminals.get(terminalId);
  if (!entry) return null;

  return {
    cols: entry.cols,
    cwd: entry.cwd,
    rows: entry.rows,
    shellPath: entry.shellPath,
    terminalId: entry.terminalId,
  };
}

/**
 * Kill all active PTY sessions. Called on app quit.
 */
export function killAllTerminals(): void {
  for (const [id] of terminals) {
    killTerminal(id);
  }
}

/**
 * Kill a PTY and clean up resources.
 */
export function killTerminal(terminalId: string): boolean {
  const entry = terminals.get(terminalId);
  if (!entry) return false;

  if (entry.flushTimer) {
    clearInterval(entry.flushTimer);
  }

  entry.process.kill();
  terminals.delete(terminalId);
  return true;
}

/**
 * List all active terminal IDs.
 */
export function listActiveTerminals(): Array<string> {
  return [...terminals.keys()];
}

/** No-op unsubscribe function. */
const noop = (): void => {
  /* intentionally empty */
};

/**
 * Resize a PTY.
 */
export function resizeTerminal(terminalId: string, cols: number, rows: number): void {
  const entry = terminals.get(terminalId);
  if (!entry) return;
  entry.process.resize(cols, rows);
  entry.cols = cols;
  entry.rows = rows;
}

/**
 * Register a callback for PTY output data.
 */
export function subscribeTerminalData(terminalId: string, callback: (data: string) => void): () => void {
  const entry = terminals.get(terminalId);
  if (!entry) return noop;

  entry.dataCallbacks.add(callback);
  return () => {
    entry.dataCallbacks.delete(callback);
  };
}

/**
 * Register a callback for PTY exit events.
 */
export function subscribeTerminalExit(terminalId: string, callback: (exitCode: number) => void): () => void {
  const entry = terminals.get(terminalId);
  if (!entry) return noop;

  entry.exitCallbacks.add(callback);
  return () => {
    entry.exitCallbacks.delete(callback);
  };
}

/**
 * Write user input (keystrokes) to a PTY.
 */
export function writeTerminal(terminalId: string, data: string): void {
  const entry = terminals.get(terminalId);
  if (!entry) return;
  entry.process.write(data);
}

/**
 * Flush buffered output for a terminal and notify data callbacks.
 */
function flushOutput(entry: TerminalEntry): void {
  if (entry.outputBuffer.length === 0) return;

  const data = entry.outputBuffer;
  entry.outputBuffer = '';

  for (const cb of entry.dataCallbacks) {
    try {
      cb(data);
    } catch (error) {
      console.error('[Terminal] Error in data callback:', error);
    }
  }
}

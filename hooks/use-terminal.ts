import { useCallback } from 'react';

import type { TerminalCreateOptions } from '../types/terminal';

import { useTerminalStore } from '../lib/stores/terminal-store';

/**
 * Terminal orchestration hook.
 *
 * Coordinates between the Electron terminal API and the Zustand terminal store
 * to create and close terminals.
 */
export function useTerminal() {
  const { addTab, closeTab } = useTerminalStore();

  const createTerminal = useCallback(
    async (options?: TerminalCreateOptions & { workflowId?: number }) => {
      if (typeof window === 'undefined' || !window.electronAPI?.terminal) return null;

      const info = await window.electronAPI.terminal.create({
        cols: options?.cols,
        cwd: options?.cwd,
        env: options?.env,
        rows: options?.rows,
        shellPath: options?.shellPath,
      });

      addTab({
        cwd: info.cwd,
        isWorktreeLinked: !!options?.workflowId,
        terminalId: info.terminalId,
        title: info.cwd.split(/[\\/]/).pop() || 'Terminal',
        workflowId: options?.workflowId,
      });

      return info;
    },
    [addTab]
  );

  const closeTerminal = useCallback(
    async (terminalId: string) => {
      if (typeof window === 'undefined' || !window.electronAPI?.terminal) return;

      await window.electronAPI.terminal.kill(terminalId);
      closeTab(terminalId);
    },
    [closeTab]
  );

  return { closeTerminal, createTerminal };
}

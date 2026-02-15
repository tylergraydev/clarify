'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';

import { useCommandPaletteStore } from '@/lib/stores/command-palette-store';
import { useShellStore } from '@/lib/stores/shell-store';
import { useTerminalStore } from '@/lib/stores/terminal-store';

import type { Command, CommandExecutionContext } from './types';

import { COMMANDS } from './commands';

export function useCommandPaletteCommands(query: string) {
  const router = useRouter();
  const { close, setPendingDialog } = useCommandPaletteStore();
  const { toggleSidebar } = useShellStore();
  const { toggle: toggleTerminal } = useTerminalStore();

  const context: CommandExecutionContext = useMemo(
    () => ({
      navigate: (path: string) => {
        close();
        router.push(path);
      },
      openDebugWindow: () => {
        close();
        window.electronAPI?.debugLog?.openDebugWindow();
      },
      requestDialog: (dialogId) => {
        close();
        setPendingDialog(dialogId);
      },
      toggleSidebar: () => {
        close();
        toggleSidebar();
      },
      toggleTerminal: () => {
        close();
        toggleTerminal();
      },
    }),
    [close, router, setPendingDialog, toggleSidebar, toggleTerminal]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return COMMANDS;
    const lowerQuery = query.toLowerCase();
    return COMMANDS.filter((cmd) => {
      if (cmd.label.toLowerCase().includes(lowerQuery)) return true;
      if (cmd.category.toLowerCase().includes(lowerQuery)) return true;
      if (cmd.keywords?.some((kw) => kw.toLowerCase().includes(lowerQuery))) return true;
      return false;
    });
  }, [query]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Array<Command>>();
    for (const cmd of filtered) {
      const list = groups.get(cmd.category) ?? [];
      list.push(cmd);
      groups.set(cmd.category, list);
    }
    return groups;
  }, [filtered]);

  const executeCommand = useCallback(
    (command: Command) => {
      command.execute(context);
    },
    [context]
  );

  return { executeCommand, filtered, grouped };
}

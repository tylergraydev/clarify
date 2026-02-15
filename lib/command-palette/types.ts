import type { ElementType } from 'react';

export interface Command {
  category: CommandCategory;
  execute: (context: CommandExecutionContext) => void;
  icon: ElementType;
  id: string;
  keywords?: Array<string>;
  label: string;
  shortcut?: string;
}

export type CommandCategory = 'Create' | 'Go to' | 'Toggle';

export interface CommandExecutionContext {
  navigate: (path: string) => void;
  openDebugWindow: () => void;
  requestDialog: (dialogId: PendingDialogId) => void;
  toggleSidebar: () => void;
  toggleTerminal: () => void;
}

export type PendingDialogId = 'create-agent' | 'create-project' | 'create-template';

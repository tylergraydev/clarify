/**
 * Chat Keyboard Shortcut Definitions
 *
 * Constant map of shortcut keys for the chat interface.
 */

export const CHAT_SHORTCUTS = {
  closeSidebar: { description: 'Toggle chat sidebar', key: 'Ctrl+Shift+E', mac: 'Cmd+Shift+E' },
  focusInput: { description: 'Focus chat input', key: 'Ctrl+L', mac: 'Cmd+L' },
  newConversation: { description: 'New conversation', key: 'Ctrl+T', mac: 'Cmd+T' },
  search: { description: 'Search messages', key: 'Ctrl+F', mac: 'Cmd+F' },
} as const;

export type ChatShortcutId = keyof typeof CHAT_SHORTCUTS;

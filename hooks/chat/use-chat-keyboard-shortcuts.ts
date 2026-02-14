'use client';

import type { RefObject } from 'react';

import { useChatStore } from '@/lib/stores/chat-store';

import { useKeyboardShortcuts } from '../use-keyboard-shortcut';

interface UseChatKeyboardShortcutsOptions {
  chatInputRef: RefObject<HTMLTextAreaElement | null>;
  enabled: boolean;
  onCancelStream: () => void;
  onNewConversation: () => void;
}

/**
 * Register keyboard shortcuts for the chat interface.
 *
 * - Ctrl+T: New conversation
 * - Ctrl+F: Open message search
 * - Ctrl+L: Focus chat input
 * - Ctrl+Shift+E: Toggle chat sidebar
 * - Escape: Close search or cancel stream
 */
export function useChatKeyboardShortcuts({
  chatInputRef,
  enabled,
  onCancelStream,
  onNewConversation,
}: UseChatKeyboardShortcutsOptions): void {
  const { isSearchOpen, setIsSearchOpen, toggleSidebar } = useChatStore();

  useKeyboardShortcuts([
    {
      callback: onNewConversation,
      options: { enabled, key: 't', modifiers: ['ctrl'] },
    },
    {
      callback: () => setIsSearchOpen(true),
      options: { enabled, key: 'f', modifiers: ['ctrl'] },
    },
    {
      callback: () => chatInputRef.current?.focus(),
      options: { enabled, key: 'l', modifiers: ['ctrl'] },
    },
    {
      callback: toggleSidebar,
      options: { enabled, key: 'e', modifiers: ['ctrl', 'shift'] },
    },
    {
      callback: () => {
        if (isSearchOpen) {
          setIsSearchOpen(false);
        } else {
          onCancelStream();
        }
      },
      options: { enabled, key: 'Escape' },
    },
  ]);
}

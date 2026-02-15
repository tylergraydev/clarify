'use client';

import type { RefObject } from 'react';

import type { ReasoningLevel } from '@/lib/constants/providers';

import { modelSupportsReasoning } from '@/lib/constants/providers';
import { useChatStore } from '@/lib/stores/chat-store';

import { useKeyboardShortcuts } from '../use-keyboard-shortcut';

const THINKING_CYCLE: Array<null | ReasoningLevel> = [null, 'low', 'medium', 'high'];

interface UseChatKeyboardShortcutsOptions {
  chatInputRef: RefObject<HTMLTextAreaElement | null>;
  enabled: boolean;
  onCancelStream: () => void;
  onFileSearch?: () => void;
  onNewConversation: () => void;
}

/**
 * Register keyboard shortcuts for the chat interface.
 *
 * - Ctrl+T: New conversation
 * - Ctrl+F: Open message search
 * - Ctrl+L: Focus chat input
 * - Ctrl+P / Cmd+P: Open file search
 * - Ctrl+Shift+E: Toggle chat sidebar
 * - Cmd+Shift+.: Cycle thinking/reasoning level
 * - Escape: Close search or cancel stream
 */
export function useChatKeyboardShortcuts({
  chatInputRef,
  enabled,
  onCancelStream,
  onFileSearch,
  onNewConversation,
}: UseChatKeyboardShortcutsOptions): void {
  const { isSearchOpen, reasoningLevel, selectedModel, setIsSearchOpen, setReasoningLevel, toggleSidebar } =
    useChatStore();

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
    ...(onFileSearch
      ? [
          {
            callback: onFileSearch,
            options: { enabled, key: 'p', modifiers: ['ctrl'] as Array<'alt' | 'ctrl' | 'meta' | 'shift'> },
          },
        ]
      : []),
    {
      callback: toggleSidebar,
      options: { enabled, key: 'e', modifiers: ['ctrl', 'shift'] },
    },
    {
      callback: () => {
        // Cycle through thinking/reasoning levels: off -> low -> medium -> high -> off
        if (!modelSupportsReasoning(selectedModel)) {
          // For non-reasoning models, toggle between null and 'high' for extended thinking
          setReasoningLevel(reasoningLevel ? null : 'high');
        } else {
          const currentIndex = THINKING_CYCLE.indexOf(reasoningLevel);
          const nextIndex = (currentIndex + 1) % THINKING_CYCLE.length;
          setReasoningLevel(THINKING_CYCLE[nextIndex] ?? null);
        }
      },
      options: { enabled, key: '.', modifiers: ['meta', 'shift'] },
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

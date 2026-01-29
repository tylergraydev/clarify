"use client";

import { useCallback, useEffect } from "react";

type ModifierKey = "alt" | "ctrl" | "meta" | "shift";

interface ShortcutOptions {
  /** Whether the shortcut is enabled */
  enabled?: boolean;
  /** The key to listen for (e.g., "k", "n", "Escape") */
  key: string;
  /** Modifier keys required (ctrl, meta, alt, shift) */
  modifiers?: Array<ModifierKey>;
  /** Whether to prevent default browser behavior */
  preventDefault?: boolean;
  /** Whether to stop propagation to other handlers */
  stopPropagation?: boolean;
}

/**
 * Hook to handle keyboard shortcuts.
 *
 * @example
 * // Focus search with Ctrl/Cmd+K
 * useKeyboardShortcut(
 *   () => searchInputRef.current?.focus(),
 *   { key: "k", modifiers: ["ctrl"] }
 * );
 *
 * @example
 * // Open dialog with Ctrl/Cmd+N
 * useKeyboardShortcut(
 *   () => setIsDialogOpen(true),
 *   { key: "n", modifiers: ["meta"] }
 * );
 *
 * @param callback - Function to call when shortcut is triggered
 * @param options - Shortcut configuration options
 */
export const useKeyboardShortcut = (
  callback: () => void,
  options: ShortcutOptions
): void => {
  const {
    enabled = true,
    key,
    modifiers = [],
    preventDefault = true,
    stopPropagation = false,
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Check if the key matches (case-insensitive)
      const pressedKey = event.key.toLowerCase();
      const targetKey = key.toLowerCase();
      if (pressedKey !== targetKey) return;

      // Check modifiers
      const ctrlOrMeta = event.ctrlKey || event.metaKey;

      // Build expected modifier state
      const expectsCtrlOrMeta =
        modifiers.includes("ctrl") || modifiers.includes("meta");
      const expectsAlt = modifiers.includes("alt");
      const expectsShift = modifiers.includes("shift");

      // Validate modifier state
      if (expectsCtrlOrMeta !== ctrlOrMeta) return;
      if (expectsAlt !== event.altKey) return;
      if (expectsShift !== event.shiftKey) return;

      // Ignore if user is typing in an input, textarea, or contenteditable
      const target = event.target as HTMLElement;
      const isEditable =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Allow shortcuts with ctrl/meta even in editable elements
      // (common pattern for things like Ctrl+K command palettes)
      if (isEditable && !ctrlOrMeta) return;

      // Execute the callback
      if (preventDefault) {
        event.preventDefault();
      }
      if (stopPropagation) {
        event.stopPropagation();
      }

      callback();
    },
    [callback, key, modifiers, preventDefault, stopPropagation, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
};

/**
 * Hook to register multiple keyboard shortcuts at once.
 *
 * @example
 * useKeyboardShortcuts([
 *   { callback: focusSearch, options: { key: "k", modifiers: ["ctrl"] } },
 *   { callback: openCreateDialog, options: { key: "n", modifiers: ["ctrl"] } },
 * ]);
 */
export const useKeyboardShortcuts = (
  shortcuts: Array<{
    callback: () => void;
    options: ShortcutOptions;
  }>
): void => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const {
          callback,
          options: {
            enabled = true,
            key,
            modifiers = [],
            preventDefault = true,
            stopPropagation = false,
          },
        } = shortcut;

        if (!enabled) continue;

        // Check if the key matches (case-insensitive)
        const pressedKey = event.key.toLowerCase();
        const targetKey = key.toLowerCase();
        if (pressedKey !== targetKey) continue;

        // Check modifiers
        const ctrlOrMeta = event.ctrlKey || event.metaKey;

        // Build expected modifier state
        const expectsCtrlOrMeta =
          modifiers.includes("ctrl") || modifiers.includes("meta");
        const expectsAlt = modifiers.includes("alt");
        const expectsShift = modifiers.includes("shift");

        // Validate modifier state
        if (expectsCtrlOrMeta !== ctrlOrMeta) continue;
        if (expectsAlt !== event.altKey) continue;
        if (expectsShift !== event.shiftKey) continue;

        // Ignore if user is typing in an input, textarea, or contenteditable
        const target = event.target as HTMLElement;
        const isEditable =
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable;

        // Allow shortcuts with ctrl/meta even in editable elements
        if (isEditable && !ctrlOrMeta) continue;

        // Execute the callback
        if (preventDefault) {
          event.preventDefault();
        }
        if (stopPropagation) {
          event.stopPropagation();
        }

        callback();
        return; // Only execute the first matching shortcut
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    const hasEnabledShortcuts = shortcuts.some(
      (s) => s.options.enabled !== false
    );
    if (!hasEnabledShortcuts) return;

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, shortcuts]);
};

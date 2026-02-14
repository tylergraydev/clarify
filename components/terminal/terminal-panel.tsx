'use client';

import type { PointerEvent as ReactPointerEvent } from 'react';

import { useCallback, useEffect, useRef } from 'react';

import { useTerminal } from '@/hooks/use-terminal';
import { useTerminalStore } from '@/lib/stores/terminal-store';
import { cn } from '@/lib/utils';

import { TerminalInstance } from './terminal-instance';
import { TerminalTabBar } from './terminal-tab-bar';

const MIN_HEIGHT = 120;
const MAX_HEIGHT = 600;

/**
 * Root terminal bottom panel with drag-resize, tab bar, and terminal instances.
 *
 * Listens for `terminal:toggle` and `terminal:new` CustomEvents dispatched
 * from the preload script (triggered by menu keyboard shortcuts).
 */
export const TerminalPanel = () => {
  const { activeTabId, isOpen, panelHeight, setPanelHeight, tabs, toggle } = useTerminalStore();
  const { createTerminal } = useTerminal();

  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  // Listen for keyboard shortcut events from Electron menu
  useEffect(() => {
    const handleToggle = () => {
      const store = useTerminalStore.getState();
      if (store.tabs.length === 0) {
        // Create a new terminal if none exist
        createTerminal();
      } else {
        toggle();
      }
    };

    const handleNew = () => {
      createTerminal();
    };

    window.addEventListener('terminal:toggle', handleToggle);
    window.addEventListener('terminal:new', handleNew);

    return () => {
      window.removeEventListener('terminal:toggle', handleToggle);
      window.removeEventListener('terminal:new', handleNew);
    };
  }, [createTerminal, toggle]);

  // Drag resize handlers
  const handlePointerDown = useCallback(
    (e: ReactPointerEvent) => {
      e.preventDefault();
      startYRef.current = e.clientY;
      startHeightRef.current = panelHeight;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const delta = startYRef.current - moveEvent.clientY;
        const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, startHeightRef.current + delta));
        setPanelHeight(newHeight);
      };

      const handlePointerUp = () => {
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
    },
    [panelHeight, setPanelHeight]
  );

  // Don't render if no tabs
  if (tabs.length === 0) return null;

  return (
    <div
      className={'flex shrink-0 flex-col'}
      style={{ height: isOpen ? panelHeight : 36 }}
    >
      {/* Drag resize handle */}
      {isOpen && (
        <div
          className={cn(
            'h-1 cursor-ns-resize bg-transparent transition-colors hover:bg-accent/20'
          )}
          onPointerDown={handlePointerDown}
        />
      )}

      {/* Tab bar */}
      <TerminalTabBar />

      {/* Terminal instances */}
      {isOpen && (
        <div className={'relative flex-1 overflow-hidden bg-background'}>
          {tabs.map((tab) => (
            <div
              className={cn(
                'absolute inset-0',
                activeTabId === tab.terminalId ? 'visible' : 'invisible'
              )}
              key={tab.terminalId}
            >
              <TerminalInstance terminalId={tab.terminalId} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

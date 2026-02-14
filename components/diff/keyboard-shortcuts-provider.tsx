'use client';

import { Fragment, type ReactNode, useCallback, useEffect, useState } from 'react';

import { useDiffViewStore } from '@/lib/stores/diff-view-store';

import { KeyboardShortcutsDialog } from './keyboard-shortcuts-dialog';

interface KeyboardShortcutsProviderProps {
  children: ReactNode;
  fileCount: number;
  filePaths: Array<string>;
  onToggleViewed?: () => void;
}

export const KeyboardShortcutsProvider = ({
  children,
  fileCount,
  filePaths,
  onToggleViewed,
}: KeyboardShortcutsProviderProps) => {
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const setViewMode = useDiffViewStore((s) => s.setViewMode);
  const selectedFilePath = useDiffViewStore((s) => s.selectedFilePath);
  const setSelectedFilePath = useDiffViewStore((s) => s.setSelectedFilePath);
  const toggleFileCollapsed = useDiffViewStore((s) => s.toggleFileCollapsed);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      switch (e.key) {
        case '?': {
          e.preventDefault();
          setIsShortcutsOpen(true);
          break;
        }
        case 'j': {
          e.preventDefault();
          const currentIndex = selectedFilePath ? filePaths.indexOf(selectedFilePath) : -1;
          const nextIndex = Math.min(currentIndex + 1, fileCount - 1);
          if (filePaths[nextIndex]) {
            setSelectedFilePath(filePaths[nextIndex]);
          }
          break;
        }
        case 'k': {
          e.preventDefault();
          const currentIndex = selectedFilePath ? filePaths.indexOf(selectedFilePath) : fileCount;
          const prevIndex = Math.max(currentIndex - 1, 0);
          if (filePaths[prevIndex]) {
            setSelectedFilePath(filePaths[prevIndex]);
          }
          break;
        }
        case 's': {
          e.preventDefault();
          setViewMode('split');
          break;
        }
        case 'u': {
          e.preventDefault();
          setViewMode('unified');
          break;
        }
        case 'v': {
          e.preventDefault();
          onToggleViewed?.();
          break;
        }
        case 'x': {
          e.preventDefault();
          if (selectedFilePath) {
            toggleFileCollapsed(selectedFilePath);
          }
          break;
        }
      }
    },
    [
      fileCount,
      filePaths,
      onToggleViewed,
      selectedFilePath,
      setSelectedFilePath,
      setViewMode,
      toggleFileCollapsed,
    ]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <Fragment>
      {children}
      <KeyboardShortcutsDialog isOpen={isShortcutsOpen} onOpenChange={setIsShortcutsOpen} />
    </Fragment>
  );
};

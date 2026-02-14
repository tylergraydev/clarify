'use client';

import { Keyboard } from 'lucide-react';

import {
  DialogBackdrop,
  DialogDescription,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog';
import { DIFF_KEYBOARD_SHORTCUTS } from '@/lib/constants/diff-keyboard-shortcuts';

interface KeyboardShortcutsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const KeyboardShortcutsDialog = ({ isOpen, onOpenChange }: KeyboardShortcutsDialogProps) => {
  return (
    <DialogRoot onOpenChange={onOpenChange} open={isOpen}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className={'w-[400px]'}>
          <div className={'flex items-center gap-2'}>
            <Keyboard aria-hidden={'true'} className={'size-5 text-muted-foreground'} />
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </div>
          <DialogDescription>
            Navigate and interact with the diff viewer using these shortcuts.
          </DialogDescription>
          <div className={'mt-3 flex flex-col'}>
            {DIFF_KEYBOARD_SHORTCUTS.map((shortcut) => (
              <div
                className={'flex items-center justify-between border-b border-border/50 py-1.5 last:border-b-0'}
                key={shortcut.key}
              >
                <span className={'text-xs text-muted-foreground'}>{shortcut.description}</span>
                <kbd
                  className={
                    'inline-flex min-w-6 items-center justify-center rounded-sm border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground'
                  }
                >
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};

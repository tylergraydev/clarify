'use client';

import { ExternalLinkIcon, XIcon } from 'lucide-react';
import { memo } from 'react';

import { Button } from '@/components/ui/button';

interface ChatExportToolbarProps {
  isExporting: boolean;
  onCancel: () => void;
  onExport: () => void;
  selectedCount: number;
}

export const ChatExportToolbar = memo(
  ({ isExporting, onCancel, onExport, selectedCount }: ChatExportToolbarProps) => {
    return (
      <div
        className={
          'absolute right-4 bottom-4 left-4 z-10 flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 shadow-lg'
        }
      >
        <span className={'text-sm text-muted-foreground'}>
          <span className={'font-medium text-foreground'}>{selectedCount}</span>
          {selectedCount === 1 ? ' message selected' : ' messages selected'}
        </span>
        <div className={'flex items-center gap-2'}>
          <Button onClick={onCancel} size={'sm'} type={'button'} variant={'outline'}>
            <XIcon className={'mr-1.5 size-3.5'} />
            {'Cancel'}
          </Button>
          <Button disabled={selectedCount === 0 || isExporting} onClick={onExport} size={'sm'} type={'button'}>
            <ExternalLinkIcon className={'mr-1.5 size-3.5'} />
            {'Export to New Chat'}
          </Button>
        </div>
      </div>
    );
  }
);

ChatExportToolbar.displayName = 'ChatExportToolbar';

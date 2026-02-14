'use client';

import { RotateCcwIcon } from 'lucide-react';
import { memo } from 'react';

import { Button } from '@/components/ui/button';

interface ChatRevertDialogProps {
  affectedCount: number;
  onCancel: () => void;
  onConfirm: () => void;
  targetContent: string;
}

export const ChatRevertDialog = memo(({ affectedCount, onCancel, onConfirm, targetContent }: ChatRevertDialogProps) => {
  const preview = targetContent.length > 100 ? `${targetContent.slice(0, 100)}...` : targetContent;

  return (
    <div className={'fixed inset-0 z-50 flex items-center justify-center bg-black/50'}>
      <div className={'w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg'}>
        <div className={'mb-4 flex items-center gap-2'}>
          <RotateCcwIcon className={'size-5 text-amber-500'} />
          <h3 className={'text-sm font-medium'}>{'Revert Conversation'}</h3>
        </div>
        <p className={'mb-3 text-sm text-muted-foreground'}>
          {'This will remove '}
          <span className={'font-medium text-foreground'}>{affectedCount}</span>
          {affectedCount === 1 ? ' message' : ' messages'}
          {' after this point:'}
        </p>
        <div className={'mb-4 rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground'}>
          {preview}
        </div>
        <p className={'mb-4 text-xs text-muted-foreground'}>
          {'Reverted messages can be restored with Undo.'}
        </p>
        <div className={'flex justify-end gap-2'}>
          <Button onClick={onCancel} size={'sm'} type={'button'} variant={'outline'}>
            {'Cancel'}
          </Button>
          <Button onClick={onConfirm} size={'sm'} type={'button'} variant={'destructive'}>
            <RotateCcwIcon className={'mr-1.5 size-3.5'} />
            {'Revert'}
          </Button>
        </div>
      </div>
    </div>
  );
});

ChatRevertDialog.displayName = 'ChatRevertDialog';

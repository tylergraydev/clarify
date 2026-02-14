'use client';

import { CheckSquareIcon, CopyIcon, GitBranchIcon, RotateCcwIcon, SquareIcon } from 'lucide-react';
import { type ComponentPropsWithRef, memo } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatMessageActionBarProps extends ComponentPropsWithRef<'div'> {
  _messageId: number;
  isSelected: boolean;
  isSelectMode: boolean;
  onCopy: () => void;
  onFork?: () => void;
  onRevert?: () => void;
  onToggleSelect?: () => void;
  role: 'assistant' | 'user';
}

export const ChatMessageActionBar = memo(
  ({
    _messageId,
    className,
    isSelected,
    isSelectMode,
    onCopy,
    onFork,
    onRevert,
    onToggleSelect,
    ref,
    role,
    ...props
  }: ChatMessageActionBarProps) => {
    const _isAssistant = role === 'assistant';

    const handleCopyClick = () => {
      onCopy();
    };

    const handleForkClick = () => {
      onFork?.();
    };

    const handleRevertClick = () => {
      onRevert?.();
    };

    const handleToggleSelectClick = () => {
      onToggleSelect?.();
    };

    return (
      <div
        className={cn(
          'absolute -top-3 right-2 flex gap-1 rounded-md border border-border bg-background px-1 py-0.5 shadow-sm',
          'opacity-0 transition-opacity group-hover:opacity-100',
          className
        )}
        ref={ref}
        {...props}
      >
        {/* Copy button - always shown */}
        <Button aria-label={'Copy message'} onClick={handleCopyClick} size={'icon-sm'} variant={'ghost'}>
          <CopyIcon className={'size-4'} />
        </Button>

        {/* Fork button - assistant messages only */}
        {_isAssistant && (
          <Button
            aria-label={'Fork from here'}
            onClick={handleForkClick}
            size={'icon-sm'}
            variant={'ghost'}
          >
            <GitBranchIcon className={'size-4'} />
          </Button>
        )}

        {/* Revert button - assistant messages only */}
        {_isAssistant && (
          <Button
            aria-label={'Revert to here'}
            onClick={handleRevertClick}
            size={'icon-sm'}
            variant={'ghost'}
          >
            <RotateCcwIcon className={'size-4'} />
          </Button>
        )}

        {/* Selection checkbox - select mode only */}
        {isSelectMode && (
          <Button
            aria-label={isSelected ? 'Deselect message' : 'Select message'}
            onClick={handleToggleSelectClick}
            size={'icon-sm'}
            variant={'ghost'}
          >
            {isSelected ? (
              <CheckSquareIcon className={'size-4'} />
            ) : (
              <SquareIcon className={'size-4'} />
            )}
          </Button>
        )}
      </div>
    );
  }
);

ChatMessageActionBar.displayName = 'ChatMessageActionBar';

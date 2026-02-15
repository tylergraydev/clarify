'use client';

import { CheckSquareIcon, FolderIcon, ListIcon, SearchIcon } from 'lucide-react';
import { memo } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatPanelHeaderProps {
  isFileExplorerOpen?: boolean;
  isSelectMode: boolean;
  onFileExplorerToggle?: () => void;
  onSearchToggle: () => void;
  onSelectMode: () => void;
  onTocToggle: () => void;
  title: string;
  tokenEstimate: number;
}

export const ChatPanelHeader = memo(
  ({ isFileExplorerOpen, isSelectMode, onFileExplorerToggle, onSearchToggle, onSelectMode, onTocToggle, title, tokenEstimate }: ChatPanelHeaderProps) => {
    const formatTokens = (tokens: number): string => {
      if (tokens >= 1000) {
        return `~${(tokens / 1000).toFixed(0)}K tokens`;
      }
      return `~${tokens} tokens`;
    };

    return (
      <div className={'flex items-center justify-between border-b border-border px-4 py-2'}>
        {/* Title and token count */}
        <div className={'flex min-w-0 flex-1 items-center gap-3'}>
          <span className={'truncate text-sm font-medium'}>{title}</span>
          {tokenEstimate > 0 && <span className={'text-xs whitespace-nowrap text-muted-foreground'}>{formatTokens(tokenEstimate)}</span>}
        </div>

        {/* Action buttons */}
        <div className={'flex items-center gap-1'}>
          <Button onClick={onSearchToggle} size={'icon-sm'} type={'button'} variant={'ghost'}>
            <SearchIcon className={'size-4'} />
          </Button>
          <Button onClick={onTocToggle} size={'icon-sm'} type={'button'} variant={'ghost'}>
            <ListIcon className={'size-4'} />
          </Button>
          {onFileExplorerToggle && (
            <Button
              className={cn(isFileExplorerOpen && 'bg-muted')}
              onClick={onFileExplorerToggle}
              size={'icon-sm'}
              type={'button'}
              variant={'ghost'}
            >
              <FolderIcon className={'size-4'} />
            </Button>
          )}
          <Button
            className={cn(isSelectMode && 'bg-muted')}
            onClick={onSelectMode}
            size={'icon-sm'}
            type={'button'}
            variant={'ghost'}
          >
            <CheckSquareIcon className={'size-4'} />
          </Button>
        </div>
      </div>
    );
  }
);

ChatPanelHeader.displayName = 'ChatPanelHeader';

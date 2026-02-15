'use client';

import { ArchiveIcon, BotIcon, FileIcon, UserIcon } from 'lucide-react';
import { type ComponentPropsWithRef, memo, useCallback, useMemo } from 'react';
import { Streamdown } from 'streamdown';

import type { ChatMessageWithBlocks } from '@/types/chat';

import { cn } from '@/lib/utils';

import { ChatContentBlockRenderer } from './chat-content-block';
import { ChatMessageActionBar } from './chat-message-action-bar';

interface ChatMessageProps extends ComponentPropsWithRef<'div'> {
  isCurrentMatch?: boolean;
  isSelected?: boolean;
  isSelectMode?: boolean;
  message: ChatMessageWithBlocks;
  onCopyMessage?: (content: string) => void;
  onFork?: (messageId: number) => void;
  onRevert?: (messageId: number) => void;
  onToggleSelect?: (messageId: number) => void;
  searchQuery?: string;
}

/**
 * Highlight search matches in text content.
 */
function highlightText(text: string, query: string): Array<{ isMatch: boolean; text: string }> {
  if (!query || query.length < 2) return [{ isMatch: false, text }];

  const parts: Array<{ isMatch: boolean; text: string }> = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let lastIndex = 0;

  let matchIndex = lowerText.indexOf(lowerQuery, lastIndex);
  while (matchIndex !== -1) {
    if (matchIndex > lastIndex) {
      parts.push({ isMatch: false, text: text.slice(lastIndex, matchIndex) });
    }
    parts.push({ isMatch: true, text: text.slice(matchIndex, matchIndex + query.length) });
    lastIndex = matchIndex + query.length;
    matchIndex = lowerText.indexOf(lowerQuery, lastIndex);
  }

  if (lastIndex < text.length) {
    parts.push({ isMatch: false, text: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ isMatch: false, text }];
}

export const ChatMessage = memo(
  ({
    isCurrentMatch = false,
    isSelected = false,
    isSelectMode = false,
    message,
    onCopyMessage,
    onFork,
    onRevert,
    onToggleSelect,
    ref,
    searchQuery,
    ...props
  }: ChatMessageProps) => {
    const isUser = message.role === 'user';
    const hasBlocks = message.blocks.length > 0;
    const isCompactionSummary = 'isCompactionSummary' in message && message.isCompactionSummary;

    // Parse mentioned files from metadata
    const mentionedFilePaths = useMemo(() => {
      if (!message.metadata) return [];
      try {
        const meta = JSON.parse(message.metadata) as { mentionedFiles?: Array<string> };
        return meta.mentionedFiles ?? [];
      } catch {
        return [];
      }
    }, [message.metadata]);

    const handleCopy = useCallback(() => {
      onCopyMessage?.(message.content ?? '');
    }, [onCopyMessage, message.content]);

    const handleFork = useCallback(() => {
      onFork?.(message.id);
    }, [onFork, message.id]);

    const handleRevert = useCallback(() => {
      onRevert?.(message.id);
    }, [onRevert, message.id]);

    const handleToggleSelect = useCallback(() => {
      onToggleSelect?.(message.id);
    }, [onToggleSelect, message.id]);

    // Render text with optional search highlighting
    const renderContent = () => {
      if (isCompactionSummary) {
        return (
          <div className={'flex items-start gap-2'}>
            <ArchiveIcon className={'mt-0.5 size-3.5 shrink-0 text-muted-foreground'} />
            <div className={'text-xs text-muted-foreground italic'}>
              <p className={'mb-1 font-medium'}>{'Compacted summary'}</p>
              <Streamdown>{message.content ?? ''}</Streamdown>
            </div>
          </div>
        );
      }

      if (isUser) {
        const text = message.content ?? '';
        if (searchQuery) {
          const parts = highlightText(text, searchQuery);
          return (
            <p className={'text-sm whitespace-pre-wrap'}>
              {parts.map((part, i) =>
                part.isMatch ? (
                  <mark className={'rounded-sm bg-yellow-300/50 dark:bg-yellow-500/30'} key={i}>
                    {part.text}
                  </mark>
                ) : (
                  <span key={i}>{part.text}</span>
                )
              )}
            </p>
          );
        }
        return <p className={'text-sm whitespace-pre-wrap'}>{text}</p>;
      }

      if (hasBlocks) {
        return (
          <div className={'flex flex-col gap-1'}>
            {message.blocks.map((block, i) => (
              <ChatContentBlockRenderer block={block} key={i} />
            ))}
          </div>
        );
      }

      return (
        <div className={'max-w-none text-sm'}>
          <Streamdown>{message.content ?? ''}</Streamdown>
        </div>
      );
    };

    return (
      <div
        aria-label={`${message.role} message`}
        className={cn(
          'group relative flex gap-3',
          isUser && 'flex-row-reverse',
          isCurrentMatch && 'ring-2 ring-yellow-400/50 ring-offset-2 ring-offset-background',
          isSelected && 'bg-accent/20'
        )}
        ref={ref}
        role={'article'}
        {...props}
      >
        {/* Avatar */}
        <div
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-full',
            isUser ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
          )}
        >
          {isUser ? <UserIcon className={'size-4'} /> : <BotIcon className={'size-4'} />}
        </div>

        {/* Content */}
        <div
          className={cn(
            'max-w-[80%] min-w-0 rounded-lg px-4 py-2',
            isUser ? 'bg-accent text-accent-foreground' : 'bg-muted text-foreground',
            isCompactionSummary && 'border border-dashed border-border bg-muted/50'
          )}
        >
          {renderContent()}
          {mentionedFilePaths.length > 0 && (
            <div className={'mt-1.5 flex items-center gap-1 text-[11px] opacity-70'}>
              <FileIcon className={'size-3'} />
              <span>
                {'Referenced '}
                {mentionedFilePaths.length}
                {mentionedFilePaths.length === 1 ? ' file' : ' files'}
              </span>
            </div>
          )}
        </div>

        {/* Action bar (hover-revealed) */}
        <ChatMessageActionBar
          _messageId={message.id}
          isSelected={isSelected}
          isSelectMode={isSelectMode}
          onCopy={handleCopy}
          onFork={!isUser ? handleFork : undefined}
          onRevert={!isUser ? handleRevert : undefined}
          onToggleSelect={handleToggleSelect}
          role={isUser ? 'user' : 'assistant'}
        />
      </div>
    );
  }
);

ChatMessage.displayName = 'ChatMessage';

'use client';

import { ListIcon, XIcon } from 'lucide-react';
import { memo, useCallback } from 'react';

import type { ChatMessageWithBlocks } from '@/types/chat';

import { Button } from '@/components/ui/button';

interface ChatTableOfContentsProps {
  messages: Array<ChatMessageWithBlocks>;
  onClose: () => void;
  onScrollToMessage: (messageId: number) => void;
}

export const ChatTableOfContents = memo(
  ({ messages, onClose, onScrollToMessage }: ChatTableOfContentsProps) => {
    const userMessages = messages.filter((m) => m.role === 'user');

    const handleClick = useCallback(
      (messageId: number) => {
        onScrollToMessage(messageId);
      },
      [onScrollToMessage]
    );

    return (
      <div className={'flex w-56 shrink-0 flex-col border-l border-border bg-muted/30'}>
        {/* Header */}
        <div className={'flex items-center justify-between border-b border-border p-3'}>
          <div className={'flex items-center gap-2'}>
            <ListIcon className={'size-4 text-muted-foreground'} />
            <h3 className={'text-sm font-medium'}>{'Contents'}</h3>
          </div>
          <Button onClick={onClose} size={'icon-sm'} type={'button'} variant={'ghost'}>
            <XIcon className={'size-3.5'} />
          </Button>
        </div>

        {/* Entries */}
        <div className={'flex-1 overflow-y-auto p-2'}>
          {userMessages.length === 0 ? (
            <p className={'p-2 text-xs text-muted-foreground'}>{'No messages yet'}</p>
          ) : (
            <ul className={'space-y-0.5'}>
              {userMessages.map((msg, index) => {
                const label = msg.content
                  ? msg.content.length > 40
                    ? `${msg.content.slice(0, 40)}...`
                    : msg.content
                  : `Message ${index + 1}`;

                return (
                  <li key={msg.id}>
                    <button
                      className={
                        'w-full rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                      }
                      onClick={() => handleClick(msg.id)}
                      type={'button'}
                    >
                      {label}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    );
  }
);

ChatTableOfContents.displayName = 'ChatTableOfContents';

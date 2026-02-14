'use client';

import { FolderIcon, Loader2Icon, SendIcon, SquareIcon } from 'lucide-react';
import { type ChangeEvent, type KeyboardEvent, memo, type RefObject, useCallback, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { useChatStore } from '@/lib/stores/chat-store';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  cwd?: string;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
  isStreaming: boolean;
  onCancel: () => void;
  onSend: (message: string) => void;
}

export const ChatInput = memo(({ cwd, inputRef, isStreaming, onCancel, onSend }: ChatInputProps) => {
  const [value, setValue] = useState('');
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = inputRef ?? internalRef;
  const { addToMessageHistory, messageHistory } = useChatStore();

  // Track local history index for navigation
  const [localHistoryIndex, setLocalHistoryIndex] = useState(-1);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    addToMessageHistory(trimmed);
    onSend(trimmed);
    setValue('');
    setLocalHistoryIndex(-1);
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, isStreaming, onSend, addToMessageHistory, textareaRef]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
        return;
      }

      // Input history navigation with Up/Down arrows
      const textarea = e.currentTarget;
      const isCursorAtStart = textarea.selectionStart === 0 && textarea.selectionEnd === 0;
      const isEmpty = value.trim() === '';

      if (e.key === 'ArrowUp' && (isCursorAtStart || isEmpty) && messageHistory.length > 0) {
        e.preventDefault();
        const nextIndex = Math.min(localHistoryIndex + 1, messageHistory.length - 1);
        setLocalHistoryIndex(nextIndex);
        const historyItem = messageHistory[nextIndex];
        if (historyItem !== undefined) {
          setValue(historyItem);
        }
        return;
      }

      if (e.key === 'ArrowDown' && (isCursorAtStart || isEmpty) && localHistoryIndex >= 0) {
        e.preventDefault();
        const nextIndex = localHistoryIndex - 1;
        setLocalHistoryIndex(nextIndex);
        if (nextIndex < 0) {
          setValue('');
        } else {
          const historyItem = messageHistory[nextIndex];
          if (historyItem !== undefined) {
            setValue(historyItem);
          }
        }
      }
    },
    [handleSend, value, messageHistory, localHistoryIndex]
  );

  const handleInput = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    setLocalHistoryIndex(-1);
    // Auto-resize
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, []);

  return (
    <div className={'border-t border-border bg-background p-4'}>
      {/* Skip link target */}
      <a className={'sr-only focus:not-sr-only'} href={'#chat-input'} id={'chat-input'}>
        {'Skip to chat input'}
      </a>

      <div className={'flex items-end gap-2'}>
        <textarea
          aria-label={'Chat message input'}
          className={cn(
            'flex-1 resize-none rounded-md border border-border bg-transparent px-3 py-2 text-sm',
            'placeholder:text-muted-foreground',
            'focus:ring-2 focus:ring-accent focus:ring-offset-0 focus:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
          disabled={isStreaming}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={'Type a message...'}
          ref={textareaRef}
          rows={1}
          value={value}
        />
        {isStreaming ? (
          <Button className={'gap-1.5'} onClick={onCancel} size={'sm'} type={'button'} variant={'destructive'}>
            <SquareIcon className={'size-3.5'} />
            <span>{'Stop'}</span>
          </Button>
        ) : (
          <Button disabled={!value.trim()} onClick={handleSend} size={'icon'} type={'button'}>
            <SendIcon className={'size-4'} />
          </Button>
        )}
      </div>
      <div className={'mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground'}>
        <div className={'flex items-center gap-3'}>
          <span className={'flex items-center gap-1'}>
            <Kbd>{'Shift+Enter'}</Kbd>
            {'for newline'}
          </span>
          <span className={'flex items-center gap-1'}>
            <Kbd>{'Ctrl+L'}</Kbd>
            {'focus'}
          </span>
        </div>
        {cwd && (
          <span className={'flex items-center gap-1'}>
            <FolderIcon className={'size-3'} />
            <span className={'max-w-[200px] truncate'}>{cwd}</span>
          </span>
        )}
      </div>
      {isStreaming && (
        <div aria-live={'polite'} className={'mt-1.5 flex items-center gap-2 text-xs text-muted-foreground'}>
          <Loader2Icon className={'size-3 animate-spin'} />
          <span>{'Generating response...'}</span>
        </div>
      )}
    </div>
  );
});

ChatInput.displayName = 'ChatInput';

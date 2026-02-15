'use client';

import { BrainIcon, FolderIcon, Loader2Icon, SendIcon, SquareIcon } from 'lucide-react';
import {
  type ChangeEvent,
  type KeyboardEvent,
  memo,
  type RefObject,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { useChatStore } from '@/lib/stores/chat-store';
import { useFileExplorerStore } from '@/lib/stores/file-explorer-store';
import { cn } from '@/lib/utils';

import { ChatFileChips } from './chat-file-chips';
import { ChatMentionPopup } from './chat-mention-popup';
import { ChatModelSelector } from './chat-model-selector';

interface ChatInputProps {
  cwd?: string;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
  isStreaming: boolean;
  onCancel: () => void;
  onSend: (message: string) => void;
}

/**
 * Extract @-mention query from text at the cursor position.
 * Returns the query text after the last `@` before the cursor, or null if not in a mention.
 */
function extractMentionQuery(text: string, cursorPos: number): null | string {
  const beforeCursor = text.slice(0, cursorPos);
  const lastAtIndex = beforeCursor.lastIndexOf('@');
  if (lastAtIndex === -1) return null;

  // @ must be at start or preceded by whitespace
  if (lastAtIndex > 0 && !/\s/.test(beforeCursor[lastAtIndex - 1] ?? '')) return null;

  const query = beforeCursor.slice(lastAtIndex + 1);

  // No spaces allowed in the mention query (would mean user moved past the mention)
  if (/\s/.test(query)) return null;

  return query;
}

export const ChatInput = memo(({ cwd, inputRef, isStreaming, onCancel, onSend }: ChatInputProps) => {
  const [value, setValue] = useState('');
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = inputRef ?? internalRef;
  const {
    addMentionedFile,
    addToMessageHistory,
    isMentionPopupOpen,
    mentionedFiles,
    mentionQuery,
    messageHistory,
    reasoningLevel,
    removeMentionedFile,
    setIsMentionPopupOpen,
    setMentionQuery,
  } = useChatStore();
  const { selectedFiles: explorerSelectedFiles } = useFileExplorerStore();

  // Merge mentioned files from both sources (chat @-mentions + file explorer selections)
  const allAttachedFiles = useMemo(() => {
    const seen = new Set<string>();
    const merged: Array<{ relativePath: string }> = [];
    for (const f of mentionedFiles) {
      if (!seen.has(f.relativePath)) {
        seen.add(f.relativePath);
        merged.push(f);
      }
    }
    for (const f of explorerSelectedFiles) {
      if (!seen.has(f.relativePath)) {
        seen.add(f.relativePath);
        merged.push(f);
      }
    }
    return merged;
  }, [mentionedFiles, explorerSelectedFiles]);

  // Track local history index for navigation
  const [localHistoryIndex, setLocalHistoryIndex] = useState(-1);

  const handleRemoveFile = useCallback(
    (relativePath: string) => {
      // Remove from whichever store contains it
      removeMentionedFile(relativePath);
      useFileExplorerStore.getState().removeFileSelection(relativePath);
    },
    [removeMentionedFile]
  );

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    addToMessageHistory(trimmed);
    onSend(trimmed);
    setValue('');
    setLocalHistoryIndex(-1);
    setIsMentionPopupOpen(false);
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleMentionSelect = (relativePath: string) => {
    addMentionedFile(relativePath);

    // Replace the @query text in the textarea with nothing (the chip represents the file)
    const textarea = textareaRef.current;
    if (textarea) {
      const cursorPos = textarea.selectionStart;
      const beforeCursor = value.slice(0, cursorPos);
      const lastAtIndex = beforeCursor.lastIndexOf('@');
      if (lastAtIndex !== -1) {
        const newValue = value.slice(0, lastAtIndex) + value.slice(cursorPos);
        setValue(newValue);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Let the mention popup handle navigation keys when open
    if (isMentionPopupOpen && ['ArrowDown', 'ArrowUp', 'Enter', 'Escape', 'Tab'].includes(e.key)) {
      return; // The popup's document-level listener handles these
    }

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
  };

  const handleInput = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      setLocalHistoryIndex(-1);

      // Detect @-mention
      const cursorPos = e.target.selectionStart;
      const query = extractMentionQuery(newValue, cursorPos);
      if (query !== null) {
        setMentionQuery(query);
        setIsMentionPopupOpen(true);
      } else {
        setIsMentionPopupOpen(false);
      }

      // Auto-resize
      const textarea = e.target;
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    },
    [setMentionQuery, setIsMentionPopupOpen]
  );

  return (
    <div className={'border-t border-border bg-background p-4'}>
      {/* Skip link target */}
      <a className={'sr-only focus:not-sr-only'} href={'#chat-input'} id={'chat-input'}>
        {'Skip to chat input'}
      </a>

      {/* File chips (mentioned + explorer-selected files) */}
      <ChatFileChips files={allAttachedFiles} onRemove={handleRemoveFile} />

      <div className={'relative flex items-end gap-2'}>
        {/* @-mention popup */}
        {isMentionPopupOpen && (
          <ChatMentionPopup
            onClose={() => setIsMentionPopupOpen(false)}
            onSelect={handleMentionSelect}
            query={mentionQuery}
            repoPath={cwd}
          />
        )}

        <div className={'flex items-center gap-1'}>
          <ChatModelSelector />
          {reasoningLevel && (
            <span
              className={
                'flex items-center gap-0.5 rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-500'
              }
            >
              <BrainIcon className={'size-3'} />
              {reasoningLevel}
            </span>
          )}
        </div>

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
          placeholder={cwd ? 'Type a message... (@ to mention files)' : 'Type a message...'}
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
          {cwd && (
            <span className={'flex items-center gap-1'}>
              <Kbd>{'@'}</Kbd>
              {'mention file'}
            </span>
          )}
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

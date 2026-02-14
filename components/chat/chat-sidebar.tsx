'use client';

import {
  GitBranchIcon,
  MessageCircleIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from 'lucide-react';
import { type KeyboardEvent, memo, useCallback, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  useConversations,
  useDeleteConversation,
  useUpdateConversation,
} from '@/hooks/queries/use-chat';
import { useChatStore } from '@/lib/stores/chat-store';
import { cn } from '@/lib/utils';
import { groupConversationsByDate } from '@/lib/utils/chat';

interface ChatSidebarProps {
  onNewConversation: () => void;
  projectId: number;
}

/**
 * Skeleton loading state for sidebar items.
 */
function SidebarSkeleton() {
  return (
    <div className={'space-y-1 p-2'}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div className={'flex items-center gap-2 rounded-md px-3 py-2'} key={i}>
          <div className={'size-4 animate-pulse rounded-sm bg-muted'} />
          <div className={'h-4 flex-1 animate-pulse rounded-sm bg-muted'} />
        </div>
      ))}
    </div>
  );
}

export const ChatSidebar = memo(({ onNewConversation, projectId }: ChatSidebarProps) => {
  const { data: conversations = [], isLoading } = useConversations(projectId);
  const deleteConversation = useDeleteConversation(projectId);
  const updateConversation = useUpdateConversation();

  const {
    activeConversationId,
    isSidebarCollapsed,
    searchQuery,
    setActiveConversationId,
    setSearchQuery,
    toggleSidebar,
  } = useChatStore();

  const [renamingId, setRenamingId] = useState<null | number>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter((conv) => conv.title.toLowerCase().includes(query));
  }, [conversations, searchQuery]);

  // Group conversations by date
  const dateGroups = useMemo(
    () => groupConversationsByDate(filteredConversations),
    [filteredConversations]
  );

  const handleDelete = useCallback(
    async (id: number) => {
      await deleteConversation.mutateAsync(id);
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
    },
    [deleteConversation, activeConversationId, setActiveConversationId]
  );

  const handleDoubleClick = useCallback(
    (id: number, currentTitle: string) => {
      setRenamingId(id);
      setRenameValue(currentTitle);
      setTimeout(() => renameInputRef.current?.focus(), 0);
    },
    []
  );

  const handleRenameSubmit = useCallback(
    async (id: number) => {
      const trimmed = renameValue.trim();
      if (trimmed) {
        await updateConversation.mutateAsync({ data: { title: trimmed }, id });
      }
      setRenamingId(null);
    },
    [renameValue, updateConversation]
  );

  const handleRenameKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>, id: number) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        void handleRenameSubmit(id);
      } else if (e.key === 'Escape') {
        setRenamingId(null);
      }
    },
    [handleRenameSubmit]
  );

  if (isSidebarCollapsed) {
    return (
      <div className={'flex w-10 shrink-0 flex-col items-center border-r border-border bg-muted/30 pt-3 transition-all duration-200'}>
        <Button onClick={toggleSidebar} size={'icon-sm'} type={'button'} variant={'ghost'}>
          <PanelLeftOpenIcon className={'size-4'} />
        </Button>
      </div>
    );
  }

  return (
    <div className={'flex w-64 shrink-0 flex-col border-r border-border bg-muted/30 transition-all duration-200'}>
      {/* Header */}
      <div className={'flex items-center justify-between border-b border-border p-3'}>
        <h3 className={'text-sm font-medium'}>{'Conversations'}</h3>
        <div className={'flex items-center gap-1'}>
          <Button onClick={onNewConversation} size={'icon-sm'} type={'button'} variant={'ghost'}>
            <PlusIcon className={'size-4'} />
          </Button>
          <Button onClick={toggleSidebar} size={'icon-sm'} type={'button'} variant={'ghost'}>
            <PanelLeftCloseIcon className={'size-4'} />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className={'border-b border-border p-2'}>
        <div className={'relative'}>
          <SearchIcon className={'absolute top-1/2 left-2 size-3 -translate-y-1/2 text-muted-foreground'} />
          <input
            className={cn(
              'w-full rounded-md border border-border bg-transparent py-1.5 pr-2 pl-7 text-xs',
              'placeholder:text-muted-foreground',
              'focus:ring-1 focus:ring-accent focus:outline-none'
            )}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={'Search conversations...'}
            type={'text'}
            value={searchQuery}
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className={'flex-1 overflow-y-auto'} role={'listbox'}>
        {isLoading ? (
          <SidebarSkeleton />
        ) : conversations.length === 0 ? (
          <div className={'p-4 text-center text-xs text-muted-foreground'}>
            {'No conversations yet'}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className={'p-4 text-center text-xs text-muted-foreground'}>
            {'No matches found'}
          </div>
        ) : (
          dateGroups.map((group) => (
            <div key={group.label}>
              {/* Date group label */}
              <div className={'sticky top-0 z-10 bg-muted/30 px-3 py-1.5'}>
                <span className={'text-[10px] font-medium tracking-wider text-muted-foreground uppercase'}>{group.label}</span>
              </div>

              {/* Conversations in group */}
              {group.conversations.map((conv) => {
                const isActive = activeConversationId === conv.id;
                const isFork = 'parentConversationId' in conv && conv.parentConversationId !== null;
                const hasChildren = 'childCount' in conv && typeof conv.childCount === 'number' && conv.childCount > 0;

                return (
                  <div
                    aria-selected={isActive}
                    className={cn(
                      'group flex cursor-pointer items-center gap-2 border-b border-border/50 px-3 py-2',
                      'hover:bg-muted/50',
                      isActive && 'bg-muted',
                      isFork && 'pl-6'
                    )}
                    key={conv.id}
                    onClick={() => setActiveConversationId(conv.id)}
                    onDoubleClick={() => handleDoubleClick(conv.id, conv.title)}
                    role={'option'}
                  >
                    {/* Icon: fork indicator or message icon */}
                    {isFork ? (
                      <GitBranchIcon className={'size-4 shrink-0 text-muted-foreground'} />
                    ) : (
                      <MessageCircleIcon className={'size-4 shrink-0 text-muted-foreground'} />
                    )}

                    {/* Title or rename input */}
                    {renamingId === conv.id ? (
                      <input
                        className={cn(
                          'flex-1 rounded-sm border border-accent bg-background px-1 py-0.5 text-sm',
                          'focus:ring-1 focus:ring-accent focus:outline-none'
                        )}
                        onBlur={() => void handleRenameSubmit(conv.id)}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => handleRenameKeyDown(e, conv.id)}
                        ref={renameInputRef}
                        value={renameValue}
                      />
                    ) : (
                      <span className={'flex-1 truncate text-sm'}>{conv.title}</span>
                    )}

                    {/* Fork count badge */}
                    {hasChildren && (
                      <span className={'flex items-center gap-0.5 text-[10px] text-muted-foreground'}>
                        <GitBranchIcon className={'size-3'} />
                        {(conv as { childCount: number }).childCount}
                      </span>
                    )}

                    {/* Delete button */}
                    <Button
                      className={'size-6 opacity-0 group-hover:opacity-100'}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDelete(conv.id);
                      }}
                      size={'icon-sm'}
                      type={'button'}
                      variant={'ghost'}
                    >
                      <Trash2Icon className={'size-3'} />
                    </Button>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
});

ChatSidebar.displayName = 'ChatSidebar';

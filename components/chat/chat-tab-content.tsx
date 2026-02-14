'use client';

import { MessageCircleIcon, PlusIcon } from 'lucide-react';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ConversationMessage } from '@/types/electron';

import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ui/ai/conversation';
import { Button } from '@/components/ui/button';
import { useChatKeyboardShortcuts } from '@/hooks/chat/use-chat-keyboard-shortcuts';
import {
  useActiveMessages,
  useCompactConversation,
  useCreateConversation,
  useCreateMessage,
  useExportToNewChat,
  useForkConversation,
  useGenerateTitle,
  useRevertToMessage,
  useTokenEstimate,
  useUpdateConversation,
} from '@/hooks/queries/use-chat';
import { useRepositoriesByProject } from '@/hooks/queries/use-repositories';
import { useAgentStream } from '@/hooks/use-agent-stream';
import { useChatStore } from '@/lib/stores/chat-store';
import { extractBlocksFromStream, parseMessageBlocks } from '@/lib/utils/chat';

import { ChatCompactionBanner } from './chat-compaction-banner';
import { ChatCompactionDialog } from './chat-compaction-dialog';
import { ChatConversationStarters } from './chat-conversation-starters';
import { ChatErrorState } from './chat-error-state';
import { ChatExportToolbar } from './chat-export-toolbar';
import { ChatInput } from './chat-input';
import { ChatMessage } from './chat-message';
import { ChatPanelHeader } from './chat-panel-header';
import { ChatRevertDialog } from './chat-revert-dialog';
import { ChatSearchOverlay } from './chat-search-overlay';
import { ChatSidebar } from './chat-sidebar';
import { ChatStreamingMessage } from './chat-streaming-message';
import { ChatTableOfContents } from './chat-table-of-contents';

interface ChatTabContentProps {
  projectId: number;
}

const COMPACTION_TOKEN_THRESHOLD = 80_000;

/**
 * Format conversation history for inclusion in the agent prompt.
 */
function formatConversationHistory(messages: Array<ConversationMessage>): string {
  if (messages.length === 0) return '';
  const lines = messages.map((m) => `<message role="${m.role}">${m.content}</message>`);
  return `<conversation_history>\n${lines.join('\n')}\n</conversation_history>\n\n`;
}

/**
 * Generate a conversation title from the first user message.
 */
function generateTitle(message: string): string {
  const maxLength = 50;
  const trimmed = message.trim().replace(/\n/g, ' ');
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength)}...`;
}

export const ChatTabContent = ({ projectId }: ChatTabContentProps) => {
  const {
    activeConversationId,
    clearSelectedMessages,
    compactionNotificationDismissed,
    currentSearchMatchIndex,
    isSearchOpen,
    isSelectMode,
    isTocOpen,
    messageSearchQuery,
    searchMatchCount,
    selectedMessageIds,
    setActiveConversationId,
    setCompactionNotificationDismissed,
    setCurrentSearchMatchIndex,
    setIsSearchOpen,
    setIsSelectMode,
    setIsTocOpen,
    setMessageSearchQuery,
    setSearchMatchCount,
    toggleMessageSelection,
  } = useChatStore();

  const isFirstMessage = useRef(false);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Revert dialog state
  const [revertTarget, setRevertTarget] = useState<null | {
    affectedCount: number;
    content: string;
    messageId: number;
  }>(null);

  // Compaction dialog state
  const [isCompactionDialogOpen, setIsCompactionDialogOpen] = useState(false);

  // Data queries - use activeMessages (non-deleted) as primary source
  const { data: messages = [] } = useActiveMessages(activeConversationId);
  const { data: repositories = [] } = useRepositoriesByProject(projectId);
  const { data: tokenEstimate = 0 } = useTokenEstimate(activeConversationId);

  // Mutations
  const createConversation = useCreateConversation();
  const createMessage = useCreateMessage();
  const updateConversation = useUpdateConversation();
  const generateTitleMutation = useGenerateTitle();
  const forkConversation = useForkConversation();
  const revertToMessage = useRevertToMessage(activeConversationId ?? 0);
  const compactConversation = useCompactConversation(activeConversationId ?? 0, projectId);
  const exportToNewChat = useExportToNewChat();

  // Agent stream for AI responses
  const stream = useAgentStream();
  const isStreaming = stream.status === 'running' || stream.status === 'initializing';
  const isStreamError = stream.status === 'error';

  // Get the first repository's path as cwd for the agent
  const defaultCwd = repositories[0]?.path;

  // Parse messages into rich blocks
  const parsedMessages = useMemo(
    () => messages.map(parseMessageBlocks),
    [messages]
  );

  // Derived state
  const isEmptyConversation = messages.length === 0 && !isStreaming;
  const isShowCompactionBanner =
    tokenEstimate > COMPACTION_TOKEN_THRESHOLD &&
    !compactionNotificationDismissed &&
    !isCompactionDialogOpen;

  // Find current conversation title
  const currentConversationTitle = useMemo(() => {
    // Title comes from the conversation data, but we don't have it here.
    // Use the first user message as fallback.
    const firstUserMsg = messages.find((m) => m.role === 'user');
    return firstUserMsg ? generateTitle(firstUserMsg.content ?? '') : 'New Conversation';
  }, [messages]);

  // Search match tracking
  useEffect(() => {
    if (!messageSearchQuery || messageSearchQuery.length < 2) {
      setSearchMatchCount(0);
      return;
    }
    const query = messageSearchQuery.toLowerCase();
    let count = 0;
    for (const msg of messages) {
      if (msg.content && msg.content.toLowerCase().includes(query)) {
        count++;
      }
    }
    setSearchMatchCount(count);
  }, [messageSearchQuery, messages, setSearchMatchCount]);

  // Scroll to current search match
  useEffect(() => {
    if (searchMatchCount === 0 || !messageSearchQuery) return;
    const query = messageSearchQuery.toLowerCase();
    let matchIdx = 0;
    for (const msg of messages) {
      if (msg.content && msg.content.toLowerCase().includes(query)) {
        if (matchIdx === currentSearchMatchIndex) {
          const el = messageRefs.current.get(msg.id);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
        matchIdx++;
      }
    }
  }, [currentSearchMatchIndex, messageSearchQuery, messages, searchMatchCount]);

  // Save assistant response when stream completes
  useEffect(() => {
    if (stream.status === 'completed' && stream.text && activeConversationId) {
      const blocks = extractBlocksFromStream(stream.messages);
      createMessage.mutate({
        content: stream.text,
        conversationId: activeConversationId,
        metadata: blocks.length > 0 ? JSON.stringify(blocks) : null,
        role: 'assistant',
      });
      stream.reset();

      // Deferred AI title generation after first exchange
      if (isFirstMessage.current) {
        isFirstMessage.current = false;
        void generateTitleMutation.mutateAsync(activeConversationId);
      }
    }
  }, [stream.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts
  const handleNewConversation = useCallback(async () => {
    const conversation = await createConversation.mutateAsync({ projectId });
    setActiveConversationId(conversation.id);
    isFirstMessage.current = true;
    chatInputRef.current?.focus();
  }, [createConversation, projectId, setActiveConversationId]);

  const handleCancelStream = useCallback(async () => {
    try {
      await stream.cancel();
    } catch {
      // Ignore cancel errors
    }
  }, [stream]);

  useChatKeyboardShortcuts({
    chatInputRef,
    enabled: activeConversationId !== null,
    onCancelStream: handleCancelStream,
    onNewConversation: handleNewConversation,
  });

  const handleSend = useCallback(
    async (messageText: string) => {
      let conversationId = activeConversationId;

      if (!conversationId) {
        const conversation = await createConversation.mutateAsync({ projectId });
        conversationId = conversation.id;
        setActiveConversationId(conversationId);
        isFirstMessage.current = true;
      }

      // Save user message to DB
      await createMessage.mutateAsync({
        content: messageText,
        conversationId,
        role: 'user',
      });

      // Two-stage title: immediate substring, then deferred AI generation
      if (isFirstMessage.current) {
        await updateConversation.mutateAsync({
          data: { title: generateTitle(messageText) },
          id: conversationId,
        });
      }

      // Build prompt with conversation history
      const history = formatConversationHistory(messages);
      const prompt = `${history}${messageText}`;

      await stream.start({
        cwd: defaultCwd,
        prompt,
      });
    },
    [activeConversationId, createConversation, createMessage, updateConversation, messages, stream, defaultCwd, projectId, setActiveConversationId]
  );

  // Message action handlers
  const handleCopy = useCallback((content: string) => {
    void navigator.clipboard.writeText(content);
  }, []);

  const handleFork = useCallback(
    async (messageId: number) => {
      if (!activeConversationId) return;
      const result = await forkConversation.mutateAsync({
        forkPointMessageId: messageId,
        generateSummary: true,
        sourceConversationId: activeConversationId,
      });
      setActiveConversationId(result.id);
    },
    [activeConversationId, forkConversation, setActiveConversationId]
  );

  const handleRevert = useCallback(
    (messageId: number) => {
      const msgIndex = messages.findIndex((m) => m.id === messageId);
      if (msgIndex === -1) return;
      const affectedCount = messages.length - msgIndex - 1;
      const message = messages[msgIndex];
      if (!message) return;
      setRevertTarget({
        affectedCount,
        content: message.content ?? '',
        messageId,
      });
    },
    [messages]
  );

  const handleConfirmRevert = useCallback(async () => {
    if (!revertTarget) return;
    await revertToMessage.mutateAsync(revertTarget.messageId);
    setRevertTarget(null);
  }, [revertTarget, revertToMessage]);

  const handleCompact = useCallback(async () => {
    if (!activeConversationId) return;
    await compactConversation.mutateAsync({ conversationId: activeConversationId });
    setIsCompactionDialogOpen(false);
  }, [activeConversationId, compactConversation]);

  const handleExport = useCallback(async () => {
    if (!activeConversationId || selectedMessageIds.size === 0) return;
    const result = await exportToNewChat.mutateAsync({
      messageIds: Array.from(selectedMessageIds),
      projectId,
      sourceConversationId: activeConversationId,
    });
    clearSelectedMessages();
    setActiveConversationId(result.id);
  }, [activeConversationId, selectedMessageIds, exportToNewChat, projectId, clearSelectedMessages, setActiveConversationId]);

  const handleRetry = useCallback(() => {
    // Retry the last user message
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg?.content) {
      const history = formatConversationHistory(messages.slice(0, -1));
      const prompt = `${history}${lastUserMsg.content}`;
      void stream.start({ cwd: defaultCwd, prompt });
    }
  }, [messages, stream, defaultCwd]);

  const handleSearchNext = useCallback(() => {
    if (searchMatchCount === 0) return;
    setCurrentSearchMatchIndex((currentSearchMatchIndex + 1) % searchMatchCount);
  }, [searchMatchCount, currentSearchMatchIndex, setCurrentSearchMatchIndex]);

  const handleSearchPrev = useCallback(() => {
    if (searchMatchCount === 0) return;
    setCurrentSearchMatchIndex((currentSearchMatchIndex - 1 + searchMatchCount) % searchMatchCount);
  }, [searchMatchCount, currentSearchMatchIndex, setCurrentSearchMatchIndex]);

  const handleScrollToMessage = useCallback((messageId: number) => {
    const el = messageRefs.current.get(messageId);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  // Track which message is the current search match
  const currentMatchMessageId = useMemo(() => {
    if (searchMatchCount === 0 || !messageSearchQuery) return null;
    const query = messageSearchQuery.toLowerCase();
    let matchIdx = 0;
    for (const msg of messages) {
      if (msg.content && msg.content.toLowerCase().includes(query)) {
        if (matchIdx === currentSearchMatchIndex) return msg.id;
        matchIdx++;
      }
    }
    return null;
  }, [searchMatchCount, messageSearchQuery, messages, currentSearchMatchIndex]);

  return (
    <div className={'flex h-[calc(100vh-280px)] min-h-[400px] overflow-hidden rounded-lg border border-border'}>
      {/* Conversation sidebar */}
      <ChatSidebar onNewConversation={handleNewConversation} projectId={projectId} />

      {/* Chat panel */}
      <div className={'relative flex flex-1 flex-col'}>
        {activeConversationId ? (
          <Fragment>
            {/* Panel header */}
            <ChatPanelHeader
              isSelectMode={isSelectMode}
              onSearchToggle={() => setIsSearchOpen(!isSearchOpen)}
              onSelectMode={() => setIsSelectMode(!isSelectMode)}
              onTocToggle={() => setIsTocOpen(!isTocOpen)}
              title={currentConversationTitle}
              tokenEstimate={tokenEstimate}
            />

            {/* Compaction banner */}
            {isShowCompactionBanner && (
              <ChatCompactionBanner
                onCompact={() => setIsCompactionDialogOpen(true)}
                onDismiss={() => setCompactionNotificationDismissed(true)}
                tokenEstimate={tokenEstimate}
              />
            )}

            {/* Main content area with optional TOC */}
            <div className={'flex flex-1 overflow-hidden'}>
              {/* Messages area */}
              <Conversation className={'flex-1'}>
                {/* Search overlay */}
                {isSearchOpen && (
                  <ChatSearchOverlay
                    currentMatchIndex={currentSearchMatchIndex}
                    matchCount={searchMatchCount}
                    onClose={() => setIsSearchOpen(false)}
                    onNext={handleSearchNext}
                    onPrev={handleSearchPrev}
                    onSearchChange={setMessageSearchQuery}
                    searchQuery={messageSearchQuery}
                  />
                )}

                <ConversationContent className={'gap-4'}>
                  {parsedMessages.map((msg) => (
                    <ChatMessage
                      isCurrentMatch={currentMatchMessageId === msg.id}
                      isSelected={selectedMessageIds.has(msg.id)}
                      isSelectMode={isSelectMode}
                      key={msg.id}
                      message={msg}
                      onCopyMessage={handleCopy}
                      onFork={handleFork}
                      onRevert={handleRevert}
                      onToggleSelect={toggleMessageSelection}
                      ref={(el) => {
                        if (el) {
                          messageRefs.current.set(msg.id, el);
                        } else {
                          messageRefs.current.delete(msg.id);
                        }
                      }}
                      searchQuery={isSearchOpen ? messageSearchQuery : undefined}
                    />
                  ))}

                  {/* Streaming message */}
                  {isStreaming && <ChatStreamingMessage stream={stream} />}

                  {/* Stream error */}
                  {isStreamError && (
                    <ChatErrorState
                      error={stream.error ?? 'An unexpected error occurred'}
                      onRetry={handleRetry}
                    />
                  )}

                  {/* Empty state */}
                  {isEmptyConversation && (
                    <div className={'flex h-full flex-col items-center justify-center gap-4'}>
                      <div className={'text-center text-muted-foreground'}>
                        <MessageCircleIcon className={'mx-auto mb-2 size-8'} />
                        <p className={'text-sm'}>{'Send a message to start chatting'}</p>
                        {!defaultCwd && (
                          <p className={'mt-1 text-xs text-amber-500'}>
                            {'Add a repository to this project for best results'}
                          </p>
                        )}
                      </div>
                      <ChatConversationStarters onSelect={handleSend} />
                    </div>
                  )}
                </ConversationContent>
                <ConversationScrollButton />
              </Conversation>

              {/* Table of Contents panel */}
              {isTocOpen && (
                <ChatTableOfContents
                  messages={parsedMessages}
                  onClose={() => setIsTocOpen(false)}
                  onScrollToMessage={handleScrollToMessage}
                />
              )}
            </div>

            {/* Export toolbar (select mode) */}
            {isSelectMode && (
              <ChatExportToolbar
                isExporting={exportToNewChat.isPending}
                onCancel={() => clearSelectedMessages()}
                onExport={handleExport}
                selectedCount={selectedMessageIds.size}
              />
            )}

            {/* Input area */}
            <ChatInput
              cwd={defaultCwd}
              inputRef={chatInputRef}
              isStreaming={isStreaming}
              onCancel={handleCancelStream}
              onSend={handleSend}
            />

            {/* Streaming status (aria-live) */}
            <div aria-live={'polite'} className={'sr-only'}>
              {isStreaming ? 'Claude is generating a response' : ''}
            </div>
          </Fragment>
        ) : (
          <div className={'flex flex-1 items-center justify-center'}>
            <div className={'text-center text-muted-foreground'}>
              <MessageCircleIcon className={'mx-auto mb-3 size-10'} />
              <h3 className={'mb-1 text-sm font-medium'}>{'Project Chat'}</h3>
              <p className={'mb-4 text-xs'}>{'Chat directly with Claude Code about this project'}</p>
              <Button onClick={handleNewConversation} size={'sm'} type={'button'}>
                <PlusIcon className={'mr-2 size-4'} />
                {'New Conversation'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Revert confirmation dialog */}
      {revertTarget && (
        <ChatRevertDialog
          affectedCount={revertTarget.affectedCount}
          onCancel={() => setRevertTarget(null)}
          onConfirm={handleConfirmRevert}
          targetContent={revertTarget.content}
        />
      )}

      {/* Compaction dialog */}
      {isCompactionDialogOpen && (
        <ChatCompactionDialog
          isCompacting={compactConversation.isPending}
          messageCount={messages.length}
          onCancel={() => setIsCompactionDialogOpen(false)}
          onCompact={handleCompact}
          tokenEstimate={tokenEstimate}
        />
      )}
    </div>
  );
};

import { create } from 'zustand';

import type { Provider, ReasoningLevel } from '../constants/providers';

export interface ChatActions {
  addMentionedFile: (relativePath: string) => void;
  addToMessageHistory: (message: string) => void;
  clearMentionedFiles: () => void;
  clearSelectedMessages: () => void;
  removeMentionedFile: (relativePath: string) => void;
  reset: () => void;
  setActiveConversationId: (id: null | number) => void;
  setCompactionNotificationDismissed: (dismissed: boolean) => void;
  setCurrentSearchMatchIndex: (index: number) => void;
  setHoveredMessageId: (id: null | number) => void;
  setIsMentionPopupOpen: (open: boolean) => void;
  setIsSearchOpen: (open: boolean) => void;
  setIsSelectMode: (mode: boolean) => void;
  setIsTocOpen: (open: boolean) => void;
  setMentionQuery: (query: string) => void;
  setMessageSearchQuery: (query: string) => void;
  setReasoningLevel: (level: null | ReasoningLevel) => void;
  setSearchMatchCount: (count: number) => void;
  setSearchQuery: (query: string) => void;
  setSelectedModel: (model: string, provider: Provider) => void;
  toggleMessageSelection: (id: number) => void;
  toggleSidebar: () => void;
}

export interface ChatState {
  activeConversationId: null | number;
  compactionNotificationDismissed: boolean;
  currentSearchMatchIndex: number;
  historyIndex: number;
  hoveredMessageId: null | number;
  isMentionPopupOpen: boolean;
  isSearchOpen: boolean;
  isSelectMode: boolean;
  isSidebarCollapsed: boolean;
  isTocOpen: boolean;
  mentionedFiles: Array<{ relativePath: string }>;
  mentionQuery: string;
  messageHistory: Array<string>;
  messageSearchQuery: string;
  reasoningLevel: null | ReasoningLevel;
  searchMatchCount: number;
  searchQuery: string;
  selectedMessageIds: Set<number>;
  selectedModel: string;
  selectedProvider: Provider;
}

export type ChatStore = ChatActions & ChatState;

const MAX_HISTORY_SIZE = 50;

export const useChatStore = create<ChatStore>()((set) => ({
  activeConversationId: null,
  addMentionedFile: (relativePath: string) => {
    set((state) => {
      if (state.mentionedFiles.some((f) => f.relativePath === relativePath)) return state;
      return {
        isMentionPopupOpen: false,
        mentionedFiles: [...state.mentionedFiles, { relativePath }],
        mentionQuery: '',
      };
    });
  },
  addToMessageHistory: (message: string) => {
    set((state) => {
      const history = [message, ...state.messageHistory.filter((m) => m !== message)].slice(0, MAX_HISTORY_SIZE);
      return { historyIndex: -1, messageHistory: history };
    });
  },
  clearMentionedFiles: () => {
    set({ isMentionPopupOpen: false, mentionedFiles: [], mentionQuery: '' });
  },
  clearSelectedMessages: () => {
    set({ isSelectMode: false, selectedMessageIds: new Set() });
  },
  compactionNotificationDismissed: false,
  currentSearchMatchIndex: 0,
  historyIndex: -1,
  hoveredMessageId: null,
  isMentionPopupOpen: false,
  isSearchOpen: false,
  isSelectMode: false,
  isSidebarCollapsed: false,
  isTocOpen: false,
  mentionedFiles: [],
  mentionQuery: '',
  messageHistory: [],
  messageSearchQuery: '',
  reasoningLevel: null,
  removeMentionedFile: (relativePath: string) => {
    set((state) => ({
      mentionedFiles: state.mentionedFiles.filter((f) => f.relativePath !== relativePath),
    }));
  },
  reset: () => {
    set({
      activeConversationId: null,
      compactionNotificationDismissed: false,
      currentSearchMatchIndex: 0,
      historyIndex: -1,
      hoveredMessageId: null,
      isMentionPopupOpen: false,
      isSearchOpen: false,
      isSelectMode: false,
      isSidebarCollapsed: false,
      isTocOpen: false,
      mentionedFiles: [],
      mentionQuery: '',
      messageSearchQuery: '',
      reasoningLevel: null,
      searchMatchCount: 0,
      searchQuery: '',
      selectedMessageIds: new Set(),
      selectedModel: 'sonnet',
      selectedProvider: 'claude' as Provider,
    });
  },

  searchMatchCount: 0,

  searchQuery: '',

  selectedMessageIds: new Set<number>(),

  selectedModel: 'sonnet',

  selectedProvider: 'claude' as Provider,

  setActiveConversationId: (id: null | number) => {
    set({
      activeConversationId: id,
      compactionNotificationDismissed: false,
      currentSearchMatchIndex: 0,
      isSearchOpen: false,
      isSelectMode: false,
      messageSearchQuery: '',
      searchMatchCount: 0,
      selectedMessageIds: new Set(),
    });
  },

  setCompactionNotificationDismissed: (dismissed: boolean) => {
    set({ compactionNotificationDismissed: dismissed });
  },

  setCurrentSearchMatchIndex: (index: number) => {
    set({ currentSearchMatchIndex: index });
  },

  setHoveredMessageId: (id: null | number) => {
    set({ hoveredMessageId: id });
  },

  setIsMentionPopupOpen: (open: boolean) => {
    set({ isMentionPopupOpen: open, ...(!open ? { mentionQuery: '' } : {}) });
  },

  setIsSearchOpen: (open: boolean) => {
    set({
      isSearchOpen: open,
      ...(!open ? { currentSearchMatchIndex: 0, messageSearchQuery: '', searchMatchCount: 0 } : {}),
    });
  },

  setIsSelectMode: (mode: boolean) => {
    set({ isSelectMode: mode, ...(!mode ? { selectedMessageIds: new Set() } : {}) });
  },

  setIsTocOpen: (open: boolean) => {
    set({ isTocOpen: open });
  },

  setMentionQuery: (query: string) => {
    set({ mentionQuery: query });
  },

  setMessageSearchQuery: (query: string) => {
    set({ currentSearchMatchIndex: 0, messageSearchQuery: query });
  },

  setReasoningLevel: (level: null | ReasoningLevel) => {
    set({ reasoningLevel: level });
  },

  setSearchMatchCount: (count: number) => {
    set((state) => (state.searchMatchCount === count ? state : { searchMatchCount: count }));
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setSelectedModel: (model: string, provider: Provider) => {
    set({ reasoningLevel: null, selectedModel: model, selectedProvider: provider });
  },

  toggleMessageSelection: (id: number) => {
    set((state) => {
      const next = new Set(state.selectedMessageIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { selectedMessageIds: next };
    });
  },

  toggleSidebar: () => {
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed }));
  },
}));

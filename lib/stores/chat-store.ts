import { create } from 'zustand';

export interface ChatActions {
  addToMessageHistory: (message: string) => void;
  clearSelectedMessages: () => void;
  reset: () => void;
  setActiveConversationId: (id: null | number) => void;
  setCompactionNotificationDismissed: (dismissed: boolean) => void;
  setCurrentSearchMatchIndex: (index: number) => void;
  setHoveredMessageId: (id: null | number) => void;
  setIsSearchOpen: (open: boolean) => void;
  setIsSelectMode: (mode: boolean) => void;
  setIsTocOpen: (open: boolean) => void;
  setMessageSearchQuery: (query: string) => void;
  setSearchMatchCount: (count: number) => void;
  setSearchQuery: (query: string) => void;
  toggleMessageSelection: (id: number) => void;
  toggleSidebar: () => void;
}

export interface ChatState {
  activeConversationId: null | number;
  compactionNotificationDismissed: boolean;
  currentSearchMatchIndex: number;
  historyIndex: number;
  hoveredMessageId: null | number;
  isSearchOpen: boolean;
  isSelectMode: boolean;
  isSidebarCollapsed: boolean;
  isTocOpen: boolean;
  messageHistory: Array<string>;
  messageSearchQuery: string;
  searchMatchCount: number;
  searchQuery: string;
  selectedMessageIds: Set<number>;
}

export type ChatStore = ChatActions & ChatState;

const MAX_HISTORY_SIZE = 50;

export const useChatStore = create<ChatStore>()((set) => ({
  activeConversationId: null,
  addToMessageHistory: (message: string) => {
    set((state) => {
      const history = [message, ...state.messageHistory.filter((m) => m !== message)].slice(0, MAX_HISTORY_SIZE);
      return { historyIndex: -1, messageHistory: history };
    });
  },
  clearSelectedMessages: () => {
    set({ isSelectMode: false, selectedMessageIds: new Set() });
  },
  compactionNotificationDismissed: false,
  currentSearchMatchIndex: 0,
  historyIndex: -1,
  hoveredMessageId: null,
  isSearchOpen: false,
  isSelectMode: false,
  isSidebarCollapsed: false,
  isTocOpen: false,
  messageHistory: [],
  messageSearchQuery: '',
  reset: () => {
    set({
      activeConversationId: null,
      compactionNotificationDismissed: false,
      currentSearchMatchIndex: 0,
      historyIndex: -1,
      hoveredMessageId: null,
      isSearchOpen: false,
      isSelectMode: false,
      isSidebarCollapsed: false,
      isTocOpen: false,
      messageSearchQuery: '',
      searchMatchCount: 0,
      searchQuery: '',
      selectedMessageIds: new Set(),
    });
  },

  searchMatchCount: 0,

  searchQuery: '',

  selectedMessageIds: new Set<number>(),

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

  setIsSearchOpen: (open: boolean) => {
    set({ isSearchOpen: open, ...(!open ? { currentSearchMatchIndex: 0, messageSearchQuery: '', searchMatchCount: 0 } : {}) });
  },

  setIsSelectMode: (mode: boolean) => {
    set({ isSelectMode: mode, ...(!mode ? { selectedMessageIds: new Set() } : {}) });
  },

  setIsTocOpen: (open: boolean) => {
    set({ isTocOpen: open });
  },

  setMessageSearchQuery: (query: string) => {
    set({ currentSearchMatchIndex: 0, messageSearchQuery: query });
  },

  setSearchMatchCount: (count: number) => {
    set({ searchMatchCount: count });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
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

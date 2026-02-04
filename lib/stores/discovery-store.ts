import { create } from 'zustand';

/**
 * Action filter options for discovery files.
 */
export type DiscoveryActionFilter = 'all' | 'create' | 'delete' | 'modify' | 'reference';

/**
 * Discovery actions interface for modifying store state.
 */
export interface DiscoveryActions {
  /** Add a tool to the active tools list */
  addActiveTool: (tool: DiscoveryActiveTool) => void;
  /** Append text to the streaming text content */
  appendStreamingText: (text: string) => void;
  /** Clear all active tools */
  clearActiveTools: () => void;
  /** Remove a tool from the active tools list */
  removeActiveTool: (toolId: string) => void;
  /** Reset store to initial state */
  reset: () => void;
  /** Set error message */
  setError: (error: null | string) => void;
  /** Update all filters at once */
  setFilters: (filters: Partial<DiscoveryFilters>) => void;
  /** Set the current discovery phase */
  setPhase: (phase: DiscoveryPhase) => void;
  /** Update the search term */
  setSearchTerm: (term: string) => void;
  /** Set the session ID */
  setSessionId: (id: null | string) => void;
  /** Set streaming text content */
  setStreamingText: (text: string) => void;
}

/**
 * Active tool information during discovery.
 */
export interface DiscoveryActiveTool {
  /** Unique identifier for this tool execution */
  id: string;
  /** Display name of the tool */
  name: string;
  /** When the tool started executing */
  startedAt: Date;
}

/**
 * Filter state for discovery files.
 */
export interface DiscoveryFilters {
  /** Filter by action type */
  actionFilter: DiscoveryActionFilter;
  /** Filter by inclusion status */
  inclusionFilter: DiscoveryInclusionFilter;
  /** Filter by priority level */
  priorityFilter: DiscoveryPriorityFilter;
}

/**
 * Inclusion filter options for discovery files.
 */
export type DiscoveryInclusionFilter = 'all' | 'excluded' | 'included';

/**
 * Discovery phase states.
 */
export type DiscoveryPhase = 'complete' | 'error' | 'idle' | 'reviewing' | 'streaming';

/**
 * Priority filter options for discovery files.
 */
export type DiscoveryPriorityFilter = 'all' | 'High' | 'Low' | 'Medium';

/**
 * Discovery state interface for managing discovery step UI state.
 */
export interface DiscoveryState {
  /** Currently executing tools */
  activeTools: Array<DiscoveryActiveTool>;
  /** Error message if any */
  error: null | string;
  /** Filter settings for the file list */
  filters: DiscoveryFilters;
  /** Whether discovery is in streaming phase */
  isStreaming: boolean;
  /** Current phase of the discovery process */
  phase: DiscoveryPhase;
  /** Search term for filtering files */
  searchTerm: string;
  /** Current session ID for the discovery agent */
  sessionId: null | string;
  /** Current streaming text content */
  streamingText: string;
}

/**
 * Combined discovery store type for state and actions.
 */
export type DiscoveryStore = DiscoveryActions & DiscoveryState;

/**
 * Default filter values.
 */
const defaultFilters: DiscoveryFilters = {
  actionFilter: 'all',
  inclusionFilter: 'all',
  priorityFilter: 'all',
};

/**
 * Initial state for reset functionality.
 */
const initialState: DiscoveryState = {
  activeTools: [],
  error: null,
  filters: defaultFilters,
  isStreaming: false,
  phase: 'idle',
  searchTerm: '',
  sessionId: null,
  streamingText: '',
};

/**
 * Zustand store for managing discovery step UI state including streaming,
 * filters, and tool execution tracking.
 *
 * @example
 * ```tsx
 * function DiscoveryWorkspace() {
 *   const { phase, activeTools, filters, setFilters } = useDiscoveryStore();
 *
 *   return (
 *     <div>
 *       <StatusIndicator phase={phase} />
 *       <ActiveToolsPanel tools={activeTools} />
 *       <FilterBar
 *         filters={filters}
 *         onFilterChange={(newFilters) => setFilters(newFilters)}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export const useDiscoveryStore = create<DiscoveryStore>()((set) => ({
  ...initialState,

  addActiveTool: (tool: DiscoveryActiveTool) => {
    set((state) => ({
      activeTools: [...state.activeTools, tool],
    }));
  },

  appendStreamingText: (text: string) => {
    set((state) => ({
      streamingText: state.streamingText + text,
    }));
  },

  clearActiveTools: () => {
    set({ activeTools: [] });
  },

  removeActiveTool: (toolId: string) => {
    set((state) => ({
      activeTools: state.activeTools.filter((tool) => tool.id !== toolId),
    }));
  },

  reset: () => {
    set(initialState);
  },

  setError: (error: null | string) => {
    set({ error });
  },

  setFilters: (filters: Partial<DiscoveryFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  setPhase: (phase: DiscoveryPhase) => {
    set({
      isStreaming: phase === 'streaming',
      phase,
    });
  },

  setSearchTerm: (term: string) => {
    set({ searchTerm: term });
  },

  setSessionId: (id: null | string) => {
    set({ sessionId: id });
  },

  setStreamingText: (text: string) => {
    set({ streamingText: text });
  },
}));

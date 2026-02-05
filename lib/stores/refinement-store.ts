import { create } from 'zustand';

import type { RefinementOutcome, RefinementServicePhase } from '../../types/electron';

/**
 * Refinement actions interface for modifying store state.
 */
export interface RefinementActions {
  /** Add a tool to the active tools list */
  addTool: (tool: RefinementActiveTool) => void;
  /** Append text to the streaming text content */
  appendText: (text: string) => void;
  /** Append to a thinking block */
  appendThinking: (blockIndex: number, delta: string) => void;
  /** Remove a tool from the active tools list and add to history */
  removeTool: (toolId: string) => void;
  /** Reset store to initial state */
  reset: () => void;
  /** Set the agent name */
  setAgentName: (name: string) => void;
  /** Set error message */
  setError: (error: null | string) => void;
  /** Set extended thinking elapsed time */
  setExtendedThinkingElapsedMs: (elapsedMs: number | undefined) => void;
  /** Set max thinking tokens budget */
  setMaxThinkingTokens: (maxTokens: null | number) => void;
  /** Set the refinement outcome */
  setOutcome: (outcome: null | RefinementOutcome) => void;
  /** Start a new session */
  startSession: (sessionId: string) => void;
  /** Start a new thinking block */
  startThinkingBlock: (blockIndex: number) => void;
  /** Update the current phase */
  updatePhase: (phase: RefinementServicePhase) => void;
  /** Update a tool's input */
  updateToolInput: (toolId: string, toolInput: Record<string, unknown>) => void;
}

/**
 * Active tool information during refinement.
 */
export interface RefinementActiveTool {
  /** Unique identifier for this tool execution (toolUseId) */
  id: string;
  /** Display name of the tool */
  name: string;
  /** When the tool started executing */
  startedAt: Date;
  /** Current tool input parameters */
  toolInput: Record<string, unknown>;
}

/**
 * Refinement state interface for managing refinement step UI state.
 */
export interface RefinementState {
  /** Currently executing tools */
  activeTools: Array<RefinementActiveTool>;
  /** Agent name for display */
  agentName: string;
  /** Error message if any */
  error: null | string;
  /** Elapsed time in extended thinking mode */
  extendedThinkingElapsedMs: number | undefined;
  /** Whether refinement is in streaming phase */
  isStreaming: boolean;
  /** Maximum thinking tokens budget */
  maxThinkingTokens: null | number;
  /** Final outcome of the refinement process */
  outcome: null | RefinementOutcome;
  /** Current phase of the refinement process */
  phase: RefinementServicePhase;
  /** Current session ID for the refinement agent */
  sessionId: null | string;
  /** Current streaming text content */
  text: string;
  /** Array of thinking block contents */
  thinking: Array<string>;
  /** History of completed tools */
  toolHistory: Array<RefinementActiveTool>;
}

/**
 * Combined refinement store type for state and actions.
 */
export type RefinementStore = RefinementActions & RefinementState;

/**
 * Initial state for reset functionality.
 */
const initialState: RefinementState = {
  activeTools: [],
  agentName: '',
  error: null,
  extendedThinkingElapsedMs: undefined,
  isStreaming: false,
  maxThinkingTokens: null,
  outcome: null,
  phase: 'idle',
  sessionId: null,
  text: '',
  thinking: [],
  toolHistory: [],
};

/**
 * Zustand store for managing refinement step UI state including streaming,
 * tool execution tracking, and thinking content.
 *
 * @example
 * ```tsx
 * function RefinementWorkspace() {
 *   const { phase, activeTools, text, thinking, startSession, updatePhase } = useRefinementStore();
 *
 *   return (
 *     <div>
 *       <StatusIndicator phase={phase} />
 *       <ActiveToolsPanel tools={activeTools} />
 *       <StreamingContent text={text} thinking={thinking} />
 *     </div>
 *   );
 * }
 * ```
 */
export const useRefinementStore = create<RefinementStore>()((set) => ({
  ...initialState,

  addTool: (tool: RefinementActiveTool) => {
    set((state) => ({
      activeTools: [...state.activeTools, tool],
    }));
  },

  appendText: (delta: string) => {
    set((state) => ({
      text: state.text + delta,
    }));
  },

  appendThinking: (blockIndex: number, delta: string) => {
    set((state) => {
      const newThinking = [...state.thinking];
      // Ensure the array has enough elements
      while (newThinking.length <= blockIndex) {
        newThinking.push('');
      }
      newThinking[blockIndex] = (newThinking[blockIndex] || '') + delta;
      return { thinking: newThinking };
    });
  },

  removeTool: (toolId: string) => {
    set((state) => {
      const tool = state.activeTools.find((t) => t.id === toolId);
      return {
        activeTools: state.activeTools.filter((t) => t.id !== toolId),
        toolHistory: tool ? [...state.toolHistory, tool] : state.toolHistory,
      };
    });
  },

  reset: () => {
    set(initialState);
  },

  setAgentName: (name: string) => {
    set({ agentName: name });
  },

  setError: (error: null | string) => {
    set({ error });
  },

  setExtendedThinkingElapsedMs: (elapsedMs: number | undefined) => {
    set({ extendedThinkingElapsedMs: elapsedMs });
  },

  setMaxThinkingTokens: (maxTokens: null | number) => {
    set({ maxThinkingTokens: maxTokens });
  },

  setOutcome: (outcome: null | RefinementOutcome) => {
    set({ outcome });
  },

  startSession: (sessionId: string) => {
    set({
      ...initialState,
      isStreaming: true,
      phase: 'loading_agent',
      sessionId,
    });
  },

  startThinkingBlock: (blockIndex: number) => {
    set((state) => {
      const newThinking = [...state.thinking];
      // Ensure the array has enough elements
      while (newThinking.length <= blockIndex) {
        newThinking.push('');
      }
      return { thinking: newThinking };
    });
  },

  updatePhase: (phase: RefinementServicePhase) => {
    const isStreamingPhase =
      phase === 'executing' || phase === 'executing_extended_thinking' || phase === 'loading_agent';
    set({
      isStreaming: isStreamingPhase,
      phase,
    });
  },

  updateToolInput: (toolId: string, toolInput: Record<string, unknown>) => {
    set((state) => ({
      activeTools: state.activeTools.map((tool) => (tool.id === toolId ? { ...tool, toolInput } : tool)),
    }));
  },
}));

import { create } from 'zustand';

import type { ClarificationOutcome, ClarificationServicePhase } from '../validations/clarification';

/**
 * Clarification actions interface for modifying store state.
 */
export interface ClarificationActions {
  /** Add a tool to the active tools list */
  addTool: (tool: ClarificationActiveTool) => void;
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
  /** Set the clarification outcome */
  setOutcome: (outcome: ClarificationOutcome | null) => void;
  /** Start a new session */
  startSession: (sessionId: string) => void;
  /** Start a new thinking block */
  startThinkingBlock: (blockIndex: number) => void;
  /** Update the current phase */
  updatePhase: (phase: ClarificationServicePhase) => void;
  /** Update a tool's input */
  updateToolInput: (toolId: string, toolInput: Record<string, unknown>) => void;
}

/**
 * Active tool information during clarification.
 */
export interface ClarificationActiveTool {
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
 * Clarification state interface for managing clarification step UI state.
 */
export interface ClarificationState {
  /** Currently executing tools */
  activeTools: Array<ClarificationActiveTool>;
  /** Agent name for display */
  agentName: string;
  /** Error message if any */
  error: null | string;
  /** Elapsed time in extended thinking mode */
  extendedThinkingElapsedMs: number | undefined;
  /** Whether clarification is in streaming phase */
  isStreaming: boolean;
  /** Maximum thinking tokens budget */
  maxThinkingTokens: null | number;
  /** Final outcome of the clarification process */
  outcome: ClarificationOutcome | null;
  /** Current phase of the clarification process */
  phase: ClarificationServicePhase;
  /** Current session ID for the clarification agent */
  sessionId: null | string;
  /** Current streaming text content */
  text: string;
  /** Array of thinking block contents */
  thinking: Array<string>;
  /** History of completed tools */
  toolHistory: Array<ClarificationActiveTool>;
}

/**
 * Combined clarification store type for state and actions.
 */
export type ClarificationStore = ClarificationActions & ClarificationState;

/**
 * Initial state for reset functionality.
 */
const initialState: ClarificationState = {
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
 * Zustand store for managing clarification step UI state including streaming,
 * tool execution tracking, and thinking content.
 *
 * @example
 * ```tsx
 * function ClarificationWorkspace() {
 *   const { phase, activeTools, text, thinking, startSession, updatePhase } = useClarificationStore();
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
export const useClarificationStore = create<ClarificationStore>()((set) => ({
  ...initialState,

  addTool: (tool: ClarificationActiveTool) => {
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

  setOutcome: (outcome: ClarificationOutcome | null) => {
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

  updatePhase: (phase: ClarificationServicePhase) => {
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

import { create } from 'zustand';

import type { ClarificationAnswer } from '../validations/clarification';

import {
  DEFAULT_WORKFLOW_DETAIL_ACTIVE_STREAMING_TAB,
  DEFAULT_WORKFLOW_DETAIL_EXPANDED_STEPS,
  DEFAULT_WORKFLOW_DETAIL_STREAMING_PANEL_COLLAPSED,
  DEFAULT_WORKFLOW_DETAIL_STREAMING_PANEL_HEIGHT,
  WORKFLOW_DETAIL_ACTIVE_STREAMING_TAB_STORAGE_KEY,
  WORKFLOW_DETAIL_EXPANDED_STEPS_STORAGE_KEY,
  WORKFLOW_DETAIL_STREAMING_PANEL_COLLAPSED_STORAGE_KEY,
  WORKFLOW_DETAIL_STREAMING_PANEL_HEIGHT_STORAGE_KEY,
} from '../layout/constants';

/**
 * Workflow detail actions interface for modifying store state.
 */
export interface WorkflowDetailActions {
  /** Clear all clarification draft answers */
  clearClarificationDraftAnswers: () => void;
  /** Remove a single clarification draft answer by question index */
  removeClarificationDraftAnswer: (questionIndex: string) => void;
  /** Reset store to initial state */
  reset: () => void;
  /** Set the active streaming tab */
  setActiveStreamingTab: (tab: WorkflowDetailStepTab) => void;
  /** Set the active clarification version index */
  setClarificationActiveVersion: (version: number) => void;
  /** Set a single clarification draft answer by question index */
  setClarificationDraftAnswer: (questionIndex: string, answer: ClarificationAnswer) => void;
  /** Set whether to keep existing questions when re-running clarification */
  setClarificationKeepExistingQuestions: (keep: boolean) => void;
  /** Set the rerun guidance text for clarification */
  setClarificationRerunGuidance: (guidance: string) => void;
  /** Set the selected agent override for clarification */
  setClarificationSelectedAgentId: (agentId: null | number) => void;
  /** Set the expanded steps */
  setExpandedSteps: (steps: Array<string>) => void;
  /** Set whether the streaming panel is collapsed */
  setStreamingPanelCollapsed: (isCollapsed: boolean) => void;
  /** Set the streaming panel height */
  setStreamingPanelHeight: (height: number) => void;
  /** Toggle a step's expanded/collapsed state */
  toggleStep: (stepId: string) => void;
  /** Toggle the streaming panel collapsed state */
  toggleStreamingPanel: () => void;
}

/**
 * Workflow detail state interface for managing workflow detail page UI preferences.
 */
export interface WorkflowDetailState {
  /** The currently active streaming tab */
  activeStreamingTab: WorkflowDetailStepTab;
  /** The currently active clarification version index */
  clarificationActiveVersion: number;
  /** Draft answers for clarification questions, keyed by question index */
  clarificationDraftAnswers: Record<string, ClarificationAnswer>;
  /** Whether to keep existing questions when re-running clarification */
  clarificationKeepExistingQuestions: boolean;
  /** Rerun guidance text for the clarification step */
  clarificationRerunGuidance: string;
  /** The selected agent override ID for clarification (null uses default) */
  clarificationSelectedAgentId: null | number;
  /** Array of step identifiers that are currently expanded */
  expandedSteps: Array<string>;
  /** Whether the streaming panel is collapsed */
  isStreamingPanelCollapsed: boolean;
  /** Height of the streaming panel in pixels */
  streamingPanelHeight: number;
}

/**
 * Step tab type for the workflow detail streaming panel.
 */
export type WorkflowDetailStepTab = 'clarification' | 'discovery' | 'planning' | 'refinement';

/**
 * Combined workflow detail store type for state and actions.
 */
export type WorkflowDetailStore = WorkflowDetailActions & WorkflowDetailState;

/**
 * Initial state for reset functionality.
 */
const initialState: WorkflowDetailState = {
  activeStreamingTab: DEFAULT_WORKFLOW_DETAIL_ACTIVE_STREAMING_TAB,
  clarificationActiveVersion: 0,
  clarificationDraftAnswers: {},
  clarificationKeepExistingQuestions: false,
  clarificationRerunGuidance: '',
  clarificationSelectedAgentId: null,
  expandedSteps: DEFAULT_WORKFLOW_DETAIL_EXPANDED_STEPS,
  isStreamingPanelCollapsed: DEFAULT_WORKFLOW_DETAIL_STREAMING_PANEL_COLLAPSED,
  streamingPanelHeight: DEFAULT_WORKFLOW_DETAIL_STREAMING_PANEL_HEIGHT,
};

/**
 * Helper to persist a value to electron-store via IPC.
 */
function persistToElectronStore<T>(key: string, value: T): void {
  if (typeof window !== 'undefined' && window.electronAPI?.store) {
    window.electronAPI.store.set(key, value);
  }
}

/**
 * Zustand store for managing workflow detail page UI preferences
 * including streaming panel state, active tab, and expanded steps.
 *
 * @example
 * ```tsx
 * function WorkflowDetailPanel() {
 *   const { isStreamingPanelCollapsed, toggleStreamingPanel, activeStreamingTab, setActiveStreamingTab } =
 *     useWorkflowDetailStore();
 *
 *   return (
 *     <div>
 *       <button onClick={toggleStreamingPanel}>
 *         {isStreamingPanelCollapsed ? 'Expand' : 'Collapse'}
 *       </button>
 *       <TabList value={activeStreamingTab} onValueChange={setActiveStreamingTab}>
 *         <Tab value="clarification">Clarification</Tab>
 *         <Tab value="refinement">Refinement</Tab>
 *         <Tab value="discovery">Discovery</Tab>
 *         <Tab value="planning">Planning</Tab>
 *       </TabList>
 *     </div>
 *   );
 * }
 * ```
 */
export const useWorkflowDetailStore = create<WorkflowDetailStore>()((set) => ({
  ...initialState,

  clearClarificationDraftAnswers: () => {
    set({ clarificationDraftAnswers: {} });
  },

  removeClarificationDraftAnswer: (questionIndex: string) => {
    set((state) => {
      const { [questionIndex]: _, ...rest } = state.clarificationDraftAnswers;
      return { clarificationDraftAnswers: rest };
    });
  },

  reset: () => {
    set(initialState);

    // Persist all default values
    persistToElectronStore(WORKFLOW_DETAIL_ACTIVE_STREAMING_TAB_STORAGE_KEY, initialState.activeStreamingTab);
    persistToElectronStore(WORKFLOW_DETAIL_EXPANDED_STEPS_STORAGE_KEY, initialState.expandedSteps);
    persistToElectronStore(
      WORKFLOW_DETAIL_STREAMING_PANEL_COLLAPSED_STORAGE_KEY,
      initialState.isStreamingPanelCollapsed
    );
    persistToElectronStore(WORKFLOW_DETAIL_STREAMING_PANEL_HEIGHT_STORAGE_KEY, initialState.streamingPanelHeight);
  },

  setActiveStreamingTab: (tab: WorkflowDetailStepTab) => {
    set({ activeStreamingTab: tab });
    persistToElectronStore(WORKFLOW_DETAIL_ACTIVE_STREAMING_TAB_STORAGE_KEY, tab);
  },

  setClarificationActiveVersion: (version: number) => {
    set({ clarificationActiveVersion: version });
  },

  setClarificationDraftAnswer: (questionIndex: string, answer: ClarificationAnswer) => {
    set((state) => ({
      clarificationDraftAnswers: {
        ...state.clarificationDraftAnswers,
        [questionIndex]: answer,
      },
    }));
  },

  setClarificationKeepExistingQuestions: (keep: boolean) => {
    set({ clarificationKeepExistingQuestions: keep });
  },

  setClarificationRerunGuidance: (guidance: string) => {
    set({ clarificationRerunGuidance: guidance });
  },

  setClarificationSelectedAgentId: (agentId: null | number) => {
    set({ clarificationSelectedAgentId: agentId });
  },

  setExpandedSteps: (steps: Array<string>) => {
    set({ expandedSteps: steps });
    persistToElectronStore(WORKFLOW_DETAIL_EXPANDED_STEPS_STORAGE_KEY, steps);
  },

  setStreamingPanelCollapsed: (isCollapsed: boolean) => {
    set({ isStreamingPanelCollapsed: isCollapsed });
    persistToElectronStore(WORKFLOW_DETAIL_STREAMING_PANEL_COLLAPSED_STORAGE_KEY, isCollapsed);
  },

  setStreamingPanelHeight: (height: number) => {
    set({ streamingPanelHeight: height });
    persistToElectronStore(WORKFLOW_DETAIL_STREAMING_PANEL_HEIGHT_STORAGE_KEY, height);
  },

  toggleStep: (stepId: string) => {
    set((state) => {
      const newExpandedSteps = state.expandedSteps.includes(stepId)
        ? state.expandedSteps.filter((id) => id !== stepId)
        : [...state.expandedSteps, stepId];
      persistToElectronStore(WORKFLOW_DETAIL_EXPANDED_STEPS_STORAGE_KEY, newExpandedSteps);
      return { expandedSteps: newExpandedSteps };
    });
  },

  toggleStreamingPanel: () => {
    set((state) => {
      const newCollapsed = !state.isStreamingPanelCollapsed;
      persistToElectronStore(WORKFLOW_DETAIL_STREAMING_PANEL_COLLAPSED_STORAGE_KEY, newCollapsed);
      return { isStreamingPanelCollapsed: newCollapsed };
    });
  },
}));

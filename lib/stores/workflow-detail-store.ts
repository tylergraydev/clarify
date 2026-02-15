import { create } from 'zustand';

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
import {
  type ClarificationSlice,
  clarificationSliceInitialState,
  type ClarificationSliceState,
  createClarificationSlice,
} from './clarification-slice';
import {
  createPlanningSlice,
  type PlanningSlice,
  planningSliceInitialState,
  type PlanningSliceState,
} from './planning-slice';

/**
 * Workflow detail actions interface for modifying store state.
 */
export interface WorkflowDetailActions {
  /** Reset store to initial state */
  reset: () => void;
  /** Set the active streaming tab */
  setActiveStreamingTab: (tab: WorkflowDetailStepTab) => void;
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
export type WorkflowDetailStepTab = 'changes' | 'clarification' | 'discovery' | 'planning' | 'refinement';

/**
 * Combined workflow detail store type for state, actions, and slices.
 */
export type WorkflowDetailStore = ClarificationSlice & PlanningSlice & WorkflowDetailActions & WorkflowDetailState;

/**
 * Initial state for reset functionality.
 */
const initialState: ClarificationSliceState & PlanningSliceState & WorkflowDetailState = {
  ...clarificationSliceInitialState,
  ...planningSliceInitialState,
  activeStreamingTab: DEFAULT_WORKFLOW_DETAIL_ACTIVE_STREAMING_TAB,
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
  ...createClarificationSlice(set as Parameters<typeof createClarificationSlice>[0]),
  ...createPlanningSlice(set as Parameters<typeof createPlanningSlice>[0]),

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

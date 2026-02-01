import { create } from 'zustand';

/**
 * Pipeline actions interface for modifying pipeline UI state.
 */
export interface PipelineActions {
  /** Collapse all steps (set expandedStepId to null) */
  collapseAll: () => void;
  /** Reset store to initial state */
  reset: () => void;
  /** Set a specific step as expanded (or null to collapse all) */
  setExpandedStep: (stepId: null | number) => void;
  /** Toggle a step's expanded state */
  toggleStep: (stepId: number) => void;
}

/**
 * Pipeline state interface for managing pipeline UI state.
 */
export interface PipelineState {
  /** The currently active step type being displayed */
  activeStepType: PipelineStepType;
  /** The ID of the currently expanded step, or null if none expanded */
  expandedStepId: null | number;
  /** Whether an animation is currently in progress */
  isAnimating: boolean;
}

/**
 * Step types that can be displayed in the pipeline.
 */
export type PipelineStepType = 'implementation' | 'planning';

/**
 * Combined pipeline store type for state and actions.
 */
export type PipelineStore = PipelineActions & PipelineState;

/**
 * Initial state for reset functionality.
 */
const initialState: PipelineState = {
  activeStepType: 'planning',
  expandedStepId: null,
  isAnimating: false,
};

/**
 * Zustand store for managing pipeline UI state including which step
 * is expanded and animation states.
 *
 * @example
 * ```tsx
 * function PipelineStep({ stepId }: { stepId: number }) {
 *   const { expandedStepId, toggleStep } = usePipelineStore();
 *   const isExpanded = expandedStepId === stepId;
 *
 *   return (
 *     <div data-expanded={isExpanded}>
 *       <button onClick={() => toggleStep(stepId)}>
 *         {isExpanded ? 'Collapse' : 'Expand'}
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export const usePipelineStore = create<PipelineStore>()((set) => ({
  ...initialState,

  collapseAll: () => {
    set({ expandedStepId: null });
  },

  reset: () => {
    set(initialState);
  },

  setExpandedStep: (stepId: null | number) => {
    set({ expandedStepId: stepId });
  },

  toggleStep: (stepId: number) => {
    set((state) => ({
      expandedStepId: state.expandedStepId === stepId ? null : stepId,
    }));
  },
}));

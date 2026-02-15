import type { ImplementationPlan } from '../validations/planning';

/**
 * Combined planning slice type.
 */
export type PlanningSlice = PlanningSliceActions & PlanningSliceState;

/**
 * Planning-specific actions for the workflow detail store.
 */
export interface PlanningSliceActions {
  /** Clear all planning draft state */
  clearPlanningState: () => void;
  /** Set the active planning iteration version index */
  setPlanningActiveVersion: (version: number) => void;
  /** Set the draft edited plan */
  setPlanningEditedPlan: (plan: ImplementationPlan | null) => void;
  /** Set the draft feedback textarea content */
  setPlanningFeedbackText: (text: string) => void;
  /** Set whether the user is in direct edit mode */
  setPlanningIsEditing: (isEditing: boolean) => void;
  /** Set the selected agent override for planning */
  setPlanningSelectedAgentId: (agentId: null | number) => void;
  /** Set the selected plan step index in detail view */
  setPlanningSelectedStepIndex: (index: number) => void;
}

/**
 * Planning-specific state for the workflow detail store.
 */
export interface PlanningSliceState {
  /** The currently active planning iteration version index */
  planningActiveVersion: number;
  /** Draft edited plan when in edit mode */
  planningEditedPlan: ImplementationPlan | null;
  /** Draft feedback textarea content */
  planningFeedbackText: string;
  /** Whether the user is in direct edit mode */
  planningIsEditing: boolean;
  /** The selected agent override ID for planning (null uses default) */
  planningSelectedAgentId: null | number;
  /** The selected plan step index in the detail view */
  planningSelectedStepIndex: number;
}

/**
 * Initial state for the planning slice.
 */
export const planningSliceInitialState: PlanningSliceState = {
  planningActiveVersion: 0,
  planningEditedPlan: null,
  planningFeedbackText: '',
  planningIsEditing: false,
  planningSelectedAgentId: null,
  planningSelectedStepIndex: 0,
};

/**
 * Create the planning slice for the workflow detail store.
 */
export function createPlanningSlice(
  set: (partial: ((state: PlanningSliceState) => Partial<PlanningSliceState>) | Partial<PlanningSliceState>) => void
): PlanningSliceActions {
  return {
    clearPlanningState: () => {
      set(planningSliceInitialState);
    },

    setPlanningActiveVersion: (version: number) => {
      set({ planningActiveVersion: version });
    },

    setPlanningEditedPlan: (plan: ImplementationPlan | null) => {
      set({ planningEditedPlan: plan });
    },

    setPlanningFeedbackText: (text: string) => {
      set({ planningFeedbackText: text });
    },

    setPlanningIsEditing: (isEditing: boolean) => {
      set({ planningIsEditing: isEditing });
    },

    setPlanningSelectedAgentId: (agentId: null | number) => {
      set({ planningSelectedAgentId: agentId });
    },

    setPlanningSelectedStepIndex: (index: number) => {
      set({ planningSelectedStepIndex: index });
    },
  };
}

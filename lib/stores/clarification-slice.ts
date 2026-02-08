import type { ClarificationAnswer } from '../validations/clarification';

/**
 * Combined clarification slice type.
 */
export type ClarificationSlice = ClarificationSliceActions & ClarificationSliceState;

/**
 * Clarification-specific actions for the workflow detail store.
 */
export interface ClarificationSliceActions {
  /** Clear all clarification draft answers */
  clearClarificationDraftAnswers: () => void;
  /** Remove a single clarification draft answer by question index */
  removeClarificationDraftAnswer: (questionIndex: string) => void;
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
}

/**
 * Clarification-specific state for the workflow detail store.
 */
export interface ClarificationSliceState {
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
}

/**
 * Initial state for the clarification slice.
 */
export const clarificationSliceInitialState: ClarificationSliceState = {
  clarificationActiveVersion: 0,
  clarificationDraftAnswers: {},
  clarificationKeepExistingQuestions: false,
  clarificationRerunGuidance: '',
  clarificationSelectedAgentId: null,
};

/**
 * Create the clarification slice for the workflow detail store.
 */
export function createClarificationSlice(
  set: (partial: ((state: ClarificationSliceState) => Partial<ClarificationSliceState>) | Partial<ClarificationSliceState>) => void
): ClarificationSliceActions {
  return {
    clearClarificationDraftAnswers: () => {
      set({ clarificationDraftAnswers: {} });
    },

    removeClarificationDraftAnswer: (questionIndex: string) => {
      set((state) => {
        const { [questionIndex]: _, ...rest } = state.clarificationDraftAnswers;
        return { clarificationDraftAnswers: rest };
      });
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
  };
}

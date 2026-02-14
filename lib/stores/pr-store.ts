import { create } from 'zustand';

/**
 * Active tab in the PR detail view.
 */
export type PrDetailTab = 'changes' | 'checks' | 'comments' | 'deployments' | 'overview';

export type PrStore = PrStoreActions & PrStoreState;

/**
 * PR store actions.
 */
export interface PrStoreActions {
  reset: () => void;
  setActiveTab: (tab: PrDetailTab) => void;
  setSelectedPrNumber: (prNumber: null | number) => void;
}

/**
 * PR store state.
 */
export interface PrStoreState {
  activeTab: PrDetailTab;
  selectedPrNumber: null | number;
}

const initialState: PrStoreState = {
  activeTab: 'overview',
  selectedPrNumber: null,
};

export const usePrStore = create<PrStore>()((set) => ({
  ...initialState,

  reset: () => {
    set(initialState);
  },

  setActiveTab: (tab: PrDetailTab) => {
    set({ activeTab: tab });
  },

  setSelectedPrNumber: (prNumber: null | number) => {
    set({ selectedPrNumber: prNumber });
  },
}));

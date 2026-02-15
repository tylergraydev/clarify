import { create } from 'zustand';

import type { PendingDialogId } from '@/lib/command-palette/types';

export interface CommandPaletteActions {
  close: () => void;
  open: () => void;
  setPendingDialog: (id: null | PendingDialogId) => void;
  toggle: () => void;
}

export interface CommandPaletteState {
  isOpen: boolean;
  pendingDialog: null | PendingDialogId;
}

export type CommandPaletteStore = CommandPaletteActions & CommandPaletteState;

export const useCommandPaletteStore = create<CommandPaletteStore>()((set) => ({
  close: () => set({ isOpen: false }),
  isOpen: false,
  open: () => set({ isOpen: true }),
  pendingDialog: null,
  setPendingDialog: (id: null | PendingDialogId) => set({ pendingDialog: id }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));

'use client';

import { type Dispatch, useCallback, useReducer } from 'react';

import type { AgentWithRelations } from '@/components/agents/agent-table';
import type { ParsedAgentMarkdown } from '@/lib/utils/agent-markdown';
import type { AgentImportValidationResult } from '@/lib/validations/agent-import';

// ============================================================================
// Types
// ============================================================================

/**
 * State for the delete confirmation dialog.
 */
export interface DeleteDialogState {
  agent: AgentWithRelations | null;
  isOpen: boolean;
}

/**
 * Action types for the dialog reducer.
 */
export type DialogAction =
  | { payload: { agent: AgentWithRelations; mode: 'copy' | 'move' }; type: 'OPEN_PROJECT_DIALOG' }
  | { payload: { agent: AgentWithRelations }; type: 'OPEN_DELETE_DIALOG' }
  | {
      payload: { parsedData: ParsedAgentMarkdown; validationResult: AgentImportValidationResult };
      type: 'OPEN_IMPORT_DIALOG';
    }
  | { type: 'CLOSE_DELETE_DIALOG' }
  | { type: 'CLOSE_IMPORT_DIALOG' }
  | { type: 'CLOSE_PROJECT_DIALOG' };

/**
 * Combined dialog state for all agent dialogs.
 */
export interface DialogState {
  delete: DeleteDialogState;
  import: ImportDialogState;
  project: ProjectDialogState;
}

/**
 * State for the import agent dialog.
 */
export interface ImportDialogState {
  isOpen: boolean;
  parsedData: null | ParsedAgentMarkdown;
  validationResult: AgentImportValidationResult | null;
}

/**
 * State for the project selection dialog.
 */
export interface ProjectDialogState {
  agent: AgentWithRelations | null;
  isOpen: boolean;
  mode: 'copy' | 'move';
}

/**
 * Return type for the useAgentDialogs hook.
 */
export interface UseAgentDialogsReturn {
  /** Current dialog state */
  dialogState: DialogState;
  /** Dispatch function for dialog actions */
  dispatchDialog: Dispatch<DialogAction>;
  /** Handle closing the delete dialog */
  onDeleteDialogOpenChange: (isOpen: boolean) => void;
  /** Handle closing the import dialog */
  onImportDialogOpenChange: (isOpen: boolean) => void;
  /** Open the delete dialog for an agent */
  onOpenDeleteDialog: (agent: AgentWithRelations) => void;
  /** Open the import dialog with parsed data */
  onOpenImportDialog: (parsedData: ParsedAgentMarkdown, validationResult: AgentImportValidationResult) => void;
  /** Open the project dialog for moving or copying an agent */
  onOpenProjectDialog: (agent: AgentWithRelations, mode: 'copy' | 'move') => void;
  /** Handle closing the project dialog */
  onProjectDialogOpenChange: (isOpen: boolean) => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialDialogState: DialogState = {
  delete: { agent: null, isOpen: false },
  import: { isOpen: false, parsedData: null, validationResult: null },
  project: { agent: null, isOpen: false, mode: 'move' },
};

// ============================================================================
// Reducer
// ============================================================================

/**
 * Reducer for managing dialog state.
 *
 * @param state - Current dialog state
 * @param action - Action to perform
 * @returns Updated dialog state
 */
export function dialogReducer(state: DialogState, action: DialogAction): DialogState {
  switch (action.type) {
    case 'CLOSE_DELETE_DIALOG':
      return {
        ...state,
        delete: { agent: null, isOpen: false },
      };
    case 'CLOSE_IMPORT_DIALOG':
      return {
        ...state,
        import: { isOpen: false, parsedData: null, validationResult: null },
      };
    case 'CLOSE_PROJECT_DIALOG':
      return {
        ...state,
        project: { ...state.project, agent: null, isOpen: false },
      };
    case 'OPEN_DELETE_DIALOG':
      return {
        ...state,
        delete: { agent: action.payload.agent, isOpen: true },
      };
    case 'OPEN_IMPORT_DIALOG':
      return {
        ...state,
        import: {
          isOpen: true,
          parsedData: action.payload.parsedData,
          validationResult: action.payload.validationResult,
        },
      };
    case 'OPEN_PROJECT_DIALOG':
      return {
        ...state,
        project: { agent: action.payload.agent, isOpen: true, mode: action.payload.mode },
      };
    default:
      return state;
  }
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Custom hook for managing agent dialog state.
 *
 * Consolidates state for delete, import, and project selection dialogs
 * using a reducer pattern for predictable state updates.
 *
 * @returns Dialog state and handlers
 *
 * @example
 * ```tsx
 * const {
 *   dialogState,
 *   dispatchDialog,
 *   onOpenDeleteDialog,
 *   onDeleteDialogOpenChange,
 *   onOpenProjectDialog,
 *   onProjectDialogOpenChange,
 *   onOpenImportDialog,
 *   onImportDialogOpenChange,
 * } = useAgentDialogs();
 * ```
 */
export const useAgentDialogs = (): UseAgentDialogsReturn => {
  const [dialogState, dispatchDialog] = useReducer(dialogReducer, initialDialogState);

  // Delete dialog handlers
  const handleOpenDeleteDialog = useCallback((agent: AgentWithRelations) => {
    dispatchDialog({ payload: { agent }, type: 'OPEN_DELETE_DIALOG' });
  }, []);

  const handleDeleteDialogOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      dispatchDialog({ type: 'CLOSE_DELETE_DIALOG' });
    }
  }, []);

  // Project dialog handlers
  const handleOpenProjectDialog = useCallback((agent: AgentWithRelations, mode: 'copy' | 'move') => {
    dispatchDialog({ payload: { agent, mode }, type: 'OPEN_PROJECT_DIALOG' });
  }, []);

  const handleProjectDialogOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      dispatchDialog({ type: 'CLOSE_PROJECT_DIALOG' });
    }
  }, []);

  // Import dialog handlers
  const handleOpenImportDialog = useCallback(
    (parsedData: ParsedAgentMarkdown, validationResult: AgentImportValidationResult) => {
      dispatchDialog({
        payload: { parsedData, validationResult },
        type: 'OPEN_IMPORT_DIALOG',
      });
    },
    []
  );

  const handleImportDialogOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      dispatchDialog({ type: 'CLOSE_IMPORT_DIALOG' });
    }
  }, []);

  return {
    dialogState,
    dispatchDialog,
    onDeleteDialogOpenChange: handleDeleteDialogOpenChange,
    onImportDialogOpenChange: handleImportDialogOpenChange,
    onOpenDeleteDialog: handleOpenDeleteDialog,
    onOpenImportDialog: handleOpenImportDialog,
    onOpenProjectDialog: handleOpenProjectDialog,
    onProjectDialogOpenChange: handleProjectDialogOpenChange,
  };
};

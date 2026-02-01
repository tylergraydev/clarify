'use client';

import { type Dispatch, useCallback, useReducer } from 'react';

import type { Template } from '@/db/schema/templates.schema';

// ============================================================================
// Types
// ============================================================================

/**
 * State for the delete confirmation dialog.
 */
export interface DeleteDialogState {
  isOpen: boolean;
  template: null | Template;
}

/**
 * Action types for the dialog reducer.
 */
export type DialogAction =
  | { payload: { mode: EditorDialogMode; template: null | Template }; type: 'OPEN_EDITOR_DIALOG' }
  | { payload: { template: Template }; type: 'OPEN_DELETE_DIALOG' }
  | { type: 'CLOSE_DELETE_DIALOG' }
  | { type: 'CLOSE_EDITOR_DIALOG' };

/**
 * Combined dialog state for all template dialogs.
 */
export interface DialogState {
  delete: DeleteDialogState;
  editor: EditorDialogState;
}

/**
 * Mode for the editor dialog.
 */
export type EditorDialogMode = 'create' | 'edit' | 'view';

/**
 * State for the editor dialog.
 */
export interface EditorDialogState {
  isOpen: boolean;
  mode: EditorDialogMode;
  template: null | Template;
}

/**
 * Return type for the useTemplateDialogs hook.
 */
export interface UseTemplateDialogsReturn {
  /** Current dialog state */
  dialogState: DialogState;
  /** Dispatch function for dialog actions */
  dispatchDialog: Dispatch<DialogAction>;
  /** Handle closing the delete dialog */
  onDeleteDialogOpenChange: (isOpen: boolean) => void;
  /** Handle closing the editor dialog */
  onEditorDialogOpenChange: (isOpen: boolean) => void;
  /** Open the delete dialog for a template */
  onOpenDeleteDialog: (template: Template) => void;
  /** Open the editor dialog in create mode */
  onOpenEditorDialogCreate: () => void;
  /** Open the editor dialog in edit mode */
  onOpenEditorDialogEdit: (template: Template) => void;
  /** Open the editor dialog in view mode */
  onOpenEditorDialogView: (template: Template) => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialDialogState: DialogState = {
  delete: { isOpen: false, template: null },
  editor: { isOpen: false, mode: 'view', template: null },
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
        delete: { isOpen: false, template: null },
      };
    case 'CLOSE_EDITOR_DIALOG':
      return {
        ...state,
        editor: { isOpen: false, mode: 'view', template: null },
      };
    case 'OPEN_DELETE_DIALOG':
      return {
        ...state,
        delete: { isOpen: true, template: action.payload.template },
      };
    case 'OPEN_EDITOR_DIALOG':
      return {
        ...state,
        editor: {
          isOpen: true,
          mode: action.payload.mode,
          template: action.payload.template,
        },
      };
    default:
      return state;
  }
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Custom hook for managing template dialog state.
 *
 * Consolidates state for delete and editor dialogs
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
 *   onOpenEditorDialogCreate,
 *   onOpenEditorDialogEdit,
 *   onOpenEditorDialogView,
 *   onEditorDialogOpenChange,
 * } = useTemplateDialogs();
 * ```
 */
export const useTemplateDialogs = (): UseTemplateDialogsReturn => {
  const [dialogState, dispatchDialog] = useReducer(dialogReducer, initialDialogState);

  // Delete dialog handlers
  const handleOpenDeleteDialog = useCallback((template: Template) => {
    dispatchDialog({ payload: { template }, type: 'OPEN_DELETE_DIALOG' });
  }, []);

  const handleDeleteDialogOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      dispatchDialog({ type: 'CLOSE_DELETE_DIALOG' });
    }
  }, []);

  // Editor dialog handlers
  const handleOpenEditorDialogCreate = useCallback(() => {
    dispatchDialog({
      payload: { mode: 'create', template: null },
      type: 'OPEN_EDITOR_DIALOG',
    });
  }, []);

  const handleOpenEditorDialogEdit = useCallback((template: Template) => {
    dispatchDialog({
      payload: { mode: 'edit', template },
      type: 'OPEN_EDITOR_DIALOG',
    });
  }, []);

  const handleOpenEditorDialogView = useCallback((template: Template) => {
    dispatchDialog({
      payload: { mode: 'view', template },
      type: 'OPEN_EDITOR_DIALOG',
    });
  }, []);

  const handleEditorDialogOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      dispatchDialog({ type: 'CLOSE_EDITOR_DIALOG' });
    }
  }, []);

  return {
    dialogState,
    dispatchDialog,
    onDeleteDialogOpenChange: handleDeleteDialogOpenChange,
    onEditorDialogOpenChange: handleEditorDialogOpenChange,
    onOpenDeleteDialog: handleOpenDeleteDialog,
    onOpenEditorDialogCreate: handleOpenEditorDialogCreate,
    onOpenEditorDialogEdit: handleOpenEditorDialogEdit,
    onOpenEditorDialogView: handleOpenEditorDialogView,
  };
};

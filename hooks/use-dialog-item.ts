import { useCallback, useState } from 'react';

/**
 * Manages dialog state for item-based dialogs (edit, delete, archive, etc.).
 * Handles open/close state and the associated item in a single hook.
 *
 * @example
 * ```tsx
 * const editDialog = useDialogItem<Agent>();
 *
 * // Open dialog with an item
 * editDialog.open(agent);
 *
 * // Use in JSX
 * {editDialog.item && (
 *   <EditDialog
 *     item={editDialog.item}
 *     isOpen={editDialog.isOpen}
 *     onOpenChange={editDialog.handleOpenChange}
 *   />
 * )}
 * ```
 */
export function useDialogItem<T>() {
  const [item, setItem] = useState<null | T>(null);
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback((newItem: T) => {
    setItem(newItem);
    setIsOpen(true);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) setItem(null);
  }, []);

  return { handleOpenChange, isOpen, item, open } as const;
}

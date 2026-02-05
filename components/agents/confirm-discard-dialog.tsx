'use client';

import { ConfirmActionDialog } from '@/components/ui/confirm-action-dialog';

interface ConfirmDiscardDialogProps {
  /** Whether the mutation is in progress */
  isLoading?: boolean;
  /** Whether the dialog is open (controlled) */
  isOpen: boolean;
  /** Callback when the user confirms the action */
  onConfirm: () => void;
  /** Callback when the dialog open state changes */
  onOpenChange: (isOpen: boolean) => void;
}

/**
 * Confirmation dialog for discarding unsaved changes.
 * Displays a warning and requires explicit confirmation before discarding.
 *
 * @param props - Component props
 * @param props.isLoading - Whether the mutation is in progress
 * @param props.isOpen - Whether the dialog is open (controlled)
 * @param props.onConfirm - Callback when the user confirms the action
 * @param props.onOpenChange - Callback when the dialog open state changes
 */
export const ConfirmDiscardDialog = ({
  isLoading = false,
  isOpen,
  onConfirm,
  onOpenChange,
}: ConfirmDiscardDialogProps) => {
  const handleConfirmClick = () => {
    onConfirm();
  };

  return (
    <ConfirmActionDialog
      cancelLabel={'Keep editing'}
      confirmAriaDescribedById={'confirm-discard-description'}
      confirmAriaLabel={'Discard unsaved changes'}
      confirmLabel={'Discard'}
      description={'You have unsaved changes that will be lost if you close this dialog.'}
      descriptionId={'confirm-discard-description'}
      isLoading={isLoading}
      isOpen={isOpen}
      loadingLabel={'Discarding...'}
      onConfirm={handleConfirmClick}
      onOpenChange={onOpenChange}
      title={'Discard changes?'}
      titleId={'confirm-discard-title'}
    />
  );
};

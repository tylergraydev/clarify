'use client';

import { ConfirmActionDialog } from '@/components/ui/confirm-action-dialog';

interface ConfirmDeleteTemplateDialogProps {
  /** Whether the mutation is in progress */
  isLoading?: boolean;
  /** Whether the dialog is open (controlled) */
  isOpen: boolean;
  /** Callback when the user confirms the action */
  onConfirm: () => void;
  /** Callback when the dialog open state changes */
  onOpenChange: (isOpen: boolean) => void;
  /** The template display name to show in the dialog */
  templateName: string;
}

export const ConfirmDeleteTemplateDialog = ({
  isLoading = false,
  isOpen,
  onConfirm,
  onOpenChange,
  templateName,
}: ConfirmDeleteTemplateDialogProps) => {
  const handleConfirmClick = () => {
    onConfirm();
  };

  return (
    <ConfirmActionDialog
      alerts={[
        {
          description:
            'This action is permanent and cannot be undone. The template and all its configuration will be permanently removed.',
          tone: 'destructive',
        },
      ]}
      confirmAriaDescribedById={'confirm-delete-template-description'}
      confirmAriaLabel={`Delete ${templateName} template permanently`}
      confirmLabel={'Delete'}
      description={`Are you sure you want to delete "${templateName}"?`}
      descriptionId={'confirm-delete-template-description'}
      isLoading={isLoading}
      isOpen={isOpen}
      loadingLabel={'Deleting...'}
      onConfirm={handleConfirmClick}
      onOpenChange={onOpenChange}
      title={'Delete Template'}
      titleId={'confirm-delete-template-title'}
    />
  );
};

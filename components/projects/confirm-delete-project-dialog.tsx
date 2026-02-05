'use client';

import { ConfirmActionDialog } from '@/components/ui/confirm-action-dialog';

interface ConfirmDeleteProjectDialogProps {
  /** Whether the mutation is in progress */
  isLoading?: boolean;
  /** Whether the dialog is open (controlled) */
  isOpen: boolean;
  /** Callback when the user confirms the action */
  onConfirm: () => void;
  /** Callback when the dialog open state changes */
  onOpenChange: (isOpen: boolean) => void;
  /** The project display name to show in the dialog */
  projectName: string;
}

export const ConfirmDeleteProjectDialog = ({
  isLoading = false,
  isOpen,
  onConfirm,
  onOpenChange,
  projectName,
}: ConfirmDeleteProjectDialogProps) => {
  const handleConfirmClick = () => {
    onConfirm();
  };

  return (
    <ConfirmActionDialog
      alerts={[
        {
          containerClassName: 'dark:border-destructive/30 dark:bg-destructive/20',
          description:
            'This action is permanent and cannot be undone. The project and all its data (repositories, workflows, and agents) will be permanently removed.',
          tone: 'destructive',
        },
      ]}
      confirmAriaDescribedById={'confirm-delete-project-description'}
      confirmAriaLabel={`Delete ${projectName} project permanently`}
      confirmLabel={'Delete'}
      description={`Are you sure you want to delete "${projectName}"?`}
      descriptionId={'confirm-delete-project-description'}
      isLoading={isLoading}
      isOpen={isOpen}
      loadingLabel={'Deleting...'}
      onConfirm={handleConfirmClick}
      onOpenChange={onOpenChange}
      title={'Delete Project'}
      titleId={'confirm-delete-project-title'}
    />
  );
};

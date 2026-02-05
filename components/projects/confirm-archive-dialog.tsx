'use client';

import { ConfirmActionDialog } from '@/components/ui/confirm-action-dialog';

interface ConfirmArchiveDialogProps {
  /** Whether the project is currently archived (determines action direction) */
  isArchived: boolean;
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

export const ConfirmArchiveDialog = ({
  isArchived,
  isLoading = false,
  isOpen,
  onConfirm,
  onOpenChange,
  projectName,
}: ConfirmArchiveDialogProps) => {
  const handleConfirmClick = () => {
    onConfirm();
  };

  const title = isArchived ? 'Unarchive Project' : 'Archive Project';
  const description = isArchived
    ? `Are you sure you want to unarchive "${projectName}"? The project will be restored to your active projects list.`
    : `Are you sure you want to archive "${projectName}"? Archived projects can be restored later.`;
  const confirmButtonLabel = isArchived ? `Unarchive ${projectName} project` : `Archive ${projectName} project`;
  const confirmButtonText = isArchived ? 'Unarchive' : 'Archive';

  return (
    <ConfirmActionDialog
      confirmAriaDescribedById={'confirm-archive-project-description'}
      confirmAriaLabel={confirmButtonLabel}
      confirmLabel={confirmButtonText}
      confirmVariant={'default'}
      description={description}
      descriptionId={'confirm-archive-project-description'}
      isLoading={isLoading}
      isOpen={isOpen}
      loadingLabel={'Processing...'}
      onConfirm={handleConfirmClick}
      onOpenChange={onOpenChange}
      title={title}
      titleId={'confirm-archive-project-title'}
    />
  );
};

'use client';

import { ConfirmActionDialog } from '@/components/ui/confirm-action-dialog';

interface ConfirmDeleteRepositoryDialogProps {
  /** Whether the mutation is in progress */
  isLoading?: boolean;
  /** Whether the dialog is open (controlled) */
  isOpen: boolean;
  /** Callback when the user confirms the action */
  onConfirm: () => void;
  /** Callback when the dialog open state changes */
  onOpenChange: (isOpen: boolean) => void;
  /** The repository name to display in the dialog */
  repositoryName: string;
  /** The count of workflows associated with this repository */
  workflowCount?: number;
}

export const ConfirmDeleteRepositoryDialog = ({
  isLoading = false,
  isOpen,
  onConfirm,
  onOpenChange,
  repositoryName,
  workflowCount = 0,
}: ConfirmDeleteRepositoryDialogProps) => {
  const handleConfirmClick = () => {
    onConfirm();
  };

  const hasWorkflows = workflowCount > 0;
  const workflowLabel = workflowCount === 1 ? 'workflow' : 'workflows';

  return (
    <ConfirmActionDialog
      alerts={[
        {
          containerClassName: 'dark:border-destructive/30 dark:bg-destructive/20',
          description:
            'This action is permanent and cannot be undone. The repository will be removed from this project.',
          tone: 'destructive' as const,
        },
        ...(hasWorkflows
          ? [
              {
                description: `This repository is associated with ${workflowCount} ${workflowLabel}. Removing it will not delete workflow history but may affect active workflows.`,
                tone: 'warning' as const,
              },
            ]
          : []),
      ]}
      confirmAriaDescribedById={'confirm-delete-repository-description'}
      confirmAriaLabel={`Remove ${repositoryName} repository permanently`}
      confirmLabel={'Remove'}
      description={`Are you sure you want to remove "${repositoryName}" from this project?`}
      descriptionId={'confirm-delete-repository-description'}
      isLoading={isLoading}
      isOpen={isOpen}
      loadingLabel={'Removing...'}
      onConfirm={handleConfirmClick}
      onOpenChange={onOpenChange}
      title={'Remove Repository'}
      titleId={'confirm-delete-repository-title'}
    />
  );
};

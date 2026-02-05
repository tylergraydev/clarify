'use client';

import { ConfirmActionDialog } from '@/components/ui/confirm-action-dialog';

interface ConfirmDeleteAgentDialogProps {
  /** The agent display name to show in the dialog */
  agentName: string;
  /** Whether the mutation is in progress */
  isLoading?: boolean;
  /** Whether the dialog is open (controlled) */
  isOpen: boolean;
  /** Callback when the user confirms the action */
  onConfirm: () => void;
  /** Callback when the dialog open state changes */
  onOpenChange: (isOpen: boolean) => void;
}

export const ConfirmDeleteAgentDialog = ({
  agentName,
  isLoading = false,
  isOpen,
  onConfirm,
  onOpenChange,
}: ConfirmDeleteAgentDialogProps) => {
  const handleConfirmClick = () => {
    onConfirm();
  };

  return (
    <ConfirmActionDialog
      alerts={[
        {
          description:
            'This action is permanent and cannot be undone. The agent and all its configuration will be permanently removed.',
          tone: 'destructive',
        },
      ]}
      confirmAriaDescribedById={'confirm-delete-agent-description'}
      confirmAriaLabel={`Delete ${agentName} agent permanently`}
      confirmLabel={'Delete'}
      description={`Are you sure you want to delete "${agentName}"?`}
      descriptionId={'confirm-delete-agent-description'}
      isLoading={isLoading}
      isOpen={isOpen}
      loadingLabel={'Deleting...'}
      onConfirm={handleConfirmClick}
      onOpenChange={onOpenChange}
      title={'Delete Agent'}
      titleId={'confirm-delete-agent-title'}
    />
  );
};

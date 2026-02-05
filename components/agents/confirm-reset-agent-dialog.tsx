'use client';

import { ConfirmActionDialog } from '@/components/ui/confirm-action-dialog';

interface ConfirmResetAgentDialogProps {
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

/**
 * Confirmation dialog for resetting a customized agent to its default configuration.
 * Displays a warning about data loss and requires explicit confirmation.
 *
 * @param props - Component props
 * @param props.agentName - The agent display name to show in the dialog
 * @param props.isLoading - Whether the mutation is in progress
 * @param props.isOpen - Whether the dialog is open (controlled)
 * @param props.onConfirm - Callback when the user confirms the action
 * @param props.onOpenChange - Callback when the dialog open state changes
 */
export const ConfirmResetAgentDialog = ({
  agentName,
  isLoading = false,
  isOpen,
  onConfirm,
  onOpenChange,
}: ConfirmResetAgentDialogProps) => {
  const handleConfirmClick = () => {
    onConfirm();
  };

  return (
    <ConfirmActionDialog
      alerts={[
        {
          description:
            'This will discard all your customizations including display name, description, system prompt, and color. This action cannot be undone.',
          tone: 'warning',
        },
      ]}
      confirmAriaDescribedById={'confirm-reset-description'}
      confirmAriaLabel={`Reset ${agentName} agent to default`}
      confirmLabel={'Reset to Default'}
      description={`Are you sure you want to reset "${agentName}" to its default configuration?`}
      descriptionId={'confirm-reset-description'}
      isLoading={isLoading}
      isOpen={isOpen}
      loadingLabel={'Resetting...'}
      onConfirm={handleConfirmClick}
      onOpenChange={onOpenChange}
      title={'Reset Agent'}
      titleId={'confirm-reset-title'}
    />
  );
};

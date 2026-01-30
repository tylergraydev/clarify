"use client";

import { Button } from "@/components/ui/button";
import {
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const hasWorkflows = workflowCount > 0;

  const handleConfirmClick = () => {
    onConfirm();
  };

  return (
    <DialogRoot onOpenChange={onOpenChange} open={isOpen}>
      {/* Portal */}
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup aria-modal={"true"} role={"alertdialog"}>
          {/* Header */}
          <DialogTitle id={"confirm-delete-repository-title"}>
            {"Remove Repository"}
          </DialogTitle>
          <DialogDescription id={"confirm-delete-repository-description"}>
            {`Are you sure you want to remove "${repositoryName}" from this project? This action cannot be undone.`}
          </DialogDescription>

          {/* Workflow Warning */}
          {hasWorkflows && (
            <div
              aria-live={"polite"}
              className={
                "mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30"
              }
              role={"alert"}
            >
              <p className={"text-sm text-amber-800 dark:text-amber-200"}>
                {`This repository is associated with ${workflowCount} ${workflowCount === 1 ? "workflow" : "workflows"}. Removing it will not delete workflow history but may affect active workflows.`}
              </p>
            </div>
          )}

          {/* Actions */}
          <div
            aria-label={"Confirm deletion actions"}
            className={"mt-6 flex justify-end gap-3"}
            role={"group"}
          >
            <DialogClose>
              <Button disabled={isLoading} variant={"outline"}>
                {"Cancel"}
              </Button>
            </DialogClose>
            <Button
              aria-describedby={"confirm-delete-repository-description"}
              aria-label={`Remove ${repositoryName} repository permanently`}
              disabled={isLoading}
              onClick={handleConfirmClick}
              variant={"destructive"}
            >
              {isLoading ? "Removing..." : "Remove"}
            </Button>
          </div>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};

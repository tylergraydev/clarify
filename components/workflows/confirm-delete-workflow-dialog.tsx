"use client";

import { Button } from "@/components/ui/button";
import {
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmDeleteWorkflowDialogProps {
  /** Whether the mutation is in progress */
  isLoading?: boolean;
  /** Whether the dialog is open (controlled) */
  isOpen: boolean;
  /** Callback when the user confirms the action */
  onConfirm: () => void;
  /** Callback when the dialog open state changes */
  onOpenChange: (isOpen: boolean) => void;
  /** The workflow status to show a warning if running */
  status: string;
  /** The workflow name to display in the dialog */
  workflowName: string;
}

export const ConfirmDeleteWorkflowDialog = ({
  isLoading = false,
  isOpen,
  onConfirm,
  onOpenChange,
  status,
  workflowName,
}: ConfirmDeleteWorkflowDialogProps) => {
  const isRunning = status === "running" || status === "paused";

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
          <DialogHeader>
            <DialogTitle id={"confirm-delete-workflow-title"}>
              {"Delete Workflow"}
            </DialogTitle>
            <DialogDescription id={"confirm-delete-workflow-description"}>
              {`Are you sure you want to delete "${workflowName}"? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>

          {/* Running Warning */}
          {isRunning && (
            <div
              aria-live={"polite"}
              className={
                "mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30"
              }
              role={"alert"}
            >
              <p className={"text-sm text-amber-800 dark:text-amber-200"}>
                {
                  "This workflow is currently running or paused. Deleting it will stop all execution and remove all associated data."
                }
              </p>
            </div>
          )}

          {/* Actions */}
          <DialogFooter sticky={false}>
            <DialogClose>
              <Button disabled={isLoading} variant={"outline"}>
                {"Cancel"}
              </Button>
            </DialogClose>
            <Button
              aria-describedby={"confirm-delete-workflow-description"}
              aria-label={`Delete ${workflowName} workflow permanently`}
              disabled={isLoading}
              onClick={handleConfirmClick}
              variant={"destructive"}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};

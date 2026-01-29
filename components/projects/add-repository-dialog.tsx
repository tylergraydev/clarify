"use client";

import { type ReactNode, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAddRepositoryToProject } from "@/hooks/queries/use-projects";
import { useAppForm } from "@/lib/forms/form-hook";
import { addRepositorySchema } from "@/lib/validations/repository";

interface AddRepositoryDialogProps {
  /** Callback when repository is successfully added */
  onSuccess?: () => void;
  /** The ID of the project to add the repository to */
  projectId: number;
  /** The trigger element that opens the dialog */
  trigger: ReactNode;
}

export const AddRepositoryDialog = ({
  onSuccess,
  projectId,
  trigger,
}: AddRepositoryDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const addRepositoryMutation = useAddRepositoryToProject();

  const isSubmitting = addRepositoryMutation.isPending;

  const form = useAppForm({
    defaultValues: {
      defaultBranch: "main",
      name: "",
      path: "",
    },
    onSubmit: async ({ value }) => {
      try {
        await addRepositoryMutation.mutateAsync({
          projectId,
          repoData: {
            defaultBranch: value.defaultBranch,
            name: value.name,
            path: value.path,
            projectId,
          },
        });
        handleClose();
        onSuccess?.();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to add repository. Please try again.";
        throw new Error(message);
      }
    },
    validators: {
      onSubmit: addRepositorySchema,
    },
  });

  const handleClose = () => {
    setIsOpen(false);
    form.reset();
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset();
    }
  };

  return (
    <DialogRoot onOpenChange={handleOpenChange} open={isOpen}>
      {/* Trigger */}
      <DialogTrigger>{trigger}</DialogTrigger>

      {/* Portal */}
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup>
          {/* Header */}
          <DialogTitle>{"Add Repository"}</DialogTitle>
          <DialogDescription>
            {"Add a repository to this project for workflow management."}
          </DialogDescription>

          {/* Form */}
          <form
            className={"mt-6"}
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <div className={"flex flex-col gap-4"}>
              {/* Name Field */}
              <form.AppField name={"name"}>
                {(field) => (
                  <field.TextField
                    autoFocus
                    isRequired
                    label={"Repository Name"}
                    placeholder={"Enter repository name"}
                  />
                )}
              </form.AppField>

              {/* Path Field */}
              <form.AppField name={"path"}>
                {(field) => (
                  <field.PathInputField
                    description={"Select the local directory containing the repository"}
                    isRequired
                    label={"Repository Path"}
                    placeholder={"Select or enter repository path"}
                  />
                )}
              </form.AppField>

              {/* Default Branch Field */}
              <form.AppField name={"defaultBranch"}>
                {(field) => (
                  <field.TextField
                    description={"The default branch to use for workflows"}
                    label={"Default Branch"}
                    placeholder={"main"}
                  />
                )}
              </form.AppField>

              {/* Action Buttons */}
              <div className={"mt-2 flex justify-end gap-3"}>
                <DialogClose>
                  <Button
                    disabled={isSubmitting}
                    type={"button"}
                    variant={"outline"}
                  >
                    {"Cancel"}
                  </Button>
                </DialogClose>
                <form.AppForm>
                  <form.SubmitButton>
                    {isSubmitting ? "Adding..." : "Add Repository"}
                  </form.SubmitButton>
                </form.AppForm>
              </div>
            </div>
          </form>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};

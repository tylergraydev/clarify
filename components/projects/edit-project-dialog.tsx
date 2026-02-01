'use client';

import { useEffect, useState } from 'react';

import type { Project } from '@/types/electron';

import { ConfirmDiscardDialog } from '@/components/agents/confirm-discard-dialog';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/dialog';
import { useUpdateProject } from '@/hooks/queries/use-projects';
import { useAppForm } from '@/lib/forms/form-hook';
import { type EditProjectFormValues, editProjectSchema } from '@/lib/validations/project';

interface EditProjectDialogProps {
  /** Whether the dialog is open (controlled) */
  isOpen: boolean;
  /** Callback when the dialog open state changes */
  onOpenChange: (isOpen: boolean) => void;
  /** Callback when project is successfully updated */
  onSuccess?: () => void;
  /** The project to edit */
  project: Project;
}

export const EditProjectDialog = ({ isOpen, onOpenChange, onSuccess, project }: EditProjectDialogProps) => {
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);

  const updateProjectMutation = useUpdateProject();

  const isSubmitting = updateProjectMutation.isPending;

  const defaultValues: EditProjectFormValues = {
    description: project.description ?? '',
    name: project.name,
  };

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        await updateProjectMutation.mutateAsync({
          data: {
            description: value.description || null,
            name: value.name,
          },
          id: project.id,
        });
        handleClose();
        onSuccess?.();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update project. Please try again.';
        throw new Error(message);
      }
    },
    validators: {
      onSubmit: editProjectSchema,
    },
  });

  // Reset form when project changes
  useEffect(() => {
    const resetValues: EditProjectFormValues = {
      description: project.description ?? '',
      name: project.name,
    };
    form.reset(resetValues);
  }, [project, form]);

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
  };

  const handleOpenChangeInternal = (open: boolean) => {
    if (!open && form.state.isDirty) {
      // Show discard confirmation if form has unsaved changes
      setIsDiscardDialogOpen(true);
      return;
    }
    onOpenChange(open);
    if (!open) {
      form.reset();
    }
  };

  const handleConfirmDiscard = () => {
    setIsDiscardDialogOpen(false);
    onOpenChange(false);
    form.reset();
  };

  return (
    <DialogRoot onOpenChange={handleOpenChangeInternal} open={isOpen}>
      {/* Portal */}
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup>
          {/* Header */}
          <DialogHeader>
            <DialogTitle>{'Edit Project'}</DialogTitle>
            <DialogDescription>{"Update your project's name and description."}</DialogDescription>
          </DialogHeader>

          {/* Form */}
          <form
            className={'mt-6'}
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <div className={'flex flex-col gap-4'}>
              {/* Name Field */}
              <form.AppField name={'name'}>
                {(field) => (
                  <field.TextField
                    autoFocus
                    isDisabled={isSubmitting}
                    isRequired
                    label={'Project Name'}
                    placeholder={'Enter project name'}
                  />
                )}
              </form.AppField>

              {/* Description Field */}
              <form.AppField name={'description'}>
                {(field) => (
                  <field.TextareaField
                    description={'Optional description for your project'}
                    isDisabled={isSubmitting}
                    label={'Description'}
                    placeholder={'Describe your project...'}
                    rows={3}
                  />
                )}
              </form.AppField>
            </div>

            {/* Action Buttons */}
            <DialogFooter sticky={false}>
              <DialogClose>
                <Button disabled={isSubmitting} type={'button'} variant={'outline'}>
                  {'Cancel'}
                </Button>
              </DialogClose>
              <form.AppForm>
                <form.SubmitButton>{isSubmitting ? 'Saving...' : 'Save Changes'}</form.SubmitButton>
              </form.AppForm>
            </DialogFooter>
          </form>
        </DialogPopup>
      </DialogPortal>

      {/* Confirm Discard Dialog */}
      <ConfirmDiscardDialog
        isOpen={isDiscardDialogOpen}
        onConfirm={handleConfirmDiscard}
        onOpenChange={setIsDiscardDialogOpen}
      />
    </DialogRoot>
  );
};

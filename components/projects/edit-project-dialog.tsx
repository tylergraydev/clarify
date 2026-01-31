'use client';

import type { ReactNode } from 'react';

import { useEffect, useState } from 'react';

import type { Project } from '@/types/electron';

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
  DialogTrigger,
} from '@/components/ui/dialog';
import { useUpdateProject } from '@/hooks/queries/use-projects';
import { useAppForm } from '@/lib/forms/form-hook';
import { type CreateProjectFormValues, createProjectSchema } from '@/lib/validations/project';

interface EditProjectDialogProps {
  /** Callback when project is successfully updated */
  onSuccess?: () => void;
  /** The project to edit */
  project: Project;
  /** The trigger element that opens the dialog */
  trigger: ReactNode;
}

export const EditProjectDialog = ({ onSuccess, project, trigger }: EditProjectDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateProjectMutation = useUpdateProject();

  const isSubmitting = updateProjectMutation.isPending;

  const defaultValues: CreateProjectFormValues = {
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
      onSubmit: createProjectSchema,
    },
  });

  // Reset form when project changes
  useEffect(() => {
    const resetValues: CreateProjectFormValues = {
      description: project.description ?? '',
      name: project.name,
    };
    form.reset(resetValues);
  }, [project, form]);

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
                  <field.TextField autoFocus isRequired label={'Project Name'} placeholder={'Enter project name'} />
                )}
              </form.AppField>

              {/* Description Field */}
              <form.AppField name={'description'}>
                {(field) => (
                  <field.TextareaField
                    description={'Optional description for your project'}
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
    </DialogRoot>
  );
};

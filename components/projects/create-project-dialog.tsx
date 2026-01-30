'use client';

import { type ReactNode, useState } from 'react';

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
import { useCreateProject } from '@/hooks/queries/use-projects';
import { useAppForm } from '@/lib/forms/form-hook';
import { createProjectSchema } from '@/lib/validations/project';

interface CreateProjectDialogProps {
  /** Callback when project is successfully created */
  onSuccess?: () => void;
  /** The trigger element that opens the dialog */
  trigger: ReactNode;
}

export const CreateProjectDialog = ({ onSuccess, trigger }: CreateProjectDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const createProjectMutation = useCreateProject();

  const isSubmitting = createProjectMutation.isPending;

  const form = useAppForm({
    defaultValues: {
      description: '',
      name: '',
    },
    onSubmit: async ({ value }) => {
      try {
        await createProjectMutation.mutateAsync({
          description: value.description || null,
          name: value.name,
        });
        handleClose();
        onSuccess?.();
      } catch (error) {
        // Re-throw with original message or a fallback
        const message = error instanceof Error ? error.message : 'Failed to create project. Please try again.';
        throw new Error(message);
      }
    },
    validators: {
      onSubmit: createProjectSchema,
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
          <DialogHeader>
            <DialogTitle>{'Create Project'}</DialogTitle>
            <DialogDescription>{'Create a new project to organize your workflows and repositories.'}</DialogDescription>
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
                <form.SubmitButton>{isSubmitting ? 'Creating...' : 'Create Project'}</form.SubmitButton>
              </form.AppForm>
            </DialogFooter>
          </form>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};

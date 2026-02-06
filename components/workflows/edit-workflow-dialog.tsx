'use client';

import type { ReactNode } from 'react';

import { useStore } from '@tanstack/react-form';
import { Fragment, useState } from 'react';

import type { Workflow } from '@/db/schema/workflows.schema';
import type { EditWorkflowFormValues } from '@/lib/validations/workflow';

import { ConfirmDiscardDialog } from '@/components/agents/confirm-discard-dialog';
import { Button } from '@/components/ui/button';
import {
  DialogBackdrop,
  DialogBody,
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
import { pauseBehaviors, workflowTypes } from '@/db/schema/workflows.schema';
import { useUpdateWorkflow } from '@/hooks/queries/use-workflows';
import { useToast } from '@/hooks/use-toast';
import { useAppForm } from '@/lib/forms/form-hook';
import { editWorkflowFormSchema } from '@/lib/validations/workflow';

interface EditWorkflowDialogProps {
  /** Callback when open state changes (required when using controlled mode) */
  onOpenChange?: (isOpen: boolean) => void;
  /** Callback when workflow is successfully updated */
  onSuccess?: () => void;
  /** Controlled open state (optional - if provided, dialog becomes controlled) */
  open?: boolean;
  /** The trigger element that opens the dialog (optional when using controlled mode) */
  trigger?: ReactNode;
  /** The workflow to edit */
  workflow: Workflow;
}

const workflowTypeOptions = workflowTypes.map((type) => ({
  label: type === 'planning' ? 'Planning' : 'Implementation',
  value: type,
}));

const pauseBehaviorOptions = pauseBehaviors.map((behavior) => ({
  label: behavior === 'continuous' ? 'Continuous (no pauses)' : 'Auto Pause (pause after each step)',
  value: behavior,
}));

export const EditWorkflowDialog = ({ onOpenChange, onSuccess, open, trigger, workflow }: EditWorkflowDialogProps) => {
  const [isInternalOpen, setIsInternalOpen] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);

  // Determine if dialog is controlled or uncontrolled
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : isInternalOpen;

  const setIsOpen = (value: boolean) => {
    if (isControlled) {
      onOpenChange?.(value);
    } else {
      setIsInternalOpen(value);
    }
  };

  const toast = useToast();

  const updateWorkflowMutation = useUpdateWorkflow();

  const isSubmitting = updateWorkflowMutation.isPending;

  const defaultValues: EditWorkflowFormValues = {
    featureName: workflow.featureName,
    featureRequest: workflow.featureRequest,
    pauseBehavior: workflow.pauseBehavior as (typeof pauseBehaviors)[number],
    skipClarification: workflow.skipClarification,
    type: workflow.type as (typeof workflowTypes)[number],
  };

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        await updateWorkflowMutation.mutateAsync({
          data: {
            featureName: value.featureName,
            featureRequest: value.featureRequest,
            pauseBehavior: value.pauseBehavior,
            skipClarification: value.skipClarification,
            type: value.type,
          },
          id: workflow.id,
        });

        toast.success({
          description: 'Workflow has been updated successfully.',
          title: 'Workflow Updated',
        });

        handleClose();
        onSuccess?.();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update workflow. Please try again.';
        toast.error({
          description: message,
          title: 'Error',
        });
      }
    },
    validators: {
      onSubmit: editWorkflowFormSchema,
    },
  });

  const selectedType = useStore(form.store, (state) => state.values.type);

  const handleClose = () => {
    setIsOpen(false);
    form.reset();
  };

  const handleOpenChangeInternal = (open: boolean) => {
    if (!open && form.state.isDirty) {
      setIsDiscardDialogOpen(true);
      return;
    }
    setIsOpen(open);
    if (!open) {
      form.reset();
    }
  };

  const handleConfirmDiscard = () => {
    setIsDiscardDialogOpen(false);
    setIsOpen(false);
    form.reset();
  };

  const isPlanning = selectedType === 'planning';

  return (
    <DialogRoot onOpenChange={handleOpenChangeInternal} open={isOpen}>
      {/* Trigger (only rendered when provided) */}
      {trigger && <DialogTrigger>{trigger}</DialogTrigger>}

      {/* Portal */}
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup aria-modal={'true'} role={'dialog'} scrollable={true} size={'xl'}>
          {/* Header */}
          <DialogHeader>
            <DialogTitle id={'edit-workflow-title'}>Edit Workflow</DialogTitle>
            <DialogDescription id={'edit-workflow-description'}>
              Edit the workflow details. You can only edit workflows that have not been started.
            </DialogDescription>
          </DialogHeader>

          {/* Form */}
          <form
            aria-describedby={'edit-workflow-description'}
            aria-labelledby={'edit-workflow-title'}
            className={'flex min-h-0 flex-1 flex-col'}
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <DialogBody className={'px-2'}>
              <div className={'flex flex-col gap-4'}>
                {/* Workflow Type Field */}
                <form.AppField name={'type'}>
                  {(field) => (
                    <field.SelectField
                      isRequired
                      label={'Workflow Type'}
                      options={workflowTypeOptions}
                      placeholder={'Select workflow type'}
                    />
                  )}
                </form.AppField>

                {/* Feature Name Field */}
                <form.AppField name={'featureName'}>
                  {(field) => (
                    <field.TextField
                      autoFocus
                      isRequired
                      label={'Feature Name'}
                      placeholder={'Enter a name for this feature'}
                    />
                  )}
                </form.AppField>

                {/* Feature Request Field */}
                <form.AppField name={'featureRequest'}>
                  {(field) => (
                    <field.TextareaField
                      isRequired
                      label={'Feature Request'}
                      placeholder={'Describe the feature you want to build...'}
                      rows={6}
                    />
                  )}
                </form.AppField>

                {/* Pause Behavior Field */}
                <form.AppField name={'pauseBehavior'}>
                  {(field) => (
                    <field.SelectField
                      description={'Control when the workflow pauses for review'}
                      isRequired
                      label={'Pause Behavior'}
                      options={pauseBehaviorOptions}
                      placeholder={'Select pause behavior'}
                    />
                  )}
                </form.AppField>

                {/* Skip Clarification Field - Only for planning workflows */}
                {isPlanning && (
                  <Fragment>
                    <form.AppField name={'skipClarification'}>
                      {(field) => (
                        <field.SwitchField
                          description={'Skip the clarification step and proceed directly to planning'}
                          label={'Skip Clarification'}
                        />
                      )}
                    </form.AppField>
                  </Fragment>
                )}
              </div>
            </DialogBody>

            {/* Action Buttons */}
            <DialogFooter>
              <DialogClose>
                <Button disabled={isSubmitting} type={'button'} variant={'outline'}>
                  Cancel
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

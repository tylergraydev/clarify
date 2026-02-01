'use client';

import type { ReactNode } from 'react';

import { useStore } from '@tanstack/react-form';
import { Fragment, useEffect, useState } from 'react';

import type { CreateWorkflowFormValues } from '@/lib/validations/workflow';

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
  DialogTrigger,
} from '@/components/ui/dialog';
import { RepositorySelectionField } from '@/components/workflows/repository-selection-field';
import { pauseBehaviors, workflowTypes } from '@/db/schema/workflows.schema';
import { useRepositoriesByProject } from '@/hooks/queries/use-repositories';
import { useActiveTemplates, useIncrementTemplateUsage } from '@/hooks/queries/use-templates';
import { useCreateWorkflow } from '@/hooks/queries/use-workflows';
import { useElectron } from '@/hooks/use-electron';
import { useToast } from '@/hooks/use-toast';
import { useAppForm } from '@/lib/forms/form-hook';
import { createWorkflowSchema } from '@/lib/validations/workflow';

interface CreateWorkflowDialogProps {
  /** Callback when workflow is successfully created */
  onSuccess?: () => void;
  /** The project ID to create the workflow for */
  projectId: number;
  /** The trigger element that opens the dialog */
  trigger: ReactNode;
}

const workflowTypeOptions = workflowTypes.map((type) => ({
  label: type === 'planning' ? 'Planning' : 'Implementation',
  value: type,
}));

const pauseBehaviorOptions = pauseBehaviors.map((behavior) => ({
  label:
    behavior === 'continuous'
      ? 'Continuous (no pauses)'
      : behavior === 'auto_pause'
        ? 'Auto Pause (pause after each step)'
        : 'Gates Only (pause at quality gates)',
  value: behavior,
}));

export const CreateWorkflowDialog = ({ onSuccess, projectId, trigger }: CreateWorkflowDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);

  const { api } = useElectron();
  const toast = useToast();

  const { data: repositories = [] } = useRepositoriesByProject(projectId);
  const { data: templates = [] } = useActiveTemplates();

  const createWorkflowMutation = useCreateWorkflow();
  const incrementTemplateUsageMutation = useIncrementTemplateUsage();

  const isSubmitting = createWorkflowMutation.isPending;

  const templateOptions = [
    { label: 'None', value: '' },
    ...templates.map((template) => ({
      label: template.name,
      value: String(template.id),
    })),
  ];

  const defaultValues: CreateWorkflowFormValues = {
    featureName: '',
    featureRequest: '',
    pauseBehavior: 'auto_pause',
    primaryRepositoryId: '',
    projectId: String(projectId),
    repositoryIds: [],
    skipClarification: false,
    templateId: '',
    type: 'planning',
  };

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        // Step 1: Create the workflow
        const workflow = await createWorkflowMutation.mutateAsync({
          featureName: value.featureName,
          featureRequest: value.featureRequest,
          pauseBehavior: value.pauseBehavior,
          projectId: Number(value.projectId),
          skipClarification: value.skipClarification,
          type: value.type,
        });

        // Step 2: Associate repositories with the workflow
        if (value.repositoryIds.length > 0 && api) {
          const repositoryIds = value.repositoryIds.map(Number);
          const primaryRepositoryId = value.primaryRepositoryId ? Number(value.primaryRepositoryId) : undefined;

          await api.workflowRepository.addMultiple(workflow.id, repositoryIds, primaryRepositoryId);
        }

        // Step 3: Increment template usage if a template was used
        if (value.templateId) {
          incrementTemplateUsageMutation.mutate(Number(value.templateId));
        }

        // Step 4: Close dialog and invoke success callback
        handleClose();
        onSuccess?.();
      } catch (error) {
        // Display error toast
        const message = error instanceof Error ? error.message : 'Failed to create workflow. Please try again.';
        toast.error({
          description: message,
          title: 'Error',
        });
      }
    },
    validators: {
      onSubmit: createWorkflowSchema,
    },
  });

  const selectedTemplateId = useStore(form.store, (state) => state.values.templateId);
  const selectedType = useStore(form.store, (state) => state.values.type);

  // Template auto-populate effect
  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find((t) => String(t.id) === selectedTemplateId);
      if (template) {
        form.setFieldValue('featureRequest', template.templateText);
      }
    }
  }, [selectedTemplateId, templates, form]);

  const handleClose = () => {
    setIsOpen(false);
    form.reset();
  };

  const handleOpenChangeInternal = (open: boolean) => {
    if (!open && form.state.isDirty) {
      // Show discard confirmation if form has unsaved changes
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
      {/* Trigger */}
      <DialogTrigger>{trigger}</DialogTrigger>

      {/* Portal */}
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup size={'lg'}>
          {/* Header */}
          <DialogHeader>
            <DialogTitle>{'Create Workflow'}</DialogTitle>
            <DialogDescription>Create a new workflow to plan or implement a feature in your project.</DialogDescription>
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

              {/* Template Field */}
              <form.AppField name={'templateId'}>
                {(field) => (
                  <field.SelectField
                    description={'Optionally use a template to pre-fill the feature request'}
                    label={'Template'}
                    options={templateOptions}
                    placeholder={'Select a template (optional)'}
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

              {/* Repository Selection Field */}
              <RepositorySelectionField
                description={'Select one or more repositories and choose a primary'}
                form={form}
                isRequired
                label={'Repositories'}
                repositories={repositories}
              />

              {/* Pause Behavior Field */}
              <form.AppField name={'pauseBehavior'}>
                {(field) => (
                  <field.SelectField
                    description={'Control when the workflow pauses for review'}
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

            {/* Action Buttons */}
            <DialogFooter sticky={false}>
              <DialogClose>
                <Button disabled={isSubmitting} type={'button'} variant={'outline'}>
                  Cancel
                </Button>
              </DialogClose>
              <form.AppForm>
                <form.SubmitButton>{isSubmitting ? 'Creating...' : 'Create Workflow'}</form.SubmitButton>
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

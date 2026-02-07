'use client';

import type { ReactNode } from 'react';

import { useStore } from '@tanstack/react-form';
import { Fragment, useEffect, useState } from 'react';

import type { CreateWorkflowFormValues } from '@/lib/validations/workflow';

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
import { Tooltip } from '@/components/ui/tooltip';
import { RepositorySelectionField } from '@/components/workflows/repository-selection-field';
import { pauseBehaviors, workflowTypes } from '@/db/schema/workflows.schema';
import { useAgentsByType } from '@/hooks/queries/use-agents';
import { useDefaultClarificationAgent } from '@/hooks/queries/use-default-clarification-agent';
import { useRepositoriesByProject } from '@/hooks/queries/use-repositories';
import { useActiveTemplates, useIncrementTemplateUsage } from '@/hooks/queries/use-templates';
import { useCreateWorkflow } from '@/hooks/queries/use-workflows';
import { useElectronDb } from '@/hooks/use-electron';
import { useToast } from '@/hooks/use-toast';
import { useAppForm } from '@/lib/forms/form-hook';
import { createWorkflowSchema } from '@/lib/validations/workflow';

interface CreateWorkflowDialogProps {
  /** Whether the dialog trigger should be disabled (e.g., no repositories) */
  disabled?: boolean;
  /** Message to display when the trigger is disabled */
  disabledMessage?: string;
  /** Initial values to pre-fill the form (used for copy workflow) */
  initialValues?: Partial<CreateWorkflowFormValues>;
  /** Callback when open state changes (for controlled mode) */
  onOpenChange?: (isOpen: boolean) => void;
  /** Callback when workflow is successfully created */
  onSuccess?: () => void;
  /** Controlled open state (optional - if provided, dialog becomes controlled) */
  open?: boolean;
  /** The project ID to create the workflow for */
  projectId: number;
  /** The trigger element that opens the dialog (optional when using controlled mode) */
  trigger?: ReactNode;
}

const workflowTypeOptions = workflowTypes.map((type) => ({
  label: type === 'planning' ? 'Planning' : 'Implementation',
  value: type,
}));

const pauseBehaviorOptions = pauseBehaviors.map((behavior) => ({
  label: behavior === 'continuous' ? 'Continuous (no pauses)' : 'Auto Pause (pause after each step)',
  value: behavior,
}));

export const CreateWorkflowDialog = ({
  disabled = false,
  disabledMessage = 'Please add at least one repository to the project before creating a workflow',
  initialValues,
  onOpenChange,
  onSuccess,
  open,
  projectId,
  trigger,
}: CreateWorkflowDialogProps) => {
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

  const { workflowRepositories } = useElectronDb();
  const toast = useToast();

  const { data: repositories = [] } = useRepositoriesByProject(projectId);
  const { data: templates = [] } = useActiveTemplates();
  const { data: planningAgents = [] } = useAgentsByType('planning');
  const { agentId: defaultClarificationAgentId } = useDefaultClarificationAgent();

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

  const planningAgentOptions = planningAgents.map((agent) => ({
    label: agent.displayName,
    value: String(agent.id),
  }));

  const defaultValues: CreateWorkflowFormValues = {
    clarificationAgentId: defaultClarificationAgentId ? String(defaultClarificationAgentId) : '',
    featureName: '',
    featureRequest: '',
    pauseBehavior: 'auto_pause',
    projectId: String(projectId),
    repositoryIds: [],
    skipClarification: false,
    templateId: '',
    type: 'planning',
    ...initialValues,
  };

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        // Step 1: Create the workflow
        const workflow = await createWorkflowMutation.mutateAsync({
          clarificationAgentId: value.clarificationAgentId ? Number(value.clarificationAgentId) : null,
          featureName: value.featureName,
          featureRequest: value.featureRequest,
          pauseBehavior: value.pauseBehavior,
          projectId: Number(value.projectId),
          skipClarification: value.skipClarification,
          type: value.type,
        });

        // Step 2: Associate repositories with the workflow
        if (value.repositoryIds.length > 0) {
          const repositoryIds = value.repositoryIds.map(Number);
          await workflowRepositories.addMultiple(workflow.id, repositoryIds);
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
  const selectedSkipClarification = useStore(form.store, (state) => state.values.skipClarification);

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
  const isShowClarificationAgent = !selectedSkipClarification && planningAgentOptions.length > 0;

  // If disabled and has a trigger, show tooltip with disabled message
  if (disabled && trigger) {
    return <Tooltip content={disabledMessage}>{trigger}</Tooltip>;
  }

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
            <DialogTitle id={'create-workflow-title'}>{'Create Workflow'}</DialogTitle>
            <DialogDescription id={'create-workflow-description'}>
              Create a new workflow to plan or implement a feature in your project.
            </DialogDescription>
          </DialogHeader>

          {/* Form */}
          <form
            aria-describedby={'create-workflow-description'}
            aria-labelledby={'create-workflow-title'}
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
                  description={'Select one or more repositories for this workflow'}
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

                    {/* Clarification Agent Field - Hidden when skipClarification is true */}
                    {isShowClarificationAgent && (
                      <form.AppField name={'clarificationAgentId'}>
                        {(field) => (
                          <field.SelectField
                            description={'Select which planning agent analyzes your feature request'}
                            label={'Clarification Agent'}
                            options={planningAgentOptions}
                            placeholder={'Select agent...'}
                          />
                        )}
                      </form.AppField>
                    )}
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

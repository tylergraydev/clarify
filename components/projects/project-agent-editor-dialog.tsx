'use client';

import type { ReactNode } from 'react';

import { Fragment, useCallback, useEffect, useState } from 'react';

import type { Agent } from '@/types/electron';

import { type AgentHooksData, AgentHooksSection } from '@/components/agents/agent-hooks-section';
import { AgentSkillsManager } from '@/components/agents/agent-skills-manager';
import { AgentToolsManager } from '@/components/agents/agent-tools-manager';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
import { useResetAgent, useUpdateAgent } from '@/hooks/queries/use-agents';
import { getAgentColorHex } from '@/lib/colors/agent-colors';
import { useAppForm } from '@/lib/forms/form-hook';
import { updateAgentSchema } from '@/lib/validations/agent';

interface ProjectAgentEditorDialogProps {
  /** The agent to edit */
  agent: Agent;
  /** Callback when agent is successfully updated */
  onSuccess?: () => void;
  /** The project ID for context */
  projectId: number;
  /** The trigger element that opens the dialog */
  trigger: ReactNode;
}

const MODEL_OPTIONS = [
  { label: 'Inherit', value: '' },
  { label: 'Sonnet', value: 'sonnet' },
  { label: 'Opus', value: 'opus' },
  { label: 'Haiku', value: 'haiku' },
];

const PERMISSION_MODE_OPTIONS = [
  { label: 'Default', value: 'default' },
  { label: 'Accept Edits', value: 'acceptEdits' },
  { label: "Don't Ask", value: 'dontAsk' },
  { label: 'Bypass Permissions', value: 'bypassPermissions' },
  { label: 'Plan', value: 'plan' },
];

export const ProjectAgentEditorDialog = ({ agent, onSuccess, projectId, trigger }: ProjectAgentEditorDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingHooks, setPendingHooks] = useState<AgentHooksData>({});

  const updateAgentMutation = useUpdateAgent();
  const resetAgentMutation = useResetAgent();

  const isSubmitting = updateAgentMutation.isPending;
  const isResetting = resetAgentMutation.isPending;
  const isBuiltIn = agent.builtInAt !== null;
  const isProjectOverride = agent.projectId === projectId;
  const isCustomized = agent.parentAgentId !== null;

  const getDefaultValues = useCallback(() => {
    return {
      description: agent.description ?? '',
      displayName: agent.displayName,
      model: (agent.model ?? '') as '' | 'haiku' | 'inherit' | 'opus' | 'sonnet' | undefined,
      permissionMode: (agent.permissionMode ?? '') as
        | ''
        | 'acceptEdits'
        | 'bypassPermissions'
        | 'default'
        | 'dontAsk'
        | 'plan'
        | undefined,
      systemPrompt: agent.systemPrompt,
    };
  }, [agent]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Schema types are compatible at runtime
  const validationSchema = updateAgentSchema as any;

  const form = useAppForm({
    defaultValues: getDefaultValues(),
    onSubmit: async ({ value }) => {
      try {
        const modelValue = value.model === '' || value.model === undefined ? null : value.model;
        const permissionModeValue =
          value.permissionMode === '' || value.permissionMode === undefined ? null : value.permissionMode;
        await updateAgentMutation.mutateAsync({
          data: {
            description: value.description,
            displayName: value.displayName,
            model: modelValue,
            permissionMode: permissionModeValue,
            projectId: projectId,
            systemPrompt: value.systemPrompt,
          },
          id: agent.id,
        });
        handleClose();
        onSuccess?.();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update agent. Please try again.';
        throw new Error(message);
      }
    },
    validators: {
      onSubmit: validationSchema,
    },
  });

  useEffect(() => {
    form.reset(getDefaultValues());
  }, [agent, form, getDefaultValues]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    form.reset();
    setPendingHooks({});
  }, [form]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (!open) {
        form.reset();
        setPendingHooks({});
      }
    },
    [form]
  );

  const handleResetToGlobalDefaults = async () => {
    try {
      await resetAgentMutation.mutateAsync({
        id: agent.id,
        projectId: agent.projectId ?? projectId,
      });
      handleClose();
      onSuccess?.();
    } catch {
      // Error handled by mutation
    }
  };

  const agentTypeLabel = agent.type === 'planning' ? 'Planning' : agent.type === 'specialist' ? 'Specialist' : 'Review';

  return (
    <DialogRoot onOpenChange={handleOpenChange} open={isOpen}>
      {/* Trigger */}
      <DialogTrigger>{trigger}</DialogTrigger>

      {/* Portal */}
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup scrollable={true} size={'xl'}>
          {/* Header */}
          <DialogHeader
            badges={
              <Fragment>
                {isBuiltIn && <Badge variant={'default'}>{'Built-in'}</Badge>}
                <Badge variant={'default'}>{agentTypeLabel}</Badge>
              </Fragment>
            }
          >
            <DialogTitle>{'Edit Project Agent'}</DialogTitle>
            <DialogDescription>
              {"Customize the agent's configuration for this project. Changes only affect this project."}
            </DialogDescription>
          </DialogHeader>

          {/* Form wraps DialogBody + DialogFooter for submit to work */}
          <form
            className={'flex min-h-0 flex-1 flex-col'}
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <DialogBody>
              {/* Project Override Indicator */}
              <div
                className={
                  'flex items-center gap-2 rounded-md border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-600 dark:text-blue-400'
                }
              >
                <svg
                  className={'size-4 shrink-0'}
                  fill={'none'}
                  stroke={'currentColor'}
                  strokeWidth={2}
                  viewBox={'0 0 24 24'}
                  xmlns={'http://www.w3.org/2000/svg'}
                >
                  <path
                    d={'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'}
                    strokeLinecap={'round'}
                    strokeLinejoin={'round'}
                  />
                </svg>
                <span>
                  {isProjectOverride
                    ? 'This is a project-level configuration override.'
                    : 'Editing will create a project-level override of this agent.'}
                </span>
              </div>

              {/* Base Agent Info Display */}
              <div className={'mt-4 rounded-md border border-border bg-muted/50 p-3'}>
                <div className={'flex items-center gap-3'}>
                  {agent.color && (
                    <div className={'size-4 rounded-full'} style={{ backgroundColor: getAgentColorHex(agent.color) }} />
                  )}
                  <div className={'text-sm'}>
                    <span className={'text-muted-foreground'}>{'Internal name: '}</span>
                    <span className={'font-mono text-foreground'}>{agent.name}</span>
                  </div>
                </div>
              </div>

              <div className={'mt-4 flex flex-col gap-4'}>
                {/* Display Name */}
                <form.AppField name={'displayName'}>
                  {(field) => <field.TextField label={'Display Name'} placeholder={'Enter display name'} />}
                </form.AppField>

                {/* Description */}
                <form.AppField name={'description'}>
                  {(field) => (
                    <field.TextareaField
                      description={'A brief description of what this agent does'}
                      label={'Description'}
                      placeholder={"Describe the agent's purpose..."}
                      rows={3}
                    />
                  )}
                </form.AppField>

                {/* Model */}
                <form.AppField name={'model'}>
                  {(field) => (
                    <field.SelectField
                      description={'Model to use for this agent. Leave empty to inherit from parent.'}
                      label={'Model'}
                      options={MODEL_OPTIONS}
                      placeholder={'Select model'}
                    />
                  )}
                </form.AppField>

                {/* Permission Mode */}
                <form.AppField name={'permissionMode'}>
                  {(field) => (
                    <field.SelectField
                      description={'How Claude handles permission requests'}
                      label={'Permission Mode'}
                      options={PERMISSION_MODE_OPTIONS}
                      placeholder={'Select permission mode'}
                    />
                  )}
                </form.AppField>

                {/* System Prompt */}
                <form.AppField name={'systemPrompt'}>
                  {(field) => (
                    <field.TextareaField
                      description={'The system prompt that defines how this agent behaves for this project'}
                      label={'System Prompt'}
                      placeholder={'Enter the system prompt...'}
                      rows={12}
                    />
                  )}
                </form.AppField>

                {/* Tools Section */}
                <Collapsible className={'rounded-md border border-border'}>
                  <CollapsibleTrigger className={'w-full justify-start px-3 py-2'}>
                    {'Allowed Tools'}
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className={'border-t border-border p-3'}>
                      <AgentToolsManager agentId={agent.id} disabled={isSubmitting || isResetting} />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Skills Section */}
                <Collapsible className={'rounded-md border border-border'}>
                  <CollapsibleTrigger className={'w-full justify-start px-3 py-2'}>
                    {'Referenced Skills'}
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className={'border-t border-border p-3'}>
                      <AgentSkillsManager agentId={agent.id} disabled={isSubmitting || isResetting} />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Hooks Section */}
                <Collapsible className={'rounded-md border border-border'}>
                  <CollapsibleTrigger className={'w-full justify-start px-3 py-2'}>{'Hooks'}</CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className={'border-t border-border p-3'}>
                      <AgentHooksSection
                        disabled={isSubmitting || isResetting}
                        hooks={pendingHooks}
                        onHooksChange={setPendingHooks}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </DialogBody>

            {/* Sticky Footer */}
            <DialogFooter alignment={'between'}>
              {/* Reset Button - only for project overrides or customized agents */}
              <div>
                {(isProjectOverride || isCustomized) && (
                  <Button
                    disabled={isSubmitting || isResetting}
                    onClick={handleResetToGlobalDefaults}
                    type={'button'}
                    variant={'outline'}
                  >
                    {isResetting ? 'Resetting...' : 'Reset to Global Defaults'}
                  </Button>
                )}
              </div>

              {/* Cancel and Save Buttons */}
              <div className={'flex gap-3'}>
                <DialogClose>
                  <Button disabled={isSubmitting || isResetting} type={'button'} variant={'outline'}>
                    {'Cancel'}
                  </Button>
                </DialogClose>
                <form.AppForm>
                  <form.SubmitButton>{isSubmitting ? 'Saving...' : 'Save Changes'}</form.SubmitButton>
                </form.AppForm>
              </div>
            </DialogFooter>
          </form>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};

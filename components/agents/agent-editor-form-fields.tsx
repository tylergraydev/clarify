'use client';

import { Fragment } from 'react';

import type { useAgentEditorForm } from '@/hooks/agents/use-agent-editor-form';
import type { Agent } from '@/types/electron';

import { getAgentColorHex } from '@/lib/colors/agent-colors';

import { AGENT_TYPE_OPTIONS, MODEL_OPTIONS, PERMISSION_MODE_OPTIONS } from './agent-editor-dialog.types';

interface AgentEditorFormFieldsProps {
  agent?: Agent;
  canEditAgentName: boolean;
  form: ReturnType<typeof useAgentEditorForm>['form'];
  isDuplicateMode: boolean;
  isEditMode: boolean;
  isProjectSelectorDisabled: boolean;
  isResetting: boolean;
  isSubmitting: boolean;
  isViewMode: boolean;
  onAgentTypeChange: (newType: string) => void;
  projectOptions: Array<{ label: string; value: string }>;
  showBuiltInNameDisplay: boolean;
}

export const AgentEditorFormFields = ({
  agent,
  canEditAgentName,
  form,
  isDuplicateMode,
  isEditMode,
  isProjectSelectorDisabled,
  isResetting,
  isSubmitting,
  isViewMode,
  onAgentTypeChange,
  projectOptions,
  showBuiltInNameDisplay,
}: AgentEditorFormFieldsProps) => {
  return (
    <Fragment>
      {/* Agent Info Display (Built-in Agents in Edit Mode Only) */}
      {showBuiltInNameDisplay && agent && (
        <form.Subscribe selector={(state) => state.values.color}>
          {(colorValue) => (
            <div className={'rounded-md border border-border bg-muted/50 p-3'}>
              <div className={'flex items-center gap-3'}>
                {colorValue && (
                  <div
                    className={'size-4 rounded-full'}
                    style={{
                      backgroundColor: getAgentColorHex(colorValue),
                    }}
                  />
                )}
                <div className={'text-sm'}>
                  <span className={'text-muted-foreground'}>{'Internal name: '}</span>
                  <span className={'font-mono text-foreground'}>{agent.name}</span>
                  <span className={'ml-2 text-xs text-muted-foreground'}>
                    {'(built-in agents cannot be renamed)'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </form.Subscribe>
      )}

      {/* Form Fields */}
      <fieldset className={'mt-4 flex flex-col gap-4'} disabled={isSubmitting || isResetting || isViewMode}>
        <legend className={'sr-only'}>{'Agent details'}</legend>

        {/* Name Field (Create Mode or Custom Agents in Edit Mode) */}
        {canEditAgentName && (
          <form.AppField name={'name'}>
            {(field) => (
              <field.TextField
                autoFocus={!isDuplicateMode && !isEditMode}
                description={
                  'A unique identifier using lowercase letters, numbers, and hyphens (e.g., my-custom-agent)'
                }
                isRequired
                label={'Agent Name'}
                placeholder={'my-custom-agent'}
              />
            )}
          </form.AppField>
        )}

        {/* Type Field (Create Mode Only) */}
        {!isEditMode && (
          <form.AppField name={'type'}>
            {(field) => (
              <field.SelectField
                description={
                  'Planning agents handle workflow planning, specialist agents perform specific tasks, review agents validate outputs'
                }
                isRequired
                label={'Agent Type'}
                onChange={onAgentTypeChange}
                options={AGENT_TYPE_OPTIONS}
                placeholder={'Select agent type'}
              />
            )}
          </form.AppField>
        )}

        {/* Project Assignment Field */}
        <form.AppField name={'projectId'}>
          {(field) => (
            <field.SelectField
              description={
                isEditMode
                  ? 'Move this agent to a different project or make it global'
                  : 'Assign this agent to a specific project or make it available globally'
              }
              isDisabled={isProjectSelectorDisabled}
              label={'Project Assignment'}
              options={projectOptions}
              placeholder={'Select project'}
            />
          )}
        </form.AppField>

        {/* Display Name Field */}
        <form.AppField name={'displayName'}>
          {(field) => (
            <field.TextField
              autoFocus={isEditMode || isDuplicateMode}
              isRequired
              label={'Display Name'}
              placeholder={'Enter display name'}
            />
          )}
        </form.AppField>

        {/* Description Field */}
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

        {/* Model Field */}
        <form.AppField name={'model'}>
          {(field) => (
            <field.SelectField
              description={'Model to use for this agent. Select Inherit to use parent model.'}
              isRequired
              label={'Model'}
              options={MODEL_OPTIONS}
            />
          )}
        </form.AppField>

        {/* Permission Mode Field */}
        <form.AppField name={'permissionMode'}>
          {(field) => (
            <field.SelectField
              description={'How Claude handles permission requests'}
              isRequired
              label={'Permission Mode'}
              options={PERMISSION_MODE_OPTIONS}
            />
          )}
        </form.AppField>

        {/* Extended Thinking Toggle */}
        <form.AppField name={'extendedThinkingEnabled'}>
          {(field) => (
            <field.SwitchField
              description={
                'Enables extended reasoning for complex tasks. ' +
                'IMPORTANT: Real-time text streaming is disabled when extended thinking is active. ' +
                'Instead of seeing incremental updates, the complete response will appear after the agent finishes reasoning. ' +
                'You will see elapsed time and periodic heartbeat updates during execution.'
              }
              label={'Extended Thinking'}
            />
          )}
        </form.AppField>

        {/* Thinking Token Budget (Conditional) */}
        <form.Subscribe selector={(state) => state.values.extendedThinkingEnabled}>
          {(extendedThinkingEnabled) =>
            extendedThinkingEnabled ? (
              <form.AppField name={'maxThinkingTokens'}>
                {(field) => (
                  <field.NumberField
                    description={'1,000 - 128,000 tokens. Recommended: 10,000 for most tasks.'}
                    label={'Thinking Token Budget'}
                    max={128000}
                    min={1000}
                    step={1000}
                  />
                )}
              </form.AppField>
            ) : null
          }
        </form.Subscribe>

        {/* Color Picker Field */}
        <form.AppField name={'color'}>
          {(field) => (
            <field.ColorPickerField
              isDisabled={isSubmitting || isResetting || isViewMode}
              isRequired={!isEditMode}
              label={'Color Tag'}
            />
          )}
        </form.AppField>

        {/* System Prompt Field */}
        <form.AppField name={'systemPrompt'}>
          {(field) => (
            <field.TextareaField
              description={'The system prompt that defines how this agent behaves'}
              isRequired
              label={'System Prompt'}
              placeholder={'Enter the system prompt...'}
              rows={12}
            />
          )}
        </form.AppField>
      </fieldset>
    </Fragment>
  );
};

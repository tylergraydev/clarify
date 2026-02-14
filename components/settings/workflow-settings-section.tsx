'use client';

import type { ReactElement } from 'react';

import { SettingsSection } from './settings-section';

/**
 * Minimal form interface for settings section components.
 * This avoids complex TanStack Form generic types while maintaining type safety
 * for the fields being rendered.
 */
interface SettingsFormApi {
  AppField: <TName extends string>(props: {
    children: (field: {
      NumberField: (props: {
        description?: string;
        label: string;
        max?: number;
        min?: number;
        step?: number;
      }) => ReactElement;
      RadioField: (props: {
        label: string;
        options: Array<{
          description?: string;
          label: string;
          value: string;
        }>;
      }) => ReactElement;
    }) => ReactElement;
    name: TName;
  }) => ReactElement;
}

interface WorkflowSettingsSectionProps {
  form: SettingsFormApi;
}

const pauseBehaviorOptions = [
  {
    description: 'Run all steps without pausing',
    label: 'Continuous',
    value: 'continuous',
  },
  {
    description: 'Pause after each step for review',
    label: 'Auto-Pause',
    value: 'auto-pause',
  },
];

export const WorkflowSettingsSection = ({ form }: WorkflowSettingsSectionProps): ReactElement => {
  return (
    <SettingsSection title={'Workflow Execution'}>
      {/* Default Pause Behavior */}
      <form.AppField name={'workflow.defaultPauseBehavior'}>
        {(field) => <field.RadioField label={'Default Pause Behavior'} options={pauseBehaviorOptions} />}
      </form.AppField>

      {/* Max Concurrent Workflows */}
      <form.AppField name={'workflow.maxConcurrentWorkflows'}>
        {(field) => (
          <field.NumberField
            description={'Maximum number of workflows that can run simultaneously (1-10)'}
            label={'Max Concurrent Workflows'}
            max={10}
            min={1}
            step={1}
          />
        )}
      </form.AppField>

      {/* Clarification Timeout */}
      <form.AppField name={'workflow.clarificationTimeoutSeconds'}>
        {(field) => (
          <field.NumberField
            description={'Maximum time for the clarification step (seconds)'}
            label={'Clarification Timeout'}
            max={600}
            min={10}
            step={10}
          />
        )}
      </form.AppField>

      {/* Refinement Timeout */}
      <form.AppField name={'workflow.refinementTimeoutSeconds'}>
        {(field) => (
          <field.NumberField
            description={'Maximum time for the refinement step (seconds)'}
            label={'Refinement Timeout'}
            max={600}
            min={10}
            step={10}
          />
        )}
      </form.AppField>

      {/* Discovery Timeout */}
      <form.AppField name={'workflow.discoveryTimeoutSeconds'}>
        {(field) => (
          <field.NumberField
            description={'Maximum time for the file discovery step (seconds)'}
            label={'Discovery Timeout'}
            max={600}
            min={10}
            step={10}
          />
        )}
      </form.AppField>

      {/* Planning Timeout */}
      <form.AppField name={'workflow.planningTimeoutSeconds'}>
        {(field) => (
          <field.NumberField
            description={'Maximum time for the planning step (seconds)'}
            label={'Planning Timeout'}
            max={600}
            min={10}
            step={10}
          />
        )}
      </form.AppField>

      {/* Implementation Timeout */}
      <form.AppField name={'workflow.implementationTimeoutSeconds'}>
        {(field) => (
          <field.NumberField
            description={'Maximum time for the implementation step (seconds)'}
            label={'Implementation Timeout'}
            max={600}
            min={10}
            step={10}
          />
        )}
      </form.AppField>
    </SettingsSection>
  );
};

export type { SettingsFormApi, WorkflowSettingsSectionProps };

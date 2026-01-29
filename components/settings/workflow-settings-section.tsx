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
  {
    description: 'Only pause at quality gate checkpoints',
    label: 'Quality Gates Only',
    value: 'quality-gates',
  },
];

export const WorkflowSettingsSection = ({
  form,
}: WorkflowSettingsSectionProps): ReactElement => {
  return (
    <SettingsSection title={'Workflow Execution'}>
      {/* Default Pause Behavior */}
      <form.AppField name={'workflow.defaultPauseBehavior'}>
        {(field) => (
          <field.RadioField
            label={'Default Pause Behavior'}
            options={pauseBehaviorOptions}
          />
        )}
      </form.AppField>

      {/* Step Timeout */}
      <form.AppField name={'workflow.stepTimeoutSeconds'}>
        {(field) => (
          <field.NumberField
            description={'Maximum time (in seconds) allowed for each workflow step'}
            label={'Step Timeout (seconds)'}
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

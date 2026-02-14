'use client';

import type { ReactElement } from 'react';

import { SettingsSection } from './settings-section';

interface ChatSettingsSectionProps {
  form: SettingsFormApi;
}

/**
 * Minimal form interface for settings section components.
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
      SwitchField: (props: { description?: string; label: string }) => ReactElement;
    }) => ReactElement;
    name: TName;
  }) => ReactElement;
}

export const ChatSettingsSection = ({ form }: ChatSettingsSectionProps): ReactElement => {
  return (
    <SettingsSection title={'Chat'}>
      {/* Auto-generate titles */}
      <form.AppField name={'chat.autoGenerateTitle'}>
        {(field) => (
          <field.SwitchField
            description={'Automatically generate conversation titles using AI after the first exchange'}
            label={'Auto-generate Titles'}
          />
        )}
      </form.AppField>

      {/* Title regeneration interval */}
      <form.AppField name={'chat.titleRegenerateInterval'}>
        {(field) => (
          <field.NumberField
            description={'Number of messages between title re-generation attempts'}
            label={'Title Regeneration Interval'}
            max={50}
            min={5}
            step={5}
          />
        )}
      </form.AppField>

      {/* Auto-prompt compaction */}
      <form.AppField name={'chat.autoPromptCompaction'}>
        {(field) => (
          <field.SwitchField
            description={'Show a notification when conversation context grows large'}
            label={'Auto-prompt Compaction'}
          />
        )}
      </form.AppField>

      {/* Compaction token threshold */}
      <form.AppField name={'chat.compactionTokenThreshold'}>
        {(field) => (
          <field.NumberField
            description={'Token count threshold that triggers the compaction notification'}
            label={'Compaction Token Threshold'}
            max={200000}
            min={20000}
            step={10000}
          />
        )}
      </form.AppField>
    </SettingsSection>
  );
};

export type { ChatSettingsSectionProps, SettingsFormApi };

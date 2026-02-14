'use client';

import type { ReactElement } from 'react';

import { SettingsSection } from './settings-section';

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
      TextField: (props: {
        description?: string;
        label: string;
        placeholder?: string;
      }) => ReactElement;
    }) => ReactElement;
    name: TName;
  }) => ReactElement;
}

interface TerminalSettingsSectionProps {
  form: SettingsFormApi;
}

export const TerminalSettingsSection = ({ form }: TerminalSettingsSectionProps): ReactElement => {
  return (
    <SettingsSection title={'Terminal'}>
      {/* Shell Path */}
      <form.AppField name={'terminal.shellPath'}>
        {(field) => (
          <field.TextField
            description={'Path to the shell executable (leave empty for system default)'}
            label={'Shell Path'}
            placeholder={'e.g. /bin/zsh or C:\\Windows\\System32\\cmd.exe'}
          />
        )}
      </form.AppField>

      {/* Font Size */}
      <form.AppField name={'terminal.fontSize'}>
        {(field) => (
          <field.NumberField
            description={'Font size in pixels for the terminal (8-32)'}
            label={'Font Size'}
            max={32}
            min={8}
            step={1}
          />
        )}
      </form.AppField>

      {/* Font Family */}
      <form.AppField name={'terminal.fontFamily'}>
        {(field) => (
          <field.TextField
            description={'Font family for the terminal (leave empty for Geist Mono)'}
            label={'Font Family'}
            placeholder={'e.g. Cascadia Code, Menlo, monospace'}
          />
        )}
      </form.AppField>

      {/* Cursor Blink */}
      <form.AppField name={'terminal.cursorBlink'}>
        {(field) => (
          <field.SwitchField
            description={'Whether the terminal cursor should blink'}
            label={'Cursor Blink'}
          />
        )}
      </form.AppField>

      {/* Scrollback */}
      <form.AppField name={'terminal.scrollback'}>
        {(field) => (
          <field.NumberField
            description={'Number of lines to keep in the scrollback buffer (100-10,000)'}
            label={'Scrollback Lines'}
            max={10000}
            min={100}
            step={100}
          />
        )}
      </form.AppField>
    </SettingsSection>
  );
};

export type { SettingsFormApi, TerminalSettingsSectionProps };

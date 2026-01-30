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
      PathInputField: (props: {
        description?: string;
        isRequired?: boolean;
        label: string;
        placeholder?: string;
      }) => ReactElement;
      SwitchField: (props: { description?: string; label: string }) => ReactElement;
    }) => ReactElement;
    name: TName;
  }) => ReactElement;
}

interface WorktreeSettingsSectionProps {
  form: SettingsFormApi;
}

export const WorktreeSettingsSection = ({ form }: WorktreeSettingsSectionProps): ReactElement => {
  return (
    <SettingsSection title={'Git Worktrees'}>
      {/* Worktree Location */}
      <form.AppField name={'worktree.worktreeLocation'}>
        {(field) => (
          <field.PathInputField
            description={'Directory where git worktrees will be created for parallel work'}
            isRequired={true}
            label={'Worktree Location'}
            placeholder={'Select a directory for worktrees'}
          />
        )}
      </form.AppField>

      {/* Auto Cleanup */}
      <form.AppField name={'worktree.autoCleanup'}>
        {(field) => (
          <field.SwitchField
            description={'Automatically remove worktrees after workflow completion'}
            label={'Auto-cleanup Worktrees'}
          />
        )}
      </form.AppField>

      {/* Create Feature Branch */}
      <form.AppField name={'worktree.createFeatureBranch'}>
        {(field) => (
          <field.SwitchField
            description={'Create a new feature branch when starting a workflow'}
            label={'Create Feature Branch'}
          />
        )}
      </form.AppField>

      {/* Push on Completion */}
      <form.AppField name={'worktree.pushOnCompletion'}>
        {(field) => (
          <field.SwitchField
            description={'Push changes to remote repository when workflow completes'}
            label={'Push on Completion'}
          />
        )}
      </form.AppField>
    </SettingsSection>
  );
};

export type { SettingsFormApi, WorktreeSettingsSectionProps };

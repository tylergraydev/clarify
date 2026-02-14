'use client';

import type { ReactElement } from 'react';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useBulkUpdateSettings } from '@/hooks/queries/use-settings';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { useToast } from '@/hooks/use-toast';
import { useAppForm } from '@/lib/forms';
import { settingsFormSchema, type SettingsFormValues } from '@/lib/validations/settings';

import type { SettingsFormApi as ChatFormApi } from './chat-settings-section';
import type { SettingsFormApi as LoggingFormApi } from './logging-settings-section';
import type { SettingsFormApi as TerminalFormApi } from './terminal-settings-section';
import type { SettingsFormApi as WorkflowFormApi } from './workflow-settings-section';
import type { SettingsFormApi as WorktreeFormApi } from './worktree-settings-section';

import { type AutoSaveState, AutoSaveStatus } from './auto-save-status';
import { ChatSettingsSection } from './chat-settings-section';
import { DebugSettingsSection } from './debug-settings-section';
import { LoggingSettingsSection } from './logging-settings-section';
import { TerminalSettingsSection } from './terminal-settings-section';
import { UISettingsSection } from './ui-settings-section';
import { WorkflowSettingsSection } from './workflow-settings-section';
import { WorktreeSettingsSection } from './worktree-settings-section';

interface SettingsFormProps {
  initialValues: SettingsFormValues;
  onSuccess?: () => void;
}

/**
 * Helper function to convert nested settings form values into flat key-value pairs
 * for the bulk update mutation.
 */
function flattenSettingsValues(values: SettingsFormValues): Array<{ key: string; value: string }> {
  const updates: Array<{ key: string; value: string }> = [];

  // Workflow settings
  updates.push({
    key: 'workflow.clarificationTimeoutSeconds',
    value: String(values.workflow.clarificationTimeoutSeconds),
  });
  updates.push({
    key: 'workflow.defaultPauseBehavior',
    value: values.workflow.defaultPauseBehavior,
  });
  updates.push({
    key: 'workflow.discoveryTimeoutSeconds',
    value: String(values.workflow.discoveryTimeoutSeconds),
  });
  updates.push({
    key: 'workflow.implementationTimeoutSeconds',
    value: String(values.workflow.implementationTimeoutSeconds),
  });
  updates.push({
    key: 'workflow.planningTimeoutSeconds',
    value: String(values.workflow.planningTimeoutSeconds),
  });
  updates.push({
    key: 'workflow.refinementTimeoutSeconds',
    value: String(values.workflow.refinementTimeoutSeconds),
  });

  // Worktree settings
  updates.push({
    key: 'worktree.autoCleanup',
    value: String(values.worktree.autoCleanup),
  });
  updates.push({
    key: 'worktree.createFeatureBranch',
    value: String(values.worktree.createFeatureBranch),
  });
  updates.push({
    key: 'worktree.pushOnCompletion',
    value: String(values.worktree.pushOnCompletion),
  });
  updates.push({
    key: 'worktree.worktreeLocation',
    value: values.worktree.worktreeLocation,
  });

  // Logging settings
  updates.push({
    key: 'logging.exportLogsWithDatabase',
    value: String(values.logging.exportLogsWithDatabase),
  });
  updates.push({
    key: 'logging.includeCliOutput',
    value: String(values.logging.includeCliOutput),
  });
  updates.push({
    key: 'logging.logExportLocation',
    value: values.logging.logExportLocation,
  });
  updates.push({
    key: 'logging.logRetentionDays',
    value: String(values.logging.logRetentionDays),
  });

  // Chat settings
  updates.push({
    key: 'chat.autoGenerateTitle',
    value: String(values.chat.autoGenerateTitle),
  });
  updates.push({
    key: 'chat.autoPromptCompaction',
    value: String(values.chat.autoPromptCompaction),
  });
  updates.push({
    key: 'chat.compactionTokenThreshold',
    value: String(values.chat.compactionTokenThreshold),
  });
  updates.push({
    key: 'chat.titleRegenerateInterval',
    value: String(values.chat.titleRegenerateInterval),
  });

  // Terminal settings
  updates.push({
    key: 'terminal.shellPath',
    value: values.terminal.shellPath,
  });
  updates.push({
    key: 'terminal.fontSize',
    value: String(values.terminal.fontSize),
  });
  updates.push({
    key: 'terminal.fontFamily',
    value: values.terminal.fontFamily,
  });
  updates.push({
    key: 'terminal.cursorBlink',
    value: String(values.terminal.cursorBlink),
  });
  updates.push({
    key: 'terminal.scrollback',
    value: String(values.terminal.scrollback),
  });

  return updates;
}

export const SettingsForm = ({ initialValues, onSuccess }: SettingsFormProps): ReactElement => {
  const toast = useToast();
  const bulkUpdateMutation = useBulkUpdateSettings();
  const [saveStatus, setSaveStatus] = useState<AutoSaveState>('idle');
  const savedTimeoutRef = useRef<null | ReturnType<typeof setTimeout>>(null);
  const hasInitializedRef = useRef(false);

  const form = useAppForm({
    defaultValues: initialValues,
    validators: {
      onChange: settingsFormSchema,
    },
  });

  // Cleanup saved timeout on unmount
  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }
    };
  }, []);

  const saveSettings = useCallback(
    async (values: SettingsFormValues) => {
      setSaveStatus('saving');

      // Clear any existing saved timeout
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
        savedTimeoutRef.current = null;
      }

      try {
        const updates = flattenSettingsValues(values);
        await bulkUpdateMutation.mutateAsync(updates);
        setSaveStatus('saved');
        onSuccess?.();

        // Reset to idle after 2 seconds
        savedTimeoutRef.current = setTimeout(() => {
          setSaveStatus('idle');
          savedTimeoutRef.current = null;
        }, 2000);
      } catch {
        setSaveStatus('error');
        toast.error({
          description: 'Failed to save settings. Please try again.',
          title: 'Error',
        });
      }
    },
    [bulkUpdateMutation, onSuccess, toast]
  );

  const { debounced: debouncedSave } = useDebouncedCallback(saveSettings, {
    delay: 500,
  });

  // Subscribe to form value changes for auto-save
  useEffect(() => {
    const unsubscribe = form.store.subscribe(() => {
      // Skip the initial subscription trigger
      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;
        return;
      }

      const state = form.store.state;

      // Only save if form is valid (no errors)
      if (state.isValid) {
        debouncedSave(state.values);
      }
    });

    return unsubscribe;
  }, [form.store, debouncedSave]);

  return (
    <div>
      <div className={'flex flex-col gap-6'}>
        {/* Auto-save status indicator */}
        <div className={'flex justify-end'}>
          <AutoSaveStatus state={saveStatus} />
        </div>

        {/* UI Settings Section */}
        <UISettingsSection />

        {/* Workflow Settings Section */}
        <WorkflowSettingsSection form={form as unknown as WorkflowFormApi} />

        {/* Worktree Settings Section */}
        <WorktreeSettingsSection form={form as unknown as WorktreeFormApi} />

        {/* Terminal Settings Section */}
        <TerminalSettingsSection form={form as unknown as TerminalFormApi} />

        {/* Chat Settings Section */}
        <ChatSettingsSection form={form as unknown as ChatFormApi} />

        {/* Logging Settings Section */}
        <LoggingSettingsSection form={form as unknown as LoggingFormApi} />

        {/* Debug Settings Section */}
        <DebugSettingsSection />
      </div>
    </div>
  );
};

'use client';

import type { SettingsFormValues } from '@/lib/validations/settings';
import type { Setting } from '@/types/electron';

import { QueryErrorBoundary } from '@/components/data/query-error-boundary';
import { SettingsForm, SettingsSkeleton } from '@/components/settings';
import { useSettings } from '@/hooks/queries/use-settings';

/**
 * Settings page - Main entry point for application settings configuration.
 *
 * Features:
 * - Workflow settings (pause behavior, step timeout)
 * - Worktree settings (location, auto-cleanup, branch behavior)
 * - Logging settings (retention, export options)
 * - UI settings (theme selection)
 * - Loading skeleton during data fetch
 * - Error boundary for error handling with retry
 */
export default function SettingsPage() {
  // Data fetching
  const { data: settings, isLoading } = useSettings();

  // Transform settings array to form values structure
  const formValues = settings ? transformSettingsToFormValues(settings) : null;

  return (
    <div className={'space-y-6'}>
      {/* Page heading */}
      <div className={'space-y-1'}>
        <h1 className={'text-2xl font-semibold tracking-tight'}>{'Settings'}</h1>
        <p className={'text-muted-foreground'}>{'Manage your application preferences and configuration.'}</p>
      </div>

      {/* Settings content */}
      <QueryErrorBoundary>
        {isLoading ? (
          // Loading skeleton while fetching settings
          <SettingsSkeleton />
        ) : formValues ? (
          // Settings form with current values
          <SettingsForm initialValues={formValues} />
        ) : (
          // Fallback if no settings data (should not normally happen)
          <SettingsSkeleton />
        )}
      </QueryErrorBoundary>
    </div>
  );
}

/**
 * Converts an array of Setting objects from the database into the nested
 * SettingsFormValues structure required by the form.
 *
 * Settings are stored as flat key-value pairs in the database with keys like
 * "workflow.defaultPauseBehavior" or "worktree.autoCleanup". This function
 * transforms them into the nested structure:
 * {
 *   workflow: { defaultPauseBehavior: "...", clarificationTimeoutSeconds: 60, ... },
 *   worktree: { autoCleanup: true, ... },
 *   logging: { ... }
 * }
 */
function transformSettingsToFormValues(settings: Array<Setting>): SettingsFormValues {
  // Create a map for quick lookup by key
  const settingsMap = new Map<string, string>();
  for (const setting of settings) {
    settingsMap.set(setting.key, setting.value);
  }

  // Helper to get a string value with a default
  const getString = (key: string, defaultValue: string): string => {
    return settingsMap.get(key) ?? defaultValue;
  };

  // Helper to get a number value with a default
  const getNumber = (key: string, defaultValue: number): number => {
    const value = settingsMap.get(key);
    if (value === undefined) return defaultValue;
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  };

  // Helper to get a boolean value with a default
  const getBoolean = (key: string, defaultValue: boolean): boolean => {
    const value = settingsMap.get(key);
    if (value === undefined) return defaultValue;
    return value === 'true';
  };

  return {
    logging: {
      exportLogsWithDatabase: getBoolean('logging.exportLogsWithDatabase', true),
      includeCliOutput: getBoolean('logging.includeCliOutput', true),
      logExportLocation: getString('logging.logExportLocation', ''),
      logRetentionDays: getNumber('logging.logRetentionDays', 30),
    },
    workflow: {
      clarificationTimeoutSeconds: getNumber('workflow.clarificationTimeoutSeconds', 60),
      defaultPauseBehavior: getString('workflow.defaultPauseBehavior', 'auto-pause') as
        | 'auto-pause'
        | 'continuous'
        | 'quality-gates',
      discoveryTimeoutSeconds: getNumber('workflow.discoveryTimeoutSeconds', 120),
      implementationTimeoutSeconds: getNumber('workflow.implementationTimeoutSeconds', 300),
      planningTimeoutSeconds: getNumber('workflow.planningTimeoutSeconds', 180),
      refinementTimeoutSeconds: getNumber('workflow.refinementTimeoutSeconds', 30),
    },
    worktree: {
      autoCleanup: getBoolean('worktree.autoCleanup', true),
      createFeatureBranch: getBoolean('worktree.createFeatureBranch', true),
      pushOnCompletion: getBoolean('worktree.pushOnCompletion', false),
      worktreeLocation: getString('worktree.worktreeLocation', ''),
    },
  };
}

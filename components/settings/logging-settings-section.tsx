"use client";

import type { ReactElement } from "react";

import { SettingsSection } from "./settings-section";

interface LoggingSettingsSectionProps {
  form: SettingsFormApi;
}

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
      PathInputField: (props: {
        description?: string;
        isRequired?: boolean;
        label: string;
        placeholder?: string;
      }) => ReactElement;
      SwitchField: (props: {
        description?: string;
        label: string;
      }) => ReactElement;
    }) => ReactElement;
    name: TName;
  }) => ReactElement;
}

export const LoggingSettingsSection = ({
  form,
}: LoggingSettingsSectionProps): ReactElement => {
  return (
    <SettingsSection title={"Logging & Audit"}>
      {/* Log Retention Days */}
      <form.AppField name={"logging.logRetentionDays"}>
        {(field) => (
          <field.NumberField
            description={
              "Number of days to retain workflow logs before automatic cleanup"
            }
            label={"Log Retention (days)"}
            max={365}
            min={1}
            step={1}
          />
        )}
      </form.AppField>

      {/* Export Logs With Database */}
      <form.AppField name={"logging.exportLogsWithDatabase"}>
        {(field) => (
          <field.SwitchField
            description={
              "Include database records when exporting workflow logs"
            }
            label={"Export Logs with Database"}
          />
        )}
      </form.AppField>

      {/* Include CLI Output */}
      <form.AppField name={"logging.includeCliOutput"}>
        {(field) => (
          <field.SwitchField
            description={"Include raw CLI output in exported log files"}
            label={"Include CLI Output"}
          />
        )}
      </form.AppField>

      {/* Log Export Location */}
      <form.AppField name={"logging.logExportLocation"}>
        {(field) => (
          <field.PathInputField
            description={"Directory where exported log files will be saved"}
            isRequired={true}
            label={"Log Export Location"}
            placeholder={"Select a directory for log exports"}
          />
        )}
      </form.AppField>
    </SettingsSection>
  );
};

export type { LoggingSettingsSectionProps, SettingsFormApi };

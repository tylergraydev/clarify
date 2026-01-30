"use client";

import type { ReactElement } from "react";

import { useBulkUpdateSettings } from "@/hooks/queries/use-settings";
import { useToast } from "@/hooks/use-toast";
import { useAppForm } from "@/lib/forms";
import {
  settingsFormSchema,
  type SettingsFormValues,
} from "@/lib/validations/settings";

import type { SettingsFormApi as LoggingFormApi } from "./logging-settings-section";
import type { SettingsFormApi as WorkflowFormApi } from "./workflow-settings-section";
import type { SettingsFormApi as WorktreeFormApi } from "./worktree-settings-section";

import { LoggingSettingsSection } from "./logging-settings-section";
import { UISettingsSection } from "./ui-settings-section";
import { WorkflowSettingsSection } from "./workflow-settings-section";
import { WorktreeSettingsSection } from "./worktree-settings-section";

interface SettingsFormProps {
  initialValues: SettingsFormValues;
  onSuccess?: () => void;
}

/**
 * Helper function to convert nested settings form values into flat key-value pairs
 * for the bulk update mutation.
 */
function flattenSettingsValues(
  values: SettingsFormValues
): Array<{ key: string; value: string }> {
  const updates: Array<{ key: string; value: string }> = [];

  // Workflow settings
  updates.push({
    key: "workflow.clarificationTimeoutSeconds",
    value: String(values.workflow.clarificationTimeoutSeconds),
  });
  updates.push({
    key: "workflow.defaultPauseBehavior",
    value: values.workflow.defaultPauseBehavior,
  });
  updates.push({
    key: "workflow.discoveryTimeoutSeconds",
    value: String(values.workflow.discoveryTimeoutSeconds),
  });
  updates.push({
    key: "workflow.implementationTimeoutSeconds",
    value: String(values.workflow.implementationTimeoutSeconds),
  });
  updates.push({
    key: "workflow.planningTimeoutSeconds",
    value: String(values.workflow.planningTimeoutSeconds),
  });
  updates.push({
    key: "workflow.refinementTimeoutSeconds",
    value: String(values.workflow.refinementTimeoutSeconds),
  });

  // Worktree settings
  updates.push({
    key: "worktree.autoCleanup",
    value: String(values.worktree.autoCleanup),
  });
  updates.push({
    key: "worktree.createFeatureBranch",
    value: String(values.worktree.createFeatureBranch),
  });
  updates.push({
    key: "worktree.pushOnCompletion",
    value: String(values.worktree.pushOnCompletion),
  });
  updates.push({
    key: "worktree.worktreeLocation",
    value: values.worktree.worktreeLocation,
  });

  // Logging settings
  updates.push({
    key: "logging.exportLogsWithDatabase",
    value: String(values.logging.exportLogsWithDatabase),
  });
  updates.push({
    key: "logging.includeCliOutput",
    value: String(values.logging.includeCliOutput),
  });
  updates.push({
    key: "logging.logExportLocation",
    value: values.logging.logExportLocation,
  });
  updates.push({
    key: "logging.logRetentionDays",
    value: String(values.logging.logRetentionDays),
  });

  return updates;
}

export const SettingsForm = ({
  initialValues,
  onSuccess,
}: SettingsFormProps): ReactElement => {
  const toast = useToast();
  const bulkUpdateMutation = useBulkUpdateSettings();

  const form = useAppForm({
    defaultValues: initialValues,
    onSubmit: async ({ value }) => {
      try {
        const updates = flattenSettingsValues(value);
        await bulkUpdateMutation.mutateAsync(updates);
        toast.success({
          description: "Your settings have been saved.",
          title: "Settings saved",
        });
        onSuccess?.();
      } catch {
        toast.error({
          description: "Failed to save settings. Please try again.",
          title: "Error",
        });
      }
    },
    validators: {
      onSubmit: settingsFormSchema,
    },
  });

  const isSubmitting = bulkUpdateMutation.isPending;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <div className={"flex flex-col gap-6"}>
        {/* Workflow Settings Section */}
        <WorkflowSettingsSection form={form as unknown as WorkflowFormApi} />

        {/* Worktree Settings Section */}
        <WorktreeSettingsSection form={form as unknown as WorktreeFormApi} />

        {/* Logging Settings Section */}
        <LoggingSettingsSection form={form as unknown as LoggingFormApi} />

        {/* UI Settings Section */}
        <UISettingsSection />

        {/* Form Actions */}
        <div className={"flex justify-end"}>
          <form.AppForm>
            <form.SubmitButton>
              {isSubmitting ? "Saving..." : "Save Settings"}
            </form.SubmitButton>
          </form.AppForm>
        </div>
      </div>
    </form>
  );
};

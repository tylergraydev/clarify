"use client";

import type { ReactNode } from "react";

import { useEffect, useState } from "react";

import type { UpdateAgentFormValues } from "@/lib/validations/agent";
import type { Agent } from "@/types/electron";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useResetAgent, useUpdateAgent } from "@/hooks/queries/use-agents";
import { useAppForm } from "@/lib/forms/form-hook";
import { updateAgentSchema } from "@/lib/validations/agent";

interface ProjectAgentEditorDialogProps {
  /** The agent to edit */
  agent: Agent;
  /** Callback when agent is successfully updated */
  onSuccess?: () => void;
  /** The project ID for context */
  projectId: number;
  /** The trigger element that opens the dialog */
  trigger: ReactNode;
}

export const ProjectAgentEditorDialog = ({
  agent,
  onSuccess,
  projectId,
  trigger,
}: ProjectAgentEditorDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateAgentMutation = useUpdateAgent();
  const resetAgentMutation = useResetAgent();

  const isSubmitting = updateAgentMutation.isPending;
  const isResetting = resetAgentMutation.isPending;
  const isBuiltIn = agent.builtInAt !== null;
  const isProjectOverride = agent.projectId === projectId;
  const isCustomized = agent.parentAgentId !== null;

  const form = useAppForm({
    defaultValues: {
      description: agent.description ?? "",
      displayName: agent.displayName,
      systemPrompt: agent.systemPrompt,
    } satisfies UpdateAgentFormValues,
    onSubmit: async ({ value }) => {
      try {
        await updateAgentMutation.mutateAsync({
          data: {
            description: value.description,
            displayName: value.displayName,
            projectId: projectId,
            systemPrompt: value.systemPrompt,
          },
          id: agent.id,
        });
        handleClose();
        onSuccess?.();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to update agent. Please try again.";
        throw new Error(message);
      }
    },
    validators: {
      onSubmit: updateAgentSchema,
    },
  });

  useEffect(() => {
    form.reset({
      description: agent.description ?? "",
      displayName: agent.displayName,
      systemPrompt: agent.systemPrompt,
    });
  }, [agent, form]);

  const handleClose = () => {
    setIsOpen(false);
    form.reset();
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset();
    }
  };

  const handleResetToGlobalDefaults = async () => {
    try {
      await resetAgentMutation.mutateAsync(agent.id);
      handleClose();
      onSuccess?.();
    } catch {
      // Error handled by mutation
    }
  };

  const agentTypeLabel =
    agent.type === "planning"
      ? "Planning"
      : agent.type === "specialist"
        ? "Specialist"
        : "Review";

  return (
    <DialogRoot onOpenChange={handleOpenChange} open={isOpen}>
      {/* Trigger */}
      <DialogTrigger>{trigger}</DialogTrigger>

      {/* Portal */}
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className={"max-w-2xl"}>
          {/* Header */}
          <div className={"flex items-start justify-between gap-4"}>
            <div>
              <DialogTitle>{"Edit Project Agent"}</DialogTitle>
              <DialogDescription>
                {
                  "Customize the agent's configuration for this project. Changes only affect this project."
                }
              </DialogDescription>
            </div>
            <div className={"flex shrink-0 flex-wrap items-center gap-2"}>
              {isBuiltIn && <Badge variant={"default"}>{"Built-in"}</Badge>}
              <Badge variant={"default"}>{agentTypeLabel}</Badge>
            </div>
          </div>

          {/* Project Override Indicator */}
          <div
            className={
              "mt-4 flex items-center gap-2 rounded-md border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-600 dark:text-blue-400"
            }
          >
            <svg
              className={"size-4 shrink-0"}
              fill={"none"}
              stroke={"currentColor"}
              strokeWidth={2}
              viewBox={"0 0 24 24"}
              xmlns={"http://www.w3.org/2000/svg"}
            >
              <path
                d={"M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"}
                strokeLinecap={"round"}
                strokeLinejoin={"round"}
              />
            </svg>
            <span>
              {isProjectOverride
                ? "This is a project-level configuration override."
                : "Editing will create a project-level override of this agent."}
            </span>
          </div>

          {/* Base Agent Info Display */}
          <div
            className={"mt-4 rounded-md border border-border bg-muted/50 p-3"}
          >
            <div className={"flex items-center gap-3"}>
              {agent.color && (
                <div
                  className={"size-4 rounded-full"}
                  style={{ backgroundColor: agent.color }}
                />
              )}
              <div className={"text-sm"}>
                <span className={"text-muted-foreground"}>
                  {"Internal name: "}
                </span>
                <span className={"font-mono text-foreground"}>
                  {agent.name}
                </span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form
            className={"mt-6"}
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <div className={"flex flex-col gap-4"}>
              {/* Display Name */}
              <form.AppField name={"displayName"}>
                {(field) => (
                  <field.TextField
                    label={"Display Name"}
                    placeholder={"Enter display name"}
                  />
                )}
              </form.AppField>

              {/* Description */}
              <form.AppField name={"description"}>
                {(field) => (
                  <field.TextareaField
                    description={"A brief description of what this agent does"}
                    label={"Description"}
                    placeholder={"Describe the agent's purpose..."}
                    rows={3}
                  />
                )}
              </form.AppField>

              {/* System Prompt */}
              <form.AppField name={"systemPrompt"}>
                {(field) => (
                  <field.TextareaField
                    description={
                      "The system prompt that defines how this agent behaves for this project"
                    }
                    label={"System Prompt"}
                    placeholder={"Enter the system prompt..."}
                    rows={12}
                  />
                )}
              </form.AppField>

              {/* Action Buttons */}
              <div className={"mt-2 flex justify-between"}>
                {/* Reset Button - only for project overrides or customized agents */}
                <div>
                  {(isProjectOverride || isCustomized) && (
                    <Button
                      disabled={isSubmitting || isResetting}
                      onClick={handleResetToGlobalDefaults}
                      type={"button"}
                      variant={"outline"}
                    >
                      {isResetting
                        ? "Resetting..."
                        : "Reset to Global Defaults"}
                    </Button>
                  )}
                </div>

                {/* Cancel and Save Buttons */}
                <div className={"flex gap-3"}>
                  <DialogClose>
                    <Button
                      disabled={isSubmitting || isResetting}
                      type={"button"}
                      variant={"outline"}
                    >
                      {"Cancel"}
                    </Button>
                  </DialogClose>
                  <form.AppForm>
                    <form.SubmitButton>
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </form.SubmitButton>
                  </form.AppForm>
                </div>
              </div>
            </div>
          </form>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};

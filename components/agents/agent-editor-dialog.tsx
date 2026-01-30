"use client";

import { ReactNode, useEffectEvent } from "react";
import { useEffect, useState } from "react";

import type { Agent } from "@/types/electron";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { agentColors } from "@/db/schema/agents.schema";
import { useResetAgent, useUpdateAgent } from "@/hooks/queries/use-agents";
import { useAppForm } from "@/lib/forms/form-hook";
import { updateAgentSchema } from "@/lib/validations/agent";

import { AgentColorPicker } from "./agent-color-picker";
import { AgentSkillsManager } from "./agent-skills-manager";
import { AgentToolsManager } from "./agent-tools-manager";

type AgentColor = (typeof agentColors)[number];

interface AgentEditorDialogProps {
  /** The agent to edit */
  agent: Agent;
  /** Callback when agent is successfully updated */
  onSuccess?: () => void;
  /** The trigger element that opens the dialog */
  trigger: ReactNode;
}

export const AgentEditorDialog = ({
  agent,
  onSuccess,
  trigger,
}: AgentEditorDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<AgentColor | null>(
    (agent.color as AgentColor) ?? null
  );

  const updateAgentMutation = useUpdateAgent();
  const resetAgentMutation = useResetAgent();

  const isSubmitting = updateAgentMutation.isPending;
  const isResetting = resetAgentMutation.isPending;
  const isBuiltIn = agent.builtInAt !== null;
  const isCustomized = agent.parentAgentId !== null;

  const form = useAppForm({
    defaultValues: {
      description: agent.description ?? "",
      displayName: agent.displayName,
      systemPrompt: agent.systemPrompt,
    },
    onSubmit: async ({ value }) => {
      await updateAgentMutation.mutateAsync({
        data: {
          color: selectedColor,
          description: value.description,
          displayName: value.displayName,
          systemPrompt: value.systemPrompt,
        },
        id: agent.id,
      });
      handleClose();
      onSuccess?.();
    },
    validators: {
      onSubmit: updateAgentSchema,
    },
  });

  const updateSelectedColor = useEffectEvent(
    (agentColor: AgentColor | null) => {
      setSelectedColor(agentColor);
    }
  );

  // Reset form and color when agent changes
  // Note: updateSelectedColor is excluded from deps because it's a useEffectEvent (stable identity)
  useEffect(() => {
    form.reset({
      description: agent.description ?? "",
      displayName: agent.displayName,
      systemPrompt: agent.systemPrompt,
    });
    updateSelectedColor((agent.color as AgentColor) ?? null);
  }, [agent, form]);

  const handleClose = () => {
    setIsOpen(false);
    form.reset();
    setSelectedColor((agent.color as AgentColor) ?? null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset();
      setSelectedColor((agent.color as AgentColor) ?? null);
    }
  };

  const handleResetToDefault = async () => {
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
        <DialogPopup className={"max-h-[90vh] max-w-2xl overflow-y-auto"}>
          {/* Header */}
          <div className={"flex items-start justify-between gap-4"}>
            <div>
              <DialogTitle>{"Edit Agent"}</DialogTitle>
              <DialogDescription>
                {
                  "Customize the agent's display name, description, and system prompt."
                }
              </DialogDescription>
            </div>
            <div className={"flex shrink-0 items-center gap-2"}>
              {isBuiltIn && (
                <Badge variant={"default"}>{"Built-in Agent"}</Badge>
              )}
              <Badge variant={"default"}>{agentTypeLabel}</Badge>
            </div>
          </div>

          {/* Agent Info Display */}
          <div
            className={"mt-4 rounded-md border border-border bg-muted/50 p-3"}
          >
            <div className={"flex items-center gap-3"}>
              {selectedColor && (
                <div
                  className={"size-4 rounded-full"}
                  style={{
                    backgroundColor:
                      selectedColor === "blue"
                        ? "#3b82f6"
                        : selectedColor === "cyan"
                          ? "#06b6d4"
                          : selectedColor === "green"
                            ? "#22c55e"
                            : selectedColor === "red"
                              ? "#ef4444"
                              : selectedColor === "yellow"
                                ? "#eab308"
                                : "#6b7280",
                  }}
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

              {/* Color Picker */}
              <AgentColorPicker
                disabled={isSubmitting || isResetting}
                onChange={setSelectedColor}
                value={selectedColor}
              />

              {/* System Prompt */}
              <form.AppField name={"systemPrompt"}>
                {(field) => (
                  <field.TextareaField
                    description={
                      "The system prompt that defines how this agent behaves"
                    }
                    label={"System Prompt"}
                    placeholder={"Enter the system prompt..."}
                    rows={12}
                  />
                )}
              </form.AppField>

              {/* Tools Section */}
              <Collapsible className={"rounded-md border border-border"}>
                <CollapsibleTrigger
                  className={"w-full justify-start px-3 py-2"}
                >
                  {"Allowed Tools"}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className={"border-t border-border p-3"}>
                    <AgentToolsManager
                      agentId={agent.id}
                      disabled={isSubmitting || isResetting}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Skills Section */}
              <Collapsible className={"rounded-md border border-border"}>
                <CollapsibleTrigger
                  className={"w-full justify-start px-3 py-2"}
                >
                  {"Referenced Skills"}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className={"border-t border-border p-3"}>
                    <AgentSkillsManager
                      agentId={agent.id}
                      disabled={isSubmitting || isResetting}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Action Buttons */}
              <div className={"mt-2 flex justify-between"}>
                {/* Reset Button - only for customized agents */}
                <div>
                  {isCustomized && (
                    <Button
                      disabled={isSubmitting || isResetting}
                      onClick={handleResetToDefault}
                      type={"button"}
                      variant={"outline"}
                    >
                      {isResetting ? "Resetting..." : "Reset to Default"}
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

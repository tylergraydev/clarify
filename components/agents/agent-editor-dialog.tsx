"use client";

import type { ReactNode } from "react";

import { useCallback, useEffect, useEffectEvent, useState } from "react";

import type {
  CreateAgentFormData,
  UpdateAgentFormValues,
} from "@/lib/validations/agent";
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
import { agentColors, agentTypes } from "@/db/schema/agents.schema";
import {
  useCreateAgent,
  useResetAgent,
  useUpdateAgent,
} from "@/hooks/queries/use-agents";
import { getAgentColorHex } from "@/lib/colors/agent-colors";
import { useAppForm } from "@/lib/forms/form-hook";
import {
  createAgentFormSchema,
  updateAgentSchema,
} from "@/lib/validations/agent";

import { AgentColorPicker } from "./agent-color-picker";
import { AgentSkillsManager } from "./agent-skills-manager";
import { AgentToolsManager } from "./agent-tools-manager";
import { ConfirmResetAgentDialog } from "./confirm-reset-agent-dialog";

type AgentColor = (typeof agentColors)[number];
interface AgentEditorDialogProps {
  /** The agent to edit (required for edit mode) */
  agent?: Agent;
  /** Initial data for pre-filling the form (used in create mode for duplicating) */
  initialData?: AgentInitialData;
  /** The mode of the editor */
  mode: EditorMode;
  /** Callback when agent is successfully saved */
  onSuccess?: () => void;
  /** The trigger element that opens the dialog */
  trigger: ReactNode;
}
/**
 * Initial data for creating an agent, typically used when duplicating.
 * Differs from Agent in that it doesn't include id, timestamps, or version.
 */
interface AgentInitialData {
  color?: AgentColor | null;
  description?: string;
  displayName: string;
  name: string;
  systemPrompt: string;
  type: AgentType;
}

type AgentType = (typeof agentTypes)[number];

type EditorMode = "create" | "edit";

const AGENT_TYPE_OPTIONS = agentTypes.map((type) => ({
  label: type.charAt(0).toUpperCase() + type.slice(1),
  value: type,
}));

export const AgentEditorDialog = ({
  agent,
  initialData,
  mode,
  onSuccess,
  trigger,
}: AgentEditorDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<AgentColor | null>(null);

  const createAgentMutation = useCreateAgent();
  const updateAgentMutation = useUpdateAgent();
  const resetAgentMutation = useResetAgent();

  const isSubmitting =
    createAgentMutation.isPending || updateAgentMutation.isPending;
  const isResetting = resetAgentMutation.isPending;
  const isEditMode = mode === "edit";
  const isBuiltIn = agent?.builtInAt !== null;
  const isCustomized = agent?.parentAgentId !== null;
  const isDuplicateMode = mode === "create" && initialData !== undefined;

  // Determine validation schema based on mode
  const validationSchema = isEditMode
    ? updateAgentSchema
    : createAgentFormSchema;

  // Determine default values based on mode and initialData
  const getDefaultValues = useCallback(():
    | CreateAgentFormData
    | UpdateAgentFormValues => {
    if (isEditMode && agent) {
      return {
        description: agent.description ?? "",
        displayName: agent.displayName,
        systemPrompt: agent.systemPrompt,
      };
    }
    if (initialData) {
      return {
        description: initialData.description ?? "",
        displayName: initialData.displayName,
        name: initialData.name,
        systemPrompt: initialData.systemPrompt,
        type: initialData.type,
      };
    }
    return {
      description: "",
      displayName: "",
      name: "",
      systemPrompt: "",
      type: "specialist" as AgentType,
    };
  }, [isEditMode, agent, initialData]);

  const form = useAppForm({
    defaultValues: getDefaultValues(),
    onSubmit: async ({ value }) => {
      if (isEditMode && agent) {
        // Update existing agent
        await updateAgentMutation.mutateAsync({
          data: {
            color: selectedColor,
            description: (value as UpdateAgentFormValues).description,
            displayName: (value as UpdateAgentFormValues).displayName,
            systemPrompt: (value as UpdateAgentFormValues).systemPrompt,
          },
          id: agent.id,
        });
      } else {
        // Create new agent
        const createValue = value as CreateAgentFormData;
        await createAgentMutation.mutateAsync({
          color: selectedColor,
          description: createValue.description,
          displayName: createValue.displayName,
          name: createValue.name,
          systemPrompt: createValue.systemPrompt,
          type: createValue.type,
        });
      }
      handleClose();
      onSuccess?.();
    },
    validators: {
      onSubmit: validationSchema,
    },
  });

  const updateSelectedColor = useEffectEvent(
    (agentColor: AgentColor | null) => {
      setSelectedColor(agentColor);
    }
  );

  // Reset form and color when agent or initialData changes
  useEffect(() => {
    form.reset(getDefaultValues());
    if (isEditMode && agent) {
      updateSelectedColor((agent.color as AgentColor) ?? null);
    } else if (initialData) {
      updateSelectedColor(initialData.color ?? null);
    } else {
      updateSelectedColor(null);
    }
  }, [agent, initialData, form, getDefaultValues, isEditMode]);

  const getInitialColor = useCallback((): AgentColor | null => {
    if (isEditMode && agent) {
      return (agent.color as AgentColor) ?? null;
    }
    if (initialData) {
      return initialData.color ?? null;
    }
    return null;
  }, [isEditMode, agent, initialData]);

  const resetFormAndColor = useCallback(() => {
    form.reset(getDefaultValues());
    setSelectedColor(getInitialColor());
  }, [form, getDefaultValues, getInitialColor]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    resetFormAndColor();
  }, [resetFormAndColor]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (open) {
        // Reset form to ensure it has latest values
        form.reset(getDefaultValues());
        setSelectedColor(getInitialColor());
      } else {
        resetFormAndColor();
      }
    },
    [resetFormAndColor, getDefaultValues, getInitialColor, form]
  );

  const handleResetClick = () => {
    setIsResetDialogOpen(true);
  };

  const handleConfirmReset = async () => {
    if (!agent) return;
    try {
      await resetAgentMutation.mutateAsync(agent.id);
      setIsResetDialogOpen(false);
      handleClose();
      onSuccess?.();
    } catch {
      // Error handled by mutation
    }
  };

  const agentTypeLabel = agent
    ? agent.type === "planning"
      ? "Planning"
      : agent.type === "specialist"
        ? "Specialist"
        : "Review"
    : null;

  const dialogTitle = isEditMode
    ? "Edit Agent"
    : isDuplicateMode
      ? "Duplicate Agent"
      : "Create Agent";

  const dialogDescription = isEditMode
    ? "Customize the agent's display name, description, and system prompt."
    : isDuplicateMode
      ? "Create a copy of the agent with your modifications."
      : "Create a new custom agent with a unique name, type, and system prompt.";

  const submitLabel = isEditMode
    ? isSubmitting
      ? "Saving..."
      : "Save Changes"
    : isSubmitting
      ? "Creating..."
      : "Create Agent";

  return (
    <DialogRoot onOpenChange={handleOpenChange} open={isOpen}>
      {/* Trigger */}
      <DialogTrigger>{trigger}</DialogTrigger>

      {/* Portal */}
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup
          aria-modal={"true"}
          className={"max-h-[90vh] max-w-2xl overflow-y-auto"}
          role={"dialog"}
        >
          {/* Header */}
          <div className={"flex items-start justify-between gap-4"}>
            <div>
              <DialogTitle id={"agent-editor-title"}>{dialogTitle}</DialogTitle>
              <DialogDescription id={"agent-editor-description"}>
                {dialogDescription}
              </DialogDescription>
            </div>
            <div className={"flex shrink-0 items-center gap-2"}>
              {isEditMode && isBuiltIn && (
                <Badge variant={"default"}>{"Built-in Agent"}</Badge>
              )}
              {isEditMode && !isBuiltIn && (
                <Badge variant={"custom"}>{"Custom Agent"}</Badge>
              )}
              {isEditMode && agentTypeLabel && (
                <Badge variant={"default"}>{agentTypeLabel}</Badge>
              )}
            </div>
          </div>

          {/* Agent Info Display (Edit Mode Only) */}
          {isEditMode && agent && (
            <div
              className={"mt-4 rounded-md border border-border bg-muted/50 p-3"}
            >
              <div className={"flex items-center gap-3"}>
                {selectedColor && (
                  <div
                    className={"size-4 rounded-full"}
                    style={{ backgroundColor: getAgentColorHex(selectedColor) }}
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
          )}

          {/* Form */}
          <form
            aria-describedby={"agent-editor-description"}
            aria-labelledby={"agent-editor-title"}
            className={"mt-6"}
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <fieldset
              className={"flex flex-col gap-4"}
              disabled={isSubmitting || isResetting}
            >
              <legend className={"sr-only"}>{"Agent details"}</legend>

              {/* Name Field (Create Mode Only) */}
              {!isEditMode && (
                <form.AppField name={"name"}>
                  {(field) => (
                    <field.TextField
                      autoFocus={!isDuplicateMode}
                      description={
                        "A unique identifier using lowercase letters, numbers, and hyphens (e.g., my-custom-agent)"
                      }
                      label={"Agent Name"}
                      placeholder={"my-custom-agent"}
                    />
                  )}
                </form.AppField>
              )}

              {/* Type Field (Create Mode Only) */}
              {!isEditMode && (
                <form.AppField name={"type"}>
                  {(field) => (
                    <field.SelectField
                      description={
                        "Planning agents handle workflow planning, specialist agents perform specific tasks, review agents validate outputs"
                      }
                      label={"Agent Type"}
                      options={AGENT_TYPE_OPTIONS}
                      placeholder={"Select agent type"}
                    />
                  )}
                </form.AppField>
              )}

              {/* Display Name */}
              <form.AppField name={"displayName"}>
                {(field) => (
                  <field.TextField
                    autoFocus={isEditMode || isDuplicateMode}
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

              {/* Tools Section (Edit Mode Only) */}
              {isEditMode && agent && (
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
              )}

              {/* Skills Section (Edit Mode Only) */}
              {isEditMode && agent && (
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
              )}

              {/* Action Buttons */}
              <div className={"mt-2 flex justify-between"}>
                {/* Reset Button - only for customized agents in edit mode */}
                <div>
                  {isEditMode && isCustomized && (
                    <Button
                      disabled={isSubmitting || isResetting}
                      onClick={handleResetClick}
                      type={"button"}
                      variant={"outline"}
                    >
                      {"Reset to Default"}
                    </Button>
                  )}
                </div>

                {/* Cancel and Save Buttons */}
                <div
                  aria-label={"Dialog actions"}
                  className={"flex gap-3"}
                  role={"group"}
                >
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
                    <form.SubmitButton>{submitLabel}</form.SubmitButton>
                  </form.AppForm>
                </div>
              </div>
            </fieldset>
          </form>
        </DialogPopup>
      </DialogPortal>

      {/* Reset Confirmation Dialog (Edit Mode Only) */}
      {isEditMode && agent && (
        <ConfirmResetAgentDialog
          agentName={agent.displayName}
          isLoading={isResetting}
          isOpen={isResetDialogOpen}
          onConfirm={handleConfirmReset}
          onOpenChange={setIsResetDialogOpen}
        />
      )}
    </DialogRoot>
  );
};

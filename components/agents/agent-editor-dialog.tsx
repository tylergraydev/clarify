"use client";

import type { ReactNode } from "react";

import {
  Fragment,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from "react";

import type { AgentToolType } from "@/lib/constants/claude-tools";
import type {
  CreateAgentFormData,
  UpdateAgentFormValues,
} from "@/lib/validations/agent";
import type { PendingSkillData } from "@/types/agent-skills";
import type { CreateToolData, ToolSelection } from "@/types/agent-tools";
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
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  descriptionVariants,
  fieldWrapperVariants,
  labelVariants,
} from "@/components/ui/form/field-wrapper";
import {
  SelectItem,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { agentColors, agentTypes } from "@/db/schema/agents.schema";
import {
  useCreateAgentSkill,
  useSetAgentSkillRequired,
} from "@/hooks/queries/use-agent-skills";
import {
  useAgentTools,
  useAllowAgentTool,
  useCreateAgentTool,
  useDeleteAgentTool,
  useDisallowAgentTool,
} from "@/hooks/queries/use-agent-tools";
import {
  useCreateAgent,
  useMoveAgent,
  useResetAgent,
  useUpdateAgent,
} from "@/hooks/queries/use-agents";
import { useProject, useProjects } from "@/hooks/queries/use-projects";
import { getAgentColorHex } from "@/lib/colors/agent-colors";
import {
  CLAUDE_BUILTIN_TOOLS,
  getDefaultToolsForAgentType,
  isBuiltinTool,
} from "@/lib/constants/claude-tools";
import { useAppForm } from "@/lib/forms/form-hook";
import {
  createAgentFormSchema,
  updateAgentSchema,
} from "@/lib/validations/agent";

import { AgentColorPicker } from "./agent-color-picker";
import { AgentSkillsManager } from "./agent-skills-manager";
import { AgentSkillsSection } from "./agent-skills-section";
import { AgentToolsSection } from "./agent-tools-section";
import { ConfirmResetAgentDialog } from "./confirm-reset-agent-dialog";

type AgentColor = (typeof agentColors)[number];
interface AgentEditorDialogProps {
  /** The agent to edit (required for edit mode) */
  agent?: Agent;
  /** Initial data for pre-filling the form (used in create mode for duplicating) */
  initialData?: AgentInitialData;
  /** Controlled open state (optional - if provided, component is controlled) */
  isOpen?: boolean;
  /** The mode of the editor */
  mode: EditorMode;
  /** Callback when open state changes (optional - for controlled mode) */
  onOpenChange?: (open: boolean) => void;
  /** Callback when agent is successfully saved */
  onSuccess?: () => void;
  /** Optional project ID for creating project-scoped agents (create mode only) */
  projectId?: number;
  /** The trigger element that opens the dialog (optional when using controlled mode) */
  trigger?: ReactNode;
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

// Constant for global project option value
const GLOBAL_PROJECT_VALUE = "__global__";

export const AgentEditorDialog = ({
  agent,
  initialData,
  isOpen: controlledIsOpen,
  mode,
  onOpenChange: controlledOnOpenChange,
  onSuccess,
  projectId,
  trigger,
}: AgentEditorDialogProps) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Determine if component is controlled
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;
  const setIsOpen = useMemo(
    () =>
      isControlled
        ? (open: boolean) => controlledOnOpenChange?.(open)
        : setInternalIsOpen,
    [isControlled, controlledOnOpenChange]
  );
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<"" | AgentColor>("");
  const [selectedProjectId, setSelectedProjectId] = useState<null | number>(
    null
  );

  // Tool state for both create and edit modes
  const [toolSelections, setToolSelections] = useState<Array<ToolSelection>>(
    []
  );
  const [customTools, setCustomTools] = useState<Array<CreateToolData>>([]);

  // Skill state for create mode
  const [pendingSkills, setPendingSkills] = useState<Array<PendingSkillData>>(
    []
  );

  const createAgentMutation = useCreateAgent();
  const updateAgentMutation = useUpdateAgent();
  const resetAgentMutation = useResetAgent();

  // Tool mutations for edit mode
  const createToolMutation = useCreateAgentTool();
  const deleteToolMutation = useDeleteAgentTool();
  const allowToolMutation = useAllowAgentTool();
  const disallowToolMutation = useDisallowAgentTool();

  // Skill mutations for create mode
  const createSkillMutation = useCreateAgentSkill();
  const setSkillRequiredMutation = useSetAgentSkillRequired();

  // Move agent mutation for edit mode
  const moveAgentMutation = useMoveAgent();

  // Fetch existing tools for edit mode
  const existingToolsQuery = useAgentTools(agent?.id ?? 0);
  const existingTools = existingToolsQuery.data;

  // Fetch all projects for the project assignment dropdown
  const projectsQuery = useProjects();

  // Fetch project data when projectId is provided (for displaying project context)
  const projectQuery = useProject(projectId ?? 0);

  // Build project options for the SelectField
  const projectOptions = useMemo(() => {
    const projectsData = projectsQuery.data ?? [];
    const options = [
      { label: "Global (all projects)", value: GLOBAL_PROJECT_VALUE },
    ];

    // Add active (non-archived) projects
    for (const project of projectsData) {
      if (!project.archivedAt) {
        options.push({
          label: project.name,
          value: String(project.id),
        });
      }
    }

    return options;
  }, [projectsQuery.data]);

  const isSubmitting =
    createAgentMutation.isPending || updateAgentMutation.isPending;
  const isMoving = moveAgentMutation.isPending;
  const isResetting = resetAgentMutation.isPending;
  const isEditMode = mode === "edit";
  const isBuiltIn = agent?.builtInAt !== null;
  const isCustomized = agent?.parentAgentId !== null;
  const isDuplicateMode = mode === "create" && initialData !== undefined;
  const isProjectScoped = !isEditMode && projectId !== undefined;
  // View-only mode for built-in agents in edit mode
  const isViewMode = isEditMode && isBuiltIn && !isCustomized;
  // Show reset button only for customized agents in edit mode, but not in view mode
  const isResetButtonVisible = isEditMode && isCustomized && !isViewMode;
  // Disabled state for project selector
  const isProjectSelectorDisabled = isEditMode
    ? isSubmitting || isResetting || isMoving || isViewMode
    : isSubmitting || isResetting;

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
        color:
          (initialData.color as AgentColor) ?? ("" as unknown as AgentColor),
        description: initialData.description ?? "",
        displayName: initialData.displayName,
        name: initialData.name,
        systemPrompt: initialData.systemPrompt,
        type: initialData.type,
      };
    }
    return {
      color: "" as unknown as AgentColor,
      description: "",
      displayName: "",
      name: "",
      systemPrompt: "",
      type: "specialist" as AgentType,
    };
  }, [isEditMode, agent, initialData]);

  // Initialize tool defaults for create mode
  const initializeToolDefaults = useCallback((type: AgentToolType) => {
    const defaultTools = getDefaultToolsForAgentType(type);

    const selections: Array<ToolSelection> = CLAUDE_BUILTIN_TOOLS.map(
      (tool) => ({
        enabled: defaultTools.includes(tool.name),
        pattern: "*",
        toolName: tool.name,
      })
    );

    setToolSelections(selections);
    setCustomTools([]);
  }, []);

  // Get tools to save (for create mode submission)
  const getToolsToSave = useCallback((): Array<CreateToolData> => {
    const result: Array<CreateToolData> = [];

    // Add enabled built-in tools
    for (const selection of toolSelections) {
      if (selection.enabled) {
        result.push({
          pattern: selection.pattern,
          toolName: selection.toolName,
        });
      }
    }

    // Add custom tools
    result.push(...customTools);

    return result;
  }, [toolSelections, customTools]);

  const form = useAppForm({
    defaultValues: getDefaultValues(),
    onSubmit: async ({ value }) => {
      if (isEditMode && agent) {
        // Update existing agent
        await updateAgentMutation.mutateAsync({
          data: {
            color: selectedColor === "" ? null : selectedColor,
            description: (value as UpdateAgentFormValues).description,
            displayName: (value as UpdateAgentFormValues).displayName,
            systemPrompt: (value as UpdateAgentFormValues).systemPrompt,
          },
          id: agent.id,
        });

        // If project changed, move the agent
        const originalProjectId = agent.projectId ?? null;
        if (selectedProjectId !== originalProjectId) {
          await moveAgentMutation.mutateAsync({
            agentId: agent.id,
            targetProjectId: selectedProjectId,
          });
        }
      } else {
        // Create new agent with tools
        const createValue = value as CreateAgentFormData;
        // Use selectedProjectId state which tracks the dropdown value
        // This allows users to override the initial projectId prop via the dropdown
        const effectiveProjectId = selectedProjectId;
        const result = await createAgentMutation.mutateAsync({
          color: createValue.color,
          description: createValue.description,
          displayName: createValue.displayName,
          name: createValue.name,
          projectId: effectiveProjectId,
          systemPrompt: createValue.systemPrompt,
          type: createValue.type,
        });

        // If agent was created successfully, create tools and skills
        if (result.success && result.agent) {
          const toolsToSave = getToolsToSave();
          for (const tool of toolsToSave) {
            await createToolMutation.mutateAsync({
              agentId: result.agent.id,
              toolName: tool.toolName,
              toolPattern: tool.pattern,
            });
          }

          // Create skills for the new agent
          for (const skill of pendingSkills) {
            const createdSkill = await createSkillMutation.mutateAsync({
              agentId: result.agent.id,
              skillName: skill.skillName,
            });
            // Set required status if needed
            if (skill.isRequired && createdSkill) {
              await setSkillRequiredMutation.mutateAsync({
                id: createdSkill.id,
                required: true,
              });
            }
          }
        }
      }
      handleClose();
      onSuccess?.();
    },
    validators: {
      onSubmit: validationSchema,
    },
  });

  const updateSelectedColor = useEffectEvent((agentColor: "" | AgentColor) => {
    setSelectedColor(agentColor);
  });

  const setToolDefaults = useEffectEvent((type: AgentToolType) => {
    initializeToolDefaults(type);
  });

  const updateToolSelections = useEffectEvent(
    (selections: Array<ToolSelection>) => {
      setToolSelections(selections);
    }
  );

  const updateCustomTools = useEffectEvent((tools: Array<CreateToolData>) => {
    setCustomTools(tools);
  });

  const updateSelectedProjectId = useEffectEvent(
    (newProjectId: null | number) => {
      setSelectedProjectId(newProjectId);
    }
  );

  // Reset form, color, and project when agent or initialData changes
  useEffect(() => {
    form.reset(getDefaultValues());
    if (isEditMode && agent) {
      updateSelectedColor((agent.color as AgentColor) ?? "");
      updateSelectedProjectId(agent.projectId ?? null);
    } else if (initialData) {
      updateSelectedColor(initialData.color ?? "");
      // For create mode (including duplicate), initialize with projectId prop or null
      updateSelectedProjectId(projectId ?? null);
    } else {
      updateSelectedColor("");
      // For create mode, initialize with projectId prop or null
      updateSelectedProjectId(projectId ?? null);
    }
  }, [agent, initialData, form, getDefaultValues, isEditMode, projectId]);

  // Initialize tools when dialog opens
  useEffect(() => {
    if (!isOpen) return;

    if (!isEditMode) {
      // Create mode: initialize from defaults based on agent type
      const type = initialData?.type ?? "specialist";
      setToolDefaults(type);
    }
  }, [isEditMode, isOpen, initialData, initializeToolDefaults]);

  // Initialize tools from existing database records (edit mode)
  useEffect(() => {
    if (!isOpen || !isEditMode || !existingTools) return;

    const builtinSelections: Array<ToolSelection> = [];
    const customToolsList: Array<CreateToolData> = [];

    for (const tool of existingTools) {
      if (isBuiltinTool(tool.toolName)) {
        builtinSelections.push({
          enabled: tool.disallowedAt === null,
          pattern: tool.toolPattern,
          toolName: tool.toolName,
        });
      } else {
        // Only add custom tools that are allowed
        if (tool.disallowedAt === null) {
          customToolsList.push({
            pattern: tool.toolPattern,
            toolName: tool.toolName,
          });
        }
      }
    }

    // Ensure all built-in tools have an entry (disabled if not in existingTools)
    for (const tool of CLAUDE_BUILTIN_TOOLS) {
      if (!builtinSelections.some((s) => s.toolName === tool.name)) {
        builtinSelections.push({
          enabled: false,
          pattern: "*",
          toolName: tool.name,
        });
      }
    }

    updateToolSelections(builtinSelections);
    updateCustomTools(customToolsList);
  }, [isOpen, isEditMode, existingTools]);

  const getInitialColor = useCallback((): "" | AgentColor => {
    if (isEditMode && agent) {
      return (agent.color as AgentColor) ?? "";
    }
    if (initialData) {
      return initialData.color ?? "";
    }
    return "";
  }, [isEditMode, agent, initialData]);

  const getInitialProjectId = useCallback((): null | number => {
    if (isEditMode && agent) {
      return agent.projectId ?? null;
    }
    // For create mode, use the projectId prop if provided
    return projectId ?? null;
  }, [isEditMode, agent, projectId]);

  const resetFormState = useCallback(() => {
    form.reset(getDefaultValues());
    setSelectedColor(getInitialColor());
    setSelectedProjectId(getInitialProjectId());
    // Reset tools and skills state
    if (!isEditMode) {
      const type = initialData?.type ?? "specialist";
      initializeToolDefaults(type);
      setPendingSkills([]);
    }
  }, [
    form,
    getDefaultValues,
    getInitialColor,
    getInitialProjectId,
    isEditMode,
    initialData,
    initializeToolDefaults,
  ]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    resetFormState();
  }, [resetFormState, setIsOpen]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (open) {
        // Reset form to ensure it has latest values
        form.reset(getDefaultValues());
        setSelectedColor(getInitialColor());
        setSelectedProjectId(getInitialProjectId());
        // Reset tools and skills for create mode
        if (!isEditMode) {
          const type = initialData?.type ?? "specialist";
          initializeToolDefaults(type);
          setPendingSkills([]);
        }
      } else {
        resetFormState();
      }
    },
    [
      setIsOpen,
      resetFormState,
      getDefaultValues,
      getInitialColor,
      getInitialProjectId,
      form,
      isEditMode,
      initialData,
      initializeToolDefaults,
    ]
  );

  const handleResetClick = () => {
    setIsResetDialogOpen(true);
  };

  const handleConfirmReset = async () => {
    if (!agent) return;
    try {
      await resetAgentMutation.mutateAsync({
        id: agent.id,
        projectId: agent.projectId ?? undefined,
      });
      setIsResetDialogOpen(false);
      handleClose();
      onSuccess?.();
    } catch {
      // Error handled by mutation
    }
  };

  // Handle agent type change in create mode - reset tool defaults
  const handleAgentTypeChange = useCallback(
    (newType: string) => {
      const type = newType as AgentToolType;
      initializeToolDefaults(type);
    },
    [initializeToolDefaults]
  );

  // Handle project change - only update local state, save on form submit
  const handleProjectChange = useCallback((newValue: string) => {
    const newProjectId =
      newValue === GLOBAL_PROJECT_VALUE ? null : Number(newValue);
    setSelectedProjectId(newProjectId);
  }, []);

  // Handle tool changes in edit mode - sync to database
  const handleEditModeToolSelectionsChange = useCallback(
    async (newSelections: Array<ToolSelection>) => {
      if (!agent || !existingTools) return;

      // For each selection change, update the database
      for (const selection of newSelections) {
        const existingTool = existingTools.find(
          (t) => t.toolName === selection.toolName
        );

        if (existingTool) {
          // Tool exists - toggle allow/disallow based on enabled state
          const isCurrentlyAllowed = existingTool.disallowedAt === null;
          if (selection.enabled && !isCurrentlyAllowed) {
            await allowToolMutation.mutateAsync(existingTool.id);
          } else if (!selection.enabled && isCurrentlyAllowed) {
            await disallowToolMutation.mutateAsync(existingTool.id);
          }
        } else if (selection.enabled) {
          // Tool doesn't exist and is enabled - create it
          await createToolMutation.mutateAsync({
            agentId: agent.id,
            toolName: selection.toolName,
            toolPattern: selection.pattern,
          });
        }
      }

      setToolSelections(newSelections);
    },
    [
      agent,
      existingTools,
      allowToolMutation,
      disallowToolMutation,
      createToolMutation,
    ]
  );

  // Handle custom tool changes in edit mode
  const handleEditModeCustomToolsChange = useCallback(
    async (newCustomTools: Array<CreateToolData>) => {
      if (!agent || !existingTools) return;

      // Find tools to add (in newCustomTools but not in existingTools)
      for (const tool of newCustomTools) {
        const exists = existingTools.some((t) => t.toolName === tool.toolName);
        if (!exists) {
          await createToolMutation.mutateAsync({
            agentId: agent.id,
            toolName: tool.toolName,
            toolPattern: tool.pattern,
          });
        }
      }

      // Find tools to remove (in existingTools but not in newCustomTools, and not built-in)
      for (const existingTool of existingTools) {
        if (isBuiltinTool(existingTool.toolName)) continue;

        const stillExists = newCustomTools.some(
          (t) => t.toolName === existingTool.toolName
        );
        if (!stillExists) {
          await deleteToolMutation.mutateAsync({
            agentId: agent.id,
            id: existingTool.id,
          });
        }
      }

      setCustomTools(newCustomTools);
    },
    [agent, existingTools, createToolMutation, deleteToolMutation]
  );

  const agentTypeLabel = agent
    ? agent.type === "planning"
      ? "Planning"
      : agent.type === "specialist"
        ? "Specialist"
        : "Review"
    : null;

  const dialogTitle = isViewMode
    ? "View Agent"
    : isEditMode
      ? "Edit Agent"
      : isDuplicateMode
        ? "Duplicate Agent"
        : "Create Agent";

  const dialogDescription = isViewMode
    ? "View the built-in agent configuration. Duplicate to create an editable copy."
    : isEditMode
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

  const isEditAgent = isEditMode && agent;

  return (
    <DialogRoot onOpenChange={handleOpenChange} open={isOpen}>
      {/* Trigger - only render when provided (uncontrolled mode) */}
      {trigger && <DialogTrigger>{trigger}</DialogTrigger>}

      {/* Portal */}
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup
          aria-modal={"true"}
          role={"dialog"}
          scrollable={true}
          size={"xl"}
        >
          {/* Header */}
          <DialogHeader
            badges={
              <Fragment>
                {/* Project Scope Indicator (Create Mode Only) */}
                {isProjectScoped && projectQuery.data && (
                  <Badge variant={"project"}>
                    {`Project: ${projectQuery.data.name}`}
                  </Badge>
                )}
                {isEditMode && isBuiltIn && (
                  <Badge variant={"default"}>{"Built-in Agent"}</Badge>
                )}
                {isEditMode && !isBuiltIn && (
                  <Badge variant={"custom"}>{"Custom Agent"}</Badge>
                )}
                {isEditMode && agentTypeLabel && (
                  <Badge variant={"default"}>{agentTypeLabel}</Badge>
                )}
              </Fragment>
            }
          >
            <DialogTitle id={"agent-editor-title"}>{dialogTitle}</DialogTitle>
            <DialogDescription id={"agent-editor-description"}>
              {dialogDescription}
            </DialogDescription>
          </DialogHeader>

          {/* Form wraps DialogBody + DialogFooter for submit to work */}
          <form
            aria-describedby={"agent-editor-description"}
            aria-labelledby={"agent-editor-title"}
            className={"flex min-h-0 flex-1 flex-col"}
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void form.handleSubmit();
            }}
          >
            {/* Scrollable Content */}
            <DialogBody className={"px-2"}>
              {/* Agent Info Display (Edit Mode Only) */}
              {isEditMode && agent && (
                <div
                  className={"rounded-md border border-border bg-muted/50 p-3"}
                >
                  <div className={"flex items-center gap-3"}>
                    {selectedColor && (
                      <div
                        className={"size-4 rounded-full"}
                        style={{
                          backgroundColor: getAgentColorHex(selectedColor),
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
              )}

              <fieldset
                className={"mt-4 flex flex-col gap-4"}
                disabled={isSubmitting || isResetting || isViewMode}
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
                        isRequired
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
                        onChange={handleAgentTypeChange}
                        options={AGENT_TYPE_OPTIONS}
                        placeholder={"Select agent type"}
                      />
                    )}
                  </form.AppField>
                )}

                {/* Project Assignment Field */}
                <div className={fieldWrapperVariants()}>
                  <label className={labelVariants()}>{"Project Assignment"}</label>
                  <SelectRoot
                    disabled={isProjectSelectorDisabled}
                    onValueChange={
                      isEditMode
                        ? (newValue: null | string) => {
                            if (newValue !== null) {
                              void handleProjectChange(newValue);
                            }
                          }
                        : (newValue: null | string) => {
                            // For create mode, update local state
                            if (newValue === null) return;
                            const newProjectId =
                              newValue === GLOBAL_PROJECT_VALUE
                                ? null
                                : Number(newValue);
                            setSelectedProjectId(newProjectId);
                          }
                    }
                    value={
                      selectedProjectId === null
                        ? GLOBAL_PROJECT_VALUE
                        : String(selectedProjectId)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={"Select project"} />
                    </SelectTrigger>
                    <SelectPortal>
                      <SelectPositioner>
                        <SelectPopup>
                          <SelectList>
                            {projectOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectList>
                        </SelectPopup>
                      </SelectPositioner>
                    </SelectPortal>
                  </SelectRoot>
                  <span className={descriptionVariants()}>
                    {isEditMode
                      ? "Move this agent to a different project or make it global"
                      : "Assign this agent to a specific project or make it available globally"}
                  </span>
                </div>

                {/* Display Name */}
                <form.AppField name={"displayName"}>
                  {(field) => (
                    <field.TextField
                      autoFocus={isEditMode || isDuplicateMode}
                      isRequired
                      label={"Display Name"}
                      placeholder={"Enter display name"}
                    />
                  )}
                </form.AppField>

                {/* Description */}
                <form.AppField name={"description"}>
                  {(field) => (
                    <field.TextareaField
                      description={
                        "A brief description of what this agent does"
                      }
                      label={"Description"}
                      placeholder={"Describe the agent's purpose..."}
                      rows={3}
                    />
                  )}
                </form.AppField>

                {/* Color Picker - Form field for create mode, standalone for edit mode */}
                {!isEditMode ? (
                  <form.AppField name={"color"}>
                    {(field) => (
                      <field.ColorPickerField
                        isDisabled={isSubmitting || isResetting}
                        isRequired
                        label={"Color Tag"}
                      />
                    )}
                  </form.AppField>
                ) : (
                  <AgentColorPicker
                    disabled={isSubmitting || isResetting}
                    label={"Color Tag"}
                    onChange={setSelectedColor}
                    value={selectedColor}
                  />
                )}

                {/* System Prompt */}
                <form.AppField name={"systemPrompt"}>
                  {(field) => (
                    <field.TextareaField
                      description={
                        "The system prompt that defines how this agent behaves"
                      }
                      isRequired
                      label={"System Prompt"}
                      placeholder={"Enter the system prompt..."}
                      rows={12}
                    />
                  )}
                </form.AppField>
              </fieldset>

              {/* Collapsible sections outside fieldset so they can be expanded in view mode */}
              <div className={"mt-4 flex flex-col gap-4"}>
                {/* Tools Section - Show in both create and edit modes */}
                <Collapsible
                  className={"rounded-md border border-border"}
                  defaultOpen={!isEditMode}
                >
                  <CollapsibleTrigger
                    className={"w-full justify-start px-3 py-2"}
                  >
                    {"Allowed Tools"}
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className={"border-t border-border p-3"}>
                      <AgentToolsSection
                        customTools={customTools}
                        disabled={isSubmitting || isResetting || isViewMode}
                        onCustomToolsChange={
                          isEditMode
                            ? handleEditModeCustomToolsChange
                            : setCustomTools
                        }
                        onToolSelectionsChange={
                          isEditMode
                            ? handleEditModeToolSelectionsChange
                            : setToolSelections
                        }
                        toolSelections={toolSelections}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Skills Section - Show in both create and edit modes */}
                <Collapsible className={"rounded-md border border-border"}>
                  <CollapsibleTrigger
                    className={"w-full justify-start px-3 py-2"}
                  >
                    {"Referenced Skills"}
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className={"border-t border-border p-3"}>
                      {isEditAgent ? (
                        <AgentSkillsManager
                          agentId={agent.id}
                          disabled={isSubmitting || isResetting || isViewMode}
                        />
                      ) : (
                        <AgentSkillsSection
                          disabled={isSubmitting || isResetting}
                          onSkillsChange={setPendingSkills}
                          skills={pendingSkills}
                        />
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </DialogBody>

            {/* Sticky Footer */}
            <DialogFooter alignment={"between"}>
              {/* Reset Button - only for customized agents in edit mode, hidden in view mode */}
              <div>
                {isResetButtonVisible && (
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
              <div className={"flex gap-3"}>
                <DialogClose>
                  <Button
                    disabled={isSubmitting || isResetting}
                    type={"button"}
                    variant={"outline"}
                  >
                    {isViewMode ? "Close" : "Cancel"}
                  </Button>
                </DialogClose>
                {!isViewMode && (
                  <form.AppForm>
                    <form.SubmitButton>{submitLabel}</form.SubmitButton>
                  </form.AppForm>
                )}
              </div>
            </DialogFooter>
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

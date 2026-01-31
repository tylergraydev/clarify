'use client';

import type { FormEvent, ReactNode } from 'react';

import { Fragment, memo, useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react';

import type { AgentToolType } from '@/lib/constants/claude-tools';
import type { CreateAgentFormData, UpdateAgentFormValues } from '@/lib/validations/agent';
import type { PendingSkillData } from '@/types/agent-skills';
import type { CreateToolData, ToolSelection } from '@/types/agent-tools';
import type { Agent } from '@/types/electron';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
} from '@/components/ui/dialog';
import { agentColors, agentTypes } from '@/db/schema/agents.schema';
import { useAgentEditorState } from '@/hooks/agents/use-agent-editor-state';
import { useCreateAgentHook } from '@/hooks/queries/use-agent-hooks';
import {
  useAgentSkills,
  useCreateAgentSkill,
  useDeleteAgentSkill,
  useSetAgentSkillRequired,
} from '@/hooks/queries/use-agent-skills';
import {
  useAgentTools,
  useAllowAgentTool,
  useCreateAgentTool,
  useDeleteAgentTool,
  useDisallowAgentTool,
} from '@/hooks/queries/use-agent-tools';
import { useCreateAgent, useMoveAgent, useResetAgent, useUpdateAgent } from '@/hooks/queries/use-agents';
import { useProject, useProjects } from '@/hooks/queries/use-projects';
import { useControllableState } from '@/hooks/use-controllable-state';
import { getAgentColorHex } from '@/lib/colors/agent-colors';
import { CLAUDE_BUILTIN_TOOLS, getDefaultToolsForAgentType, isBuiltinTool } from '@/lib/constants/claude-tools';
import { useAppForm } from '@/lib/forms';
import { createAgentFormSchema, GLOBAL_PROJECT_VALUE, updateAgentSchema } from '@/lib/validations/agent';

import { type AgentHooksData, AgentHooksSection } from './agent-hooks-section';
import { AgentSkillsSection } from './agent-skills-section';
import { AgentToolsSection } from './agent-tools-section';
import { ConfirmDiscardDialog } from './confirm-discard-dialog';
import { ConfirmResetAgentDialog } from './confirm-reset-agent-dialog';

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

type EditorMode = 'create' | 'edit';

const AGENT_TYPE_OPTIONS = agentTypes.map((type) => ({
  label: type.charAt(0).toUpperCase() + type.slice(1),
  value: type,
}));

const MODEL_OPTIONS = [
  { label: 'Inherit', value: 'inherit' },
  { label: 'Sonnet', value: 'sonnet' },
  { label: 'Opus', value: 'opus' },
  { label: 'Haiku', value: 'haiku' },
];

const PERMISSION_MODE_OPTIONS = [
  { label: 'Default', value: 'default' },
  { label: 'Accept Edits', value: 'acceptEdits' },
  { label: "Don't Ask", value: 'dontAsk' },
  { label: 'Bypass Permissions', value: 'bypassPermissions' },
  { label: 'Plan', value: 'plan' },
];

/**
 * Props for the memoized tools collapsible section
 */
interface ToolsCollapsibleSectionProps {
  customTools: Array<CreateToolData>;
  isDisabled: boolean;
  onCustomToolsChange: (tools: Array<CreateToolData>) => void;
  onToolSelectionsChange: (selections: Array<ToolSelection>) => void;
  toolSelections: Array<ToolSelection>;
}

/**
 * Memoized tools collapsible section to prevent re-renders when parent state changes
 */
const ToolsCollapsibleSection = memo(function ToolsCollapsibleSection({
  customTools,
  isDisabled,
  onCustomToolsChange,
  onToolSelectionsChange,
  toolSelections,
}: ToolsCollapsibleSectionProps) {
  const enabledToolsCount = toolSelections.filter((s) => s.enabled).length + customTools.length;

  return (
    <Collapsible className={'rounded-md border border-border'}>
      <CollapsibleTrigger className={'w-full justify-start px-3 py-2'}>
        <span>{'Allowed Tools'}</span>
        <span className={'ml-auto text-xs text-muted-foreground'}>
          {enabledToolsCount}
          {' configured'}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className={'border-t border-border p-3'}>
          <AgentToolsSection
            customTools={customTools}
            isDisabled={isDisabled}
            onCustomToolsChange={onCustomToolsChange}
            onToolSelectionsChange={onToolSelectionsChange}
            toolSelections={toolSelections}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});

/**
 * Props for the memoized skills collapsible section
 */
interface SkillsCollapsibleSectionProps {
  isDisabled: boolean;
  onSkillsChange: (skills: Array<PendingSkillData>) => void;
  pendingSkills: Array<PendingSkillData>;
}

/**
 * Memoized skills collapsible section to prevent re-renders when parent state changes
 */
const SkillsCollapsibleSection = memo(function SkillsCollapsibleSection({
  isDisabled,
  onSkillsChange,
  pendingSkills,
}: SkillsCollapsibleSectionProps) {
  return (
    <Collapsible className={'rounded-md border border-border'}>
      <CollapsibleTrigger className={'w-full justify-start px-3 py-2'}>
        <span>{'Referenced Skills'}</span>
        <span className={'ml-auto text-xs text-muted-foreground'}>
          {pendingSkills.length}
          {' configured'}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className={'border-t border-border p-3'}>
          <AgentSkillsSection isDisabled={isDisabled} onSkillsChange={onSkillsChange} skills={pendingSkills} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});

/**
 * Props for the memoized hooks collapsible section
 */
interface HooksCollapsibleSectionProps {
  hooks: AgentHooksData;
  isDisabled: boolean;
  onHooksChange: (hooks: AgentHooksData) => void;
}

/**
 * Memoized hooks collapsible section to prevent re-renders when parent state changes
 * Note: AgentHooksSection already contains its own Collapsible, so we just wrap with border styling
 */
const HooksCollapsibleSection = memo(function HooksCollapsibleSection({
  hooks,
  isDisabled,
  onHooksChange,
}: HooksCollapsibleSectionProps) {
  return (
    <div className={'rounded-md border border-border'}>
      <AgentHooksSection hooks={hooks} isDisabled={isDisabled} onHooksChange={onHooksChange} />
    </div>
  );
});

/**
 * Dialog for creating and editing agents with full configuration options.
 * Supports both create and edit modes with controlled/uncontrolled open state.
 * Manages agent properties, tools, skills, and hooks configuration.
 *
 * @param props - Component props
 * @param props.agent - The agent to edit (required for edit mode)
 * @param props.initialData - Initial data for pre-filling the form (used in create mode for duplicating)
 * @param props.isOpen - Controlled open state (optional - if provided, component is controlled)
 * @param props.mode - The mode of the editor ('create' or 'edit')
 * @param props.onOpenChange - Callback when open state changes (optional - for controlled mode)
 * @param props.onSuccess - Callback when agent is successfully saved
 * @param props.projectId - Optional project ID for creating project-scoped agents (create mode only)
 * @param props.trigger - The trigger element that opens the dialog (optional when using controlled mode)
 */
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
  // State hooks
  const [isOpen, setIsOpen] = useControllableState({
    defaultValue: false,
    onChange: controlledOnOpenChange,
    value: controlledIsOpen,
  });
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [toolSelections, setToolSelections] = useState<Array<ToolSelection>>([]);
  const [customTools, setCustomTools] = useState<Array<CreateToolData>>([]);
  const [pendingSkills, setPendingSkills] = useState<Array<PendingSkillData>>([]);
  const [pendingHooks, setPendingHooks] = useState<AgentHooksData>({});

  // Mutation hooks
  const createAgentMutation = useCreateAgent();
  const updateAgentMutation = useUpdateAgent();
  const resetAgentMutation = useResetAgent();
  const createToolMutation = useCreateAgentTool();
  const deleteToolMutation = useDeleteAgentTool();
  const allowToolMutation = useAllowAgentTool();
  const disallowToolMutation = useDisallowAgentTool();
  const createSkillMutation = useCreateAgentSkill();
  const setSkillRequiredMutation = useSetAgentSkillRequired();
  const createHookMutation = useCreateAgentHook();
  const moveAgentMutation = useMoveAgent();
  const deleteSkillMutation = useDeleteAgentSkill();

  // Query hooks
  const existingToolsQuery = useAgentTools(agent?.id ?? 0);
  const existingSkillsQuery = useAgentSkills(agent?.id ?? 0);
  const projectsQuery = useProjects();
  const projectQuery = useProject(projectId ?? 0);

  // Derived data from queries
  const existingTools = existingToolsQuery.data;
  const existingSkills = existingSkillsQuery.data;

  // Derived state hook
  const derivedFlags = useAgentEditorState({
    agent,
    hasInitialData: initialData !== undefined,
    isCreatePending: createAgentMutation.isPending,
    isMovePending: moveAgentMutation.isPending,
    isResetPending: resetAgentMutation.isPending,
    isUpdatePending: updateAgentMutation.isPending,
    mode,
    projectId,
  });

  const {
    isBuiltIn,
    isCollapsibleDisabled,
    isDuplicateMode,
    isEditMode,
    isProjectScoped,
    isProjectSelectorDisabled,
    isResetButtonVisible,
    isResetting,
    isSubmitting,
    isViewMode,
  } = derivedFlags;

  // Memoized values
  const validationSchema = isEditMode ? updateAgentSchema : createAgentFormSchema;

  const projectOptions = useMemo(() => {
    const projectsData = projectsQuery.data ?? [];
    const options = [{ label: 'Global (all projects)', value: GLOBAL_PROJECT_VALUE }];

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

  const dialogLabels = useMemo(() => {
    const agentTypeLabel = agent
      ? agent.type === 'planning'
        ? 'Planning'
        : agent.type === 'specialist'
          ? 'Specialist'
          : 'Review'
      : null;

    const dialogTitle = isViewMode
      ? 'View Agent'
      : isEditMode
        ? 'Edit Agent'
        : isDuplicateMode
          ? 'Duplicate Agent'
          : 'Create Agent';

    const dialogDescription = isViewMode
      ? 'View the built-in agent configuration. Duplicate to create an editable copy.'
      : isEditMode
        ? "Customize the agent's display name, description, and system prompt."
        : isDuplicateMode
          ? 'Create a copy of the agent with your modifications.'
          : 'Create a new custom agent with a unique name, type, and system prompt.';

    const submitLabel = isEditMode
      ? isSubmitting
        ? 'Saving...'
        : 'Save Changes'
      : isSubmitting
        ? 'Creating...'
        : 'Create Agent';

    return {
      agentTypeLabel,
      dialogDescription,
      dialogTitle,
      submitLabel,
    };
  }, [agent, isDuplicateMode, isEditMode, isSubmitting, isViewMode]);

  // Utility functions
  const projectIdToFormValue = useCallback((id: null | number | undefined): string => {
    return id === null || id === undefined ? GLOBAL_PROJECT_VALUE : String(id);
  }, []);

  const formValueToProjectId = useCallback((value: string): null | number => {
    return value === GLOBAL_PROJECT_VALUE ? null : Number(value);
  }, []);

  const getDefaultValues = useCallback((): CreateAgentFormData | UpdateAgentFormValues => {
    if (isEditMode && agent) {
      return {
        color: (agent.color ?? '') as UpdateAgentFormValues['color'],
        description: agent.description ?? '',
        displayName: agent.displayName,
        model: (agent.model ?? 'inherit') as UpdateAgentFormValues['model'],
        permissionMode: (agent.permissionMode ?? 'default') as UpdateAgentFormValues['permissionMode'],
        projectId: projectIdToFormValue(agent.projectId),
        systemPrompt: agent.systemPrompt,
      };
    }
    if (initialData) {
      return {
        color: initialData.color ?? 'blue',
        description: initialData.description ?? '',
        displayName: initialData.displayName,
        model: 'inherit' as CreateAgentFormData['model'],
        name: initialData.name,
        permissionMode: 'default' as CreateAgentFormData['permissionMode'],
        projectId: projectIdToFormValue(projectId),
        systemPrompt: initialData.systemPrompt,
        type: initialData.type,
      } as CreateAgentFormData;
    }
    return {
      color: 'blue',
      description: '',
      displayName: '',
      model: 'inherit' as CreateAgentFormData['model'],
      name: '',
      permissionMode: 'default' as CreateAgentFormData['permissionMode'],
      projectId: projectIdToFormValue(projectId),
      systemPrompt: '',
      type: 'specialist' as AgentType,
    } as CreateAgentFormData;
  }, [isEditMode, agent, initialData, projectId, projectIdToFormValue]);

  const initializeToolDefaults = useCallback((type: AgentToolType) => {
    const defaultTools = getDefaultToolsForAgentType(type);

    const selections: Array<ToolSelection> = CLAUDE_BUILTIN_TOOLS.map((tool) => ({
      enabled: defaultTools.includes(tool.name),
      pattern: '*',
      toolName: tool.name,
    }));

    setToolSelections(selections);
    setCustomTools([]);
  }, []);

  const getToolsToSave = useCallback((): Array<CreateToolData> => {
    const result: Array<CreateToolData> = [];

    for (const selection of toolSelections) {
      if (selection.enabled) {
        result.push({
          pattern: selection.pattern,
          toolName: selection.toolName,
        });
      }
    }

    result.push(...customTools);

    return result;
  }, [toolSelections, customTools]);

  // Form initialization
  const form = useAppForm({
    defaultValues: getDefaultValues(),
    onSubmit: async ({ value }) => {
      if (isEditMode && agent) {
        const updateValue = value as UpdateAgentFormValues;
        const colorValue = updateValue.color === '' ? null : updateValue.color;
        const modelValue = updateValue.model === 'inherit' || updateValue.model === '' ? null : updateValue.model;
        const permissionModeValue = updateValue.permissionMode === '' ? null : updateValue.permissionMode;
        const selectedProjectId = formValueToProjectId(updateValue.projectId);

        await updateAgentMutation.mutateAsync({
          data: {
            color: colorValue,
            description: updateValue.description,
            displayName: updateValue.displayName,
            model: modelValue,
            permissionMode: permissionModeValue,
            systemPrompt: updateValue.systemPrompt,
          },
          id: agent.id,
        });

        const originalProjectId = agent.projectId ?? null;
        if (selectedProjectId !== originalProjectId) {
          await moveAgentMutation.mutateAsync({
            agentId: agent.id,
            showToast: false,
            targetProjectId: selectedProjectId,
          });
        }

        if (existingTools) {
          const toolTogglePromises: Array<Promise<unknown>> = [];
          const toolCreatePromises: Array<Promise<unknown>> = [];

          for (const selection of toolSelections) {
            const existingTool = existingTools.find((t) => t.toolName === selection.toolName);

            if (existingTool) {
              const isCurrentlyAllowed = existingTool.disallowedAt === null;
              if (selection.enabled && !isCurrentlyAllowed) {
                toolTogglePromises.push(allowToolMutation.mutateAsync({ id: existingTool.id, showToast: false }));
              } else if (!selection.enabled && isCurrentlyAllowed) {
                toolTogglePromises.push(disallowToolMutation.mutateAsync({ id: existingTool.id, showToast: false }));
              }
            } else if (selection.enabled) {
              toolCreatePromises.push(
                createToolMutation.mutateAsync({
                  agentId: agent.id,
                  showToast: false,
                  toolName: selection.toolName,
                  toolPattern: selection.pattern,
                })
              );
            }
          }

          for (const tool of customTools) {
            const exists = existingTools.some((t) => t.toolName === tool.toolName);
            if (!exists) {
              toolCreatePromises.push(
                createToolMutation.mutateAsync({
                  agentId: agent.id,
                  showToast: false,
                  toolName: tool.toolName,
                  toolPattern: tool.pattern,
                })
              );
            }
          }

          const toolDeletePromises: Array<Promise<unknown>> = [];
          for (const existingTool of existingTools) {
            if (isBuiltinTool(existingTool.toolName)) continue;

            const stillExists = customTools.some((t) => t.toolName === existingTool.toolName);
            if (!stillExists) {
              toolDeletePromises.push(
                deleteToolMutation.mutateAsync({
                  agentId: agent.id,
                  id: existingTool.id,
                  showToast: false,
                })
              );
            }
          }

          await Promise.all([...toolTogglePromises, ...toolCreatePromises, ...toolDeletePromises]);
        }

        if (existingSkills) {
          const skillCreatePromises: Array<Promise<unknown>> = [];
          const skillUpdatePromises: Array<Promise<unknown>> = [];
          const skillDeletePromises: Array<Promise<unknown>> = [];

          for (const skill of pendingSkills) {
            const existingSkill = existingSkills.find((s) => s.skillName === skill.skillName);
            if (!existingSkill) {
              const createAndSetRequired = async () => {
                const createdSkill = await createSkillMutation.mutateAsync({
                  agentId: agent.id,
                  showToast: false,
                  skillName: skill.skillName,
                });
                if (skill.isRequired && createdSkill?.result) {
                  await setSkillRequiredMutation.mutateAsync({
                    id: createdSkill.result.id,
                    required: true,
                    showToast: false,
                  });
                }
              };
              skillCreatePromises.push(createAndSetRequired());
            } else {
              const wasRequired = existingSkill.requiredAt !== null;
              if (skill.isRequired !== wasRequired) {
                skillUpdatePromises.push(
                  setSkillRequiredMutation.mutateAsync({
                    id: existingSkill.id,
                    required: skill.isRequired,
                    showToast: false,
                  })
                );
              }
            }
          }

          for (const existingSkill of existingSkills) {
            const stillExists = pendingSkills.some((s) => s.skillName === existingSkill.skillName);
            if (!stillExists) {
              skillDeletePromises.push(
                deleteSkillMutation.mutateAsync({
                  agentId: agent.id,
                  id: existingSkill.id,
                  showToast: false,
                })
              );
            }
          }

          await Promise.all([...skillCreatePromises, ...skillUpdatePromises, ...skillDeletePromises]);
        }
      } else {
        const createValue = value as CreateAgentFormData;
        const effectiveProjectId = formValueToProjectId(createValue.projectId);
        const modelValue = createValue.model === 'inherit' || createValue.model === '' ? null : createValue.model;
        const permissionModeValue = createValue.permissionMode === '' ? null : createValue.permissionMode;
        const createdAgent = await createAgentMutation.mutateAsync({
          color: createValue.color,
          description: createValue.description,
          displayName: createValue.displayName,
          model: modelValue,
          name: createValue.name,
          permissionMode: permissionModeValue,
          projectId: effectiveProjectId,
          systemPrompt: createValue.systemPrompt,
          type: createValue.type,
        });

        const toolsToSave = getToolsToSave();
        await Promise.all(
          toolsToSave.map((tool) =>
            createToolMutation.mutateAsync({
              agentId: createdAgent.id,
              showToast: false,
              toolName: tool.toolName,
              toolPattern: tool.pattern,
            })
          )
        );

        await Promise.all(
          pendingSkills.map(async (skill) => {
            const createdSkill = await createSkillMutation.mutateAsync({
              agentId: createdAgent.id,
              showToast: false,
              skillName: skill.skillName,
            });
            if (skill.isRequired && createdSkill?.result) {
              await setSkillRequiredMutation.mutateAsync({
                id: createdSkill.result.id,
                required: true,
                showToast: false,
              });
            }
          })
        );

        const hookEventTypes = ['PreToolUse', 'PostToolUse', 'Stop'] as const;
        const hookPromises: Array<Promise<unknown>> = [];
        for (const eventType of hookEventTypes) {
          const entries = pendingHooks[eventType];
          if (entries && entries.length > 0) {
            for (const [index, entry] of entries.entries()) {
              hookPromises.push(
                createHookMutation.mutateAsync({
                  agentId: createdAgent.id,
                  body: entry.body,
                  eventType,
                  matcher: entry.matcher,
                  orderIndex: index,
                  showToast: false,
                })
              );
            }
          }
        }
        await Promise.all(hookPromises);
      }
      handleClose();
      onSuccess?.();
    },
    validators: {
      onSubmit: validationSchema,
    },
  });

  // Effect event handlers (stable references for effects)
  const setToolDefaults = useEffectEvent((type: AgentToolType) => {
    initializeToolDefaults(type);
  });

  const updateToolSelections = useEffectEvent((selections: Array<ToolSelection>) => {
    setToolSelections(selections);
  });

  const updateCustomTools = useEffectEvent((tools: Array<CreateToolData>) => {
    setCustomTools(tools);
  });

  const updatePendingSkills = useEffectEvent((skills: Array<PendingSkillData>) => {
    setPendingSkills(skills);
  });

  // Reset form state utility
  const resetFormState = useCallback(() => {
    form.reset(getDefaultValues());
    if (!isEditMode) {
      const type = initialData?.type ?? 'specialist';
      initializeToolDefaults(type);
      setPendingSkills([]);
      setPendingHooks({});
    }
  }, [form, getDefaultValues, isEditMode, initialData, initializeToolDefaults]);

  // Effects
  useEffect(() => {
    form.reset(getDefaultValues());
  }, [agent, initialData, form, getDefaultValues]);

  useEffect(() => {
    if (!isOpen) return;

    if (!isEditMode) {
      const type = initialData?.type ?? 'specialist';
      setToolDefaults(type);
    }
  }, [isEditMode, isOpen, initialData?.type]);

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
        if (tool.disallowedAt === null) {
          customToolsList.push({
            pattern: tool.toolPattern,
            toolName: tool.toolName,
          });
        }
      }
    }

    for (const tool of CLAUDE_BUILTIN_TOOLS) {
      if (!builtinSelections.some((s) => s.toolName === tool.name)) {
        builtinSelections.push({
          enabled: false,
          pattern: '*',
          toolName: tool.name,
        });
      }
    }

    updateToolSelections(builtinSelections);
    updateCustomTools(customToolsList);
  }, [isOpen, isEditMode, existingTools]);

  useEffect(() => {
    if (!isOpen || !isEditMode || !existingSkills) return;

    const pendingSkillsData: Array<PendingSkillData> = existingSkills.map((skill) => ({
      isRequired: skill.requiredAt !== null,
      skillName: skill.skillName,
    }));

    updatePendingSkills(pendingSkillsData);
  }, [isOpen, isEditMode, existingSkills]);

  // Event handlers
  const handleClose = useCallback(() => {
    setIsOpen(false);
    resetFormState();
  }, [resetFormState, setIsOpen]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && form.state.isDirty) {
        setIsDiscardDialogOpen(true);
        return;
      }
      setIsOpen(open);
      if (open) {
        form.reset(getDefaultValues());
        if (!isEditMode) {
          const type = initialData?.type ?? 'specialist';
          initializeToolDefaults(type);
          setPendingSkills([]);
          setPendingHooks({});
        }
      } else {
        resetFormState();
      }
    },
    [setIsOpen, resetFormState, getDefaultValues, form, isEditMode, initialData, initializeToolDefaults]
  );

  const handleConfirmDiscard = useCallback(() => {
    setIsDiscardDialogOpen(false);
    setIsOpen(false);
    resetFormState();
  }, [resetFormState, setIsOpen]);

  const handleResetClick = useCallback(() => {
    setIsResetDialogOpen(true);
  }, []);

  const handleConfirmReset = useCallback(async () => {
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
  }, [agent, handleClose, onSuccess, resetAgentMutation]);

  const handleAgentTypeChange = useCallback(
    (newType: string) => {
      const type = newType as AgentToolType;
      initializeToolDefaults(type);
    },
    [initializeToolDefaults]
  );

  const handleFormSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      void form.handleSubmit();
    },
    [form]
  );

  // Derived values for render
  const { agentTypeLabel, dialogDescription, dialogTitle, submitLabel } = dialogLabels;

  return (
    <DialogRoot onOpenChange={handleOpenChange} open={isOpen}>
      {/* Dialog Trigger */}
      {trigger && <DialogTrigger>{trigger}</DialogTrigger>}

      {/* Dialog Portal */}
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup aria-modal={'true'} role={'dialog'} scrollable={true} size={'xl'}>
          {/* Dialog Header */}
          <DialogHeader
            badges={
              <Fragment>
                {/* Project Scope Badge */}
                {isProjectScoped && projectQuery.data && (
                  <Badge variant={'project'}>{`Project: ${projectQuery.data.name}`}</Badge>
                )}
                {/* Agent Type Badges */}
                {isEditMode && isBuiltIn && <Badge variant={'default'}>{'Built-in Agent'}</Badge>}
                {isEditMode && !isBuiltIn && <Badge variant={'custom'}>{'Custom Agent'}</Badge>}
                {isEditMode && agentTypeLabel && <Badge variant={'default'}>{agentTypeLabel}</Badge>}
              </Fragment>
            }
            isCloseDisabled={isSubmitting || isResetting}
          >
            <DialogTitle id={'agent-editor-title'}>{dialogTitle}</DialogTitle>
            <DialogDescription id={'agent-editor-description'}>{dialogDescription}</DialogDescription>
          </DialogHeader>

          {/* Agent Editor Form */}
          <form
            aria-describedby={'agent-editor-description'}
            aria-labelledby={'agent-editor-title'}
            className={'flex min-h-0 flex-1 flex-col'}
            onSubmit={handleFormSubmit}
          >
            {/* Scrollable Content */}
            <DialogBody className={'px-2'}>
              {/* Agent Info Display (Edit Mode Only) */}
              {isEditMode && agent && (
                <form.Subscribe selector={(state) => state.values.color}>
                  {(colorValue) => (
                    <div className={'rounded-md border border-border bg-muted/50 p-3'}>
                      <div className={'flex items-center gap-3'}>
                        {colorValue && (
                          <div
                            className={'size-4 rounded-full'}
                            style={{
                              backgroundColor: getAgentColorHex(colorValue),
                            }}
                          />
                        )}
                        <div className={'text-sm'}>
                          <span className={'text-muted-foreground'}>{'Internal name: '}</span>
                          <span className={'font-mono text-foreground'}>{agent.name}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </form.Subscribe>
              )}

              {/* Form Fields */}
              <fieldset className={'mt-4 flex flex-col gap-4'} disabled={isSubmitting || isResetting || isViewMode}>
                <legend className={'sr-only'}>{'Agent details'}</legend>

                {/* Name Field (Create Mode Only) */}
                {!isEditMode && (
                  <form.AppField name={'name'}>
                    {(field) => (
                      <field.TextField
                        autoFocus={!isDuplicateMode}
                        description={
                          'A unique identifier using lowercase letters, numbers, and hyphens (e.g., my-custom-agent)'
                        }
                        isRequired
                        label={'Agent Name'}
                        placeholder={'my-custom-agent'}
                      />
                    )}
                  </form.AppField>
                )}

                {/* Type Field (Create Mode Only) */}
                {!isEditMode && (
                  <form.AppField name={'type'}>
                    {(field) => (
                      <field.SelectField
                        description={
                          'Planning agents handle workflow planning, specialist agents perform specific tasks, review agents validate outputs'
                        }
                        isRequired
                        label={'Agent Type'}
                        onChange={handleAgentTypeChange}
                        options={AGENT_TYPE_OPTIONS}
                        placeholder={'Select agent type'}
                      />
                    )}
                  </form.AppField>
                )}

                {/* Project Assignment Field */}
                <form.AppField name={'projectId'}>
                  {(field) => (
                    <field.SelectField
                      description={
                        isEditMode
                          ? 'Move this agent to a different project or make it global'
                          : 'Assign this agent to a specific project or make it available globally'
                      }
                      isDisabled={isProjectSelectorDisabled}
                      label={'Project Assignment'}
                      options={projectOptions}
                      placeholder={'Select project'}
                    />
                  )}
                </form.AppField>

                {/* Display Name Field */}
                <form.AppField name={'displayName'}>
                  {(field) => (
                    <field.TextField
                      autoFocus={isEditMode || isDuplicateMode}
                      isRequired
                      label={'Display Name'}
                      placeholder={'Enter display name'}
                    />
                  )}
                </form.AppField>

                {/* Description Field */}
                <form.AppField name={'description'}>
                  {(field) => (
                    <field.TextareaField
                      description={'A brief description of what this agent does'}
                      label={'Description'}
                      placeholder={"Describe the agent's purpose..."}
                      rows={3}
                    />
                  )}
                </form.AppField>

                {/* Model Field */}
                <form.AppField name={'model'}>
                  {(field) => (
                    <field.SelectField
                      description={'Model to use for this agent. Select Inherit to use parent model.'}
                      isRequired
                      label={'Model'}
                      options={MODEL_OPTIONS}
                    />
                  )}
                </form.AppField>

                {/* Permission Mode Field */}
                <form.AppField name={'permissionMode'}>
                  {(field) => (
                    <field.SelectField
                      description={'How Claude handles permission requests'}
                      isRequired
                      label={'Permission Mode'}
                      options={PERMISSION_MODE_OPTIONS}
                    />
                  )}
                </form.AppField>

                {/* Color Picker Field */}
                <form.AppField name={'color'}>
                  {(field) => (
                    <field.ColorPickerField
                      isDisabled={isSubmitting || isResetting || isViewMode}
                      isRequired={!isEditMode}
                      label={'Color Tag'}
                    />
                  )}
                </form.AppField>

                {/* System Prompt Field */}
                <form.AppField name={'systemPrompt'}>
                  {(field) => (
                    <field.TextareaField
                      description={'The system prompt that defines how this agent behaves'}
                      isRequired
                      label={'System Prompt'}
                      placeholder={'Enter the system prompt...'}
                      rows={12}
                    />
                  )}
                </form.AppField>
              </fieldset>

              {/* Collapsible Configuration Sections */}
              <div className={'mt-4 flex flex-col gap-4'}>
                {/* Tools Section */}
                <ToolsCollapsibleSection
                  customTools={customTools}
                  isDisabled={isCollapsibleDisabled}
                  onCustomToolsChange={setCustomTools}
                  onToolSelectionsChange={setToolSelections}
                  toolSelections={toolSelections}
                />

                {/* Skills Section */}
                <SkillsCollapsibleSection
                  isDisabled={isCollapsibleDisabled}
                  onSkillsChange={setPendingSkills}
                  pendingSkills={pendingSkills}
                />

                {/* Hooks Section */}
                <HooksCollapsibleSection
                  hooks={pendingHooks}
                  isDisabled={isCollapsibleDisabled}
                  onHooksChange={setPendingHooks}
                />
              </div>
            </DialogBody>

            {/* Dialog Footer */}
            <DialogFooter alignment={'between'}>
              {/* Reset Button */}
              <div>
                {isResetButtonVisible && (
                  <Button
                    disabled={isSubmitting || isResetting}
                    onClick={handleResetClick}
                    type={'button'}
                    variant={'outline'}
                  >
                    {'Reset to Default'}
                  </Button>
                )}
              </div>

              {/* Cancel and Save Buttons */}
              <div className={'flex gap-3'}>
                <DialogClose>
                  <Button disabled={isSubmitting || isResetting} type={'button'} variant={'outline'}>
                    {isViewMode ? 'Close' : 'Cancel'}
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

      {/* Discard Changes Confirmation Dialog */}
      <ConfirmDiscardDialog
        isOpen={isDiscardDialogOpen}
        onConfirm={handleConfirmDiscard}
        onOpenChange={setIsDiscardDialogOpen}
      />
    </DialogRoot>
  );
};

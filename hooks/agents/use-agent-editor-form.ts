'use client';

import type { FormEvent } from 'react';

import { useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react';

import type { AgentInitialData, EditorMode } from '@/components/agents/agent-editor-dialog.types';
import type { AgentHooksData } from '@/components/agents/agent-hooks-section';
import type { AgentToolType } from '@/lib/constants/claude-tools';
import type { CreateAgentFormData, UpdateAgentFormValues } from '@/lib/validations/agent';
import type { PendingSkillData } from '@/types/agent-skills';
import type { CreateToolData, ToolSelection } from '@/types/agent-tools';
import type { Agent } from '@/types/electron';

import { formValueToProjectId, projectIdToFormValue } from '@/components/agents/agent-editor-dialog.utils';
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
import { CLAUDE_BUILTIN_TOOLS, getDefaultToolsForAgentType, isBuiltinTool } from '@/lib/constants/claude-tools';
import { useAppForm } from '@/lib/forms';
import { createAgentFormSchema, GLOBAL_PROJECT_VALUE, updateAgentSchema } from '@/lib/validations/agent';

interface UseAgentEditorFormOptions {
  agent?: Agent;
  controlledIsOpen?: boolean;
  controlledOnOpenChange?: (open: boolean) => void;
  initialData?: AgentInitialData;
  mode: EditorMode;
  onSuccess?: () => void;
  projectId?: number;
}

export const useAgentEditorForm = ({
  agent,
  controlledIsOpen,
  controlledOnOpenChange,
  initialData,
  mode,
  onSuccess,
  projectId,
}: UseAgentEditorFormOptions) => {
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

  const { isBuiltIn, isDuplicateMode, isEditMode, isSubmitting, isViewMode } = derivedFlags;

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

  // Helper functions
  const getDefaultValues = useCallback((): CreateAgentFormData | UpdateAgentFormValues => {
    if (isEditMode && agent) {
      return {
        color: (agent.color ?? '') as UpdateAgentFormValues['color'],
        description: agent.description ?? '',
        displayName: agent.displayName,
        extendedThinkingEnabled: agent.extendedThinkingEnabled ?? false,
        maxThinkingTokens: agent.maxThinkingTokens ?? null,
        model: (agent.model ?? 'inherit') as UpdateAgentFormValues['model'],
        name: agent.name,
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
        extendedThinkingEnabled: false,
        maxThinkingTokens: null,
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
      extendedThinkingEnabled: false,
      maxThinkingTokens: null,
      model: 'inherit' as CreateAgentFormData['model'],
      name: '',
      permissionMode: 'default' as CreateAgentFormData['permissionMode'],
      projectId: projectIdToFormValue(projectId),
      systemPrompt: '',
      type: 'specialist',
    } as CreateAgentFormData;
  }, [isEditMode, agent, initialData, projectId]);

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
            extendedThinkingEnabled: updateValue.extendedThinkingEnabled,
            maxThinkingTokens: updateValue.extendedThinkingEnabled ? updateValue.maxThinkingTokens : null,
            model: modelValue,
            // Only include name for custom agents (built-in agents have name protected on the backend)
            name: !isBuiltIn ? updateValue.name : undefined,
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
          extendedThinkingEnabled: createValue.extendedThinkingEnabled,
          maxThinkingTokens: createValue.extendedThinkingEnabled ? createValue.maxThinkingTokens : null,
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

  // Derived booleans for conditional rendering
  const showBuiltInNameDisplay = isEditMode && !!agent && isBuiltIn;
  const canEditAgentName = !isEditMode || (isEditMode && !isBuiltIn);

  return {
    // Computed values
    canEditAgentName,
    // State
    customTools,
    // Derived flags
    derivedFlags,
    dialogLabels,
    // Form
    form,
    // Event handlers
    handleAgentTypeChange,
    handleConfirmDiscard,

    handleConfirmReset,
    handleFormSubmit,
    handleOpenChange,
    handleResetClick,
    isDiscardDialogOpen,
    isOpen,

    isResetDialogOpen,

    pendingHooks,

    pendingSkills,

    projectOptions,
    // Query data
    projectQuery,
    // State setters
    setCustomTools,
    setIsDiscardDialogOpen,

    setIsResetDialogOpen,
    setPendingHooks,
    setPendingSkills,
    setToolSelections,
    showBuiltInNameDisplay,
    toolSelections,
  };
};

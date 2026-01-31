'use client';

import type { ReactNode } from 'react';

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
import { descriptionVariants, fieldWrapperVariants, labelVariants } from '@/components/ui/form/field-wrapper';
import {
  SelectItem,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { agentColors, agentTypes } from '@/db/schema/agents.schema';
import { useCreateAgentHook } from '@/hooks/queries/use-agent-hooks';
import { useAgentSkills, useCreateAgentSkill, useSetAgentSkillRequired } from '@/hooks/queries/use-agent-skills';
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
import { useAppForm } from '@/lib/forms/form-hook';
import { createAgentFormSchema, updateAgentSchema } from '@/lib/validations/agent';

import { type AgentHooksData, AgentHooksSection } from './agent-hooks-section';
import { AgentSkillsManager } from './agent-skills-manager';
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
  isEditMode: boolean;
  onCustomToolsChange: (tools: Array<CreateToolData>) => void;
  onEditModeCustomToolsChange: (tools: Array<CreateToolData>) => Promise<void>;
  onEditModeToolSelectionsChange: (selections: Array<ToolSelection>) => Promise<void>;
  onToolSelectionsChange: (selections: Array<ToolSelection>) => void;
  toolSelections: Array<ToolSelection>;
}

/**
 * Memoized tools collapsible section to prevent re-renders when parent state changes
 */
const ToolsCollapsibleSection = memo(function ToolsCollapsibleSection({
  customTools,
  isDisabled,
  isEditMode,
  onCustomToolsChange,
  onEditModeCustomToolsChange,
  onEditModeToolSelectionsChange,
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
            onCustomToolsChange={isEditMode ? onEditModeCustomToolsChange : onCustomToolsChange}
            onToolSelectionsChange={isEditMode ? onEditModeToolSelectionsChange : onToolSelectionsChange}
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
  agentId: number | undefined;
  isDisabled: boolean;
  isEditAgent: boolean;
  onSkillsChange: (skills: Array<PendingSkillData>) => void;
  pendingSkills: Array<PendingSkillData>;
}

/**
 * Memoized skills collapsible section to prevent re-renders when parent state changes
 */
const SkillsCollapsibleSection = memo(function SkillsCollapsibleSection({
  agentId,
  isDisabled,
  isEditAgent,
  onSkillsChange,
  pendingSkills,
}: SkillsCollapsibleSectionProps) {
  const isEditAgentWithValidId = isEditAgent && agentId !== undefined;

  // Query skills for edit mode to get count
  const { data: skills } = useAgentSkills(isEditAgentWithValidId ? agentId : 0);

  // Calculate count based on mode
  const skillsCount = isEditAgentWithValidId ? (skills?.length ?? 0) : pendingSkills.length;

  return (
    <Collapsible className={'rounded-md border border-border'}>
      <CollapsibleTrigger className={'w-full justify-start px-3 py-2'}>
        <span>{'Referenced Skills'}</span>
        <span className={'ml-auto text-xs text-muted-foreground'}>
          {skillsCount}
          {' configured'}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className={'border-t border-border p-3'}>
          {isEditAgentWithValidId ? (
            <AgentSkillsManager agentId={agentId} isDisabled={isDisabled} />
          ) : (
            <AgentSkillsSection isDisabled={isDisabled} onSkillsChange={onSkillsChange} skills={pendingSkills} />
          )}
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

// Constant for global project option value
const GLOBAL_PROJECT_VALUE = '__global__';

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
  const [isOpen, setIsOpen] = useControllableState({
    defaultValue: false,
    onChange: controlledOnOpenChange,
    value: controlledIsOpen,
  });
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<null | number>(null);

  // Tool state for both create and edit modes
  const [toolSelections, setToolSelections] = useState<Array<ToolSelection>>([]);
  const [customTools, setCustomTools] = useState<Array<CreateToolData>>([]);

  // Skill state for create mode
  const [pendingSkills, setPendingSkills] = useState<Array<PendingSkillData>>([]);

  // Hooks state for both create and edit modes
  const [pendingHooks, setPendingHooks] = useState<AgentHooksData>({});

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

  // Hook mutations for create mode
  const createHookMutation = useCreateAgentHook();

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
    const options = [{ label: 'Global (all projects)', value: GLOBAL_PROJECT_VALUE }];

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

  // Memoize derived boolean flags to prevent recalculation on every render
  const derivedFlags = useMemo(() => {
    const isSubmitting = createAgentMutation.isPending || updateAgentMutation.isPending;
    const isMoving = moveAgentMutation.isPending;
    const isResetting = resetAgentMutation.isPending;
    const isEditMode = mode === 'edit';
    const isBuiltIn = agent?.builtInAt !== null;
    const isCustomized = agent?.parentAgentId !== null;
    const isDuplicateMode = mode === 'create' && initialData !== undefined;
    const isProjectScoped = !isEditMode && projectId !== undefined;
    // View-only mode for built-in agents in edit mode
    const isViewMode = isEditMode && isBuiltIn && !isCustomized;
    // Show reset button only for customized agents in edit mode, but not in view mode
    const isResetButtonVisible = isEditMode && isCustomized && !isViewMode;
    // Disabled state for project selector
    const isProjectSelectorDisabled = isEditMode
      ? isSubmitting || isResetting || isMoving || isViewMode
      : isSubmitting || isResetting;
    // Check if we're in edit mode with a valid agent
    const isEditAgent = isEditMode && agent !== undefined;
    // Disabled state for collapsible sections
    const isCollapsibleDisabled = isSubmitting || isResetting || isViewMode;

    return {
      isBuiltIn,
      isCollapsibleDisabled,
      isCustomized,
      isDuplicateMode,
      isEditAgent,
      isEditMode,
      isMoving,
      isProjectScoped,
      isProjectSelectorDisabled,
      isResetButtonVisible,
      isResetting,
      isSubmitting,
      isViewMode,
    };
  }, [
    agent,
    createAgentMutation.isPending,
    initialData,
    mode,
    moveAgentMutation.isPending,
    projectId,
    resetAgentMutation.isPending,
    updateAgentMutation.isPending,
  ]);

  const {
    isBuiltIn,
    isCollapsibleDisabled,
    isDuplicateMode,
    isEditAgent,
    isEditMode,
    isProjectScoped,
    isProjectSelectorDisabled,
    isResetButtonVisible,
    isResetting,
    isSubmitting,
    isViewMode,
  } = derivedFlags;

  // Determine validation schema based on mode
  const validationSchema = isEditMode ? updateAgentSchema : createAgentFormSchema;

  // Determine default values based on mode and initialData
  const getDefaultValues = useCallback((): CreateAgentFormData | UpdateAgentFormValues => {
    if (isEditMode && agent) {
      return {
        color: (agent.color ?? '') as UpdateAgentFormValues['color'],
        description: agent.description ?? '',
        displayName: agent.displayName,
        model: (agent.model ?? 'inherit') as UpdateAgentFormValues['model'],
        permissionMode: (agent.permissionMode ?? 'default') as UpdateAgentFormValues['permissionMode'],
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
      systemPrompt: '',
      type: 'specialist' as AgentType,
    } as CreateAgentFormData;
  }, [isEditMode, agent, initialData]);

  // Initialize tool defaults for create mode
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
        const updateValue = value as UpdateAgentFormValues;
        const colorValue = updateValue.color === '' ? null : updateValue.color;
        const modelValue = updateValue.model === 'inherit' || updateValue.model === '' ? null : updateValue.model;
        const permissionModeValue = updateValue.permissionMode === '' ? null : updateValue.permissionMode;
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

        // Create tools and skills for the new agent
        const toolsToSave = getToolsToSave();
        for (const tool of toolsToSave) {
          await createToolMutation.mutateAsync({
            agentId: createdAgent.id,
            toolName: tool.toolName,
            toolPattern: tool.pattern,
          });
        }

        // Create skills for the new agent
        for (const skill of pendingSkills) {
          const createdSkill = await createSkillMutation.mutateAsync({
            agentId: createdAgent.id,
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

        // Create hooks for the new agent
        const hookEventTypes = ['PreToolUse', 'PostToolUse', 'Stop'] as const;
        for (const eventType of hookEventTypes) {
          const entries = pendingHooks[eventType];
          if (entries && entries.length > 0) {
            for (const [index, entry] of entries.entries()) {
              await createHookMutation.mutateAsync({
                agentId: createdAgent.id,
                body: entry.body,
                eventType,
                matcher: entry.matcher,
                orderIndex: index,
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

  const setToolDefaults = useEffectEvent((type: AgentToolType) => {
    initializeToolDefaults(type);
  });

  const updateToolSelections = useEffectEvent((selections: Array<ToolSelection>) => {
    setToolSelections(selections);
  });

  const updateCustomTools = useEffectEvent((tools: Array<CreateToolData>) => {
    setCustomTools(tools);
  });

  const updateSelectedProjectId = useEffectEvent((newProjectId: null | number) => {
    setSelectedProjectId(newProjectId);
  });

  // Reset form and project when agent or initialData changes
  useEffect(() => {
    form.reset(getDefaultValues());
    if (isEditMode && agent) {
      updateSelectedProjectId(agent.projectId ?? null);
    } else {
      // For create mode (including duplicate), initialize with projectId prop or null
      updateSelectedProjectId(projectId ?? null);
    }
  }, [agent, initialData, form, getDefaultValues, isEditMode, projectId]);

  // Initialize tools when dialog opens
  useEffect(() => {
    if (!isOpen) return;

    if (!isEditMode) {
      // Create mode: initialize from defaults based on agent type
      const type = initialData?.type ?? 'specialist';
      setToolDefaults(type);
    }
  }, [isEditMode, isOpen, initialData?.type]);

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
          pattern: '*',
          toolName: tool.name,
        });
      }
    }

    updateToolSelections(builtinSelections);
    updateCustomTools(customToolsList);
  }, [isOpen, isEditMode, existingTools]);

  const getInitialProjectId = useCallback((): null | number => {
    if (isEditMode && agent) {
      return agent.projectId ?? null;
    }
    // For create mode, use the projectId prop if provided
    return projectId ?? null;
  }, [isEditMode, agent, projectId]);

  const resetFormState = useCallback(() => {
    form.reset(getDefaultValues());
    setSelectedProjectId(getInitialProjectId());
    // Reset tools, skills, and hooks state
    if (!isEditMode) {
      const type = initialData?.type ?? 'specialist';
      initializeToolDefaults(type);
      setPendingSkills([]);
      setPendingHooks({});
    }
  }, [form, getDefaultValues, getInitialProjectId, isEditMode, initialData, initializeToolDefaults]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    resetFormState();
  }, [resetFormState, setIsOpen]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && form.state.isDirty) {
        // Show discard confirmation if form has unsaved changes
        setIsDiscardDialogOpen(true);
        return;
      }
      setIsOpen(open);
      if (open) {
        // Reset form to ensure it has latest values
        form.reset(getDefaultValues());
        setSelectedProjectId(getInitialProjectId());
        // Reset tools, skills, and hooks for create mode
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
    [
      setIsOpen,
      resetFormState,
      getDefaultValues,
      getInitialProjectId,
      form,
      isEditMode,
      initialData,
      initializeToolDefaults,
    ]
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
    const newProjectId = newValue === GLOBAL_PROJECT_VALUE ? null : Number(newValue);
    setSelectedProjectId(newProjectId);
  }, []);

  // Handle tool changes in edit mode - sync to database
  const handleEditModeToolSelectionsChange = useCallback(
    async (newSelections: Array<ToolSelection>) => {
      if (!agent || !existingTools) return;

      // For each selection change, update the database
      for (const selection of newSelections) {
        const existingTool = existingTools.find((t) => t.toolName === selection.toolName);

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
    [agent, existingTools, allowToolMutation, disallowToolMutation, createToolMutation]
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

        const stillExists = newCustomTools.some((t) => t.toolName === existingTool.toolName);
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

  // Memoize dialog labels to prevent string recreation on every render
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

  const { agentTypeLabel, dialogDescription, dialogTitle, submitLabel } = dialogLabels;

  return (
    <DialogRoot onOpenChange={handleOpenChange} open={isOpen}>
      {/* Trigger - only render when provided (uncontrolled mode) */}
      {trigger && <DialogTrigger>{trigger}</DialogTrigger>}

      {/* Portal */}
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup aria-modal={'true'} role={'dialog'} scrollable={true} size={'xl'}>
          {/* Header */}
          <DialogHeader
            badges={
              <Fragment>
                {/* Project Scope Indicator (Create Mode Only) */}
                {isProjectScoped && projectQuery.data && (
                  <Badge variant={'project'}>{`Project: ${projectQuery.data.name}`}</Badge>
                )}
                {isEditMode && isBuiltIn && <Badge variant={'default'}>{'Built-in Agent'}</Badge>}
                {isEditMode && !isBuiltIn && <Badge variant={'custom'}>{'Custom Agent'}</Badge>}
                {isEditMode && agentTypeLabel && <Badge variant={'default'}>{agentTypeLabel}</Badge>}
              </Fragment>
            }
            isCloseDisabled={isSubmitting}
          >
            <DialogTitle id={'agent-editor-title'}>{dialogTitle}</DialogTitle>
            <DialogDescription id={'agent-editor-description'}>{dialogDescription}</DialogDescription>
          </DialogHeader>

          {/* Form wraps DialogBody + DialogFooter for submit to work */}
          <form
            aria-describedby={'agent-editor-description'}
            aria-labelledby={'agent-editor-title'}
            className={'flex min-h-0 flex-1 flex-col'}
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void form.handleSubmit();
            }}
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
                <div className={fieldWrapperVariants()}>
                  <label className={labelVariants()}>{'Project Assignment'}</label>
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
                            const newProjectId = newValue === GLOBAL_PROJECT_VALUE ? null : Number(newValue);
                            setSelectedProjectId(newProjectId);
                          }
                    }
                    value={selectedProjectId === null ? GLOBAL_PROJECT_VALUE : String(selectedProjectId)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={'Select project'} />
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
                      ? 'Move this agent to a different project or make it global'
                      : 'Assign this agent to a specific project or make it available globally'}
                  </span>
                </div>

                {/* Display Name */}
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

                {/* Description */}
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

                {/* Model */}
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

                {/* Permission Mode */}
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

                {/* Color Picker */}
                <form.AppField name={'color'}>
                  {(field) => (
                    <field.ColorPickerField
                      isDisabled={isSubmitting || isResetting || isViewMode}
                      isRequired={!isEditMode}
                      label={'Color Tag'}
                    />
                  )}
                </form.AppField>

                {/* System Prompt */}
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

              {/* Collapsible sections outside fieldset so they can be expanded in view mode */}
              <div className={'mt-4 flex flex-col gap-4'}>
                {/* Tools Section - Memoized to prevent re-renders */}
                <ToolsCollapsibleSection
                  customTools={customTools}
                  isDisabled={isCollapsibleDisabled}
                  isEditMode={isEditMode}
                  onCustomToolsChange={setCustomTools}
                  onEditModeCustomToolsChange={handleEditModeCustomToolsChange}
                  onEditModeToolSelectionsChange={handleEditModeToolSelectionsChange}
                  onToolSelectionsChange={setToolSelections}
                  toolSelections={toolSelections}
                />

                {/* Skills Section - Memoized to prevent re-renders */}
                <SkillsCollapsibleSection
                  agentId={agent?.id}
                  isDisabled={isCollapsibleDisabled}
                  isEditAgent={isEditAgent}
                  onSkillsChange={setPendingSkills}
                  pendingSkills={pendingSkills}
                />

                {/* Hooks Section - Memoized to prevent re-renders */}
                <HooksCollapsibleSection
                  hooks={pendingHooks}
                  isDisabled={isCollapsibleDisabled}
                  onHooksChange={setPendingHooks}
                />
              </div>
            </DialogBody>

            {/* Sticky Footer */}
            <DialogFooter alignment={'between'}>
              {/* Reset Button - only for customized agents in edit mode, hidden in view mode */}
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

'use client';

import { useCallback } from 'react';

import type { AgentToolType } from '@/lib/constants/claude-tools';
import type { CreateAgentFormData, UpdateAgentFormValues } from '@/lib/validations/agent';
import type { Agent } from '@/types/electron';

import { agentColors } from '@/db/schema/agents.schema';
import { useAppForm } from '@/lib/forms';
import { createAgentFormSchema, GLOBAL_PROJECT_VALUE, updateAgentSchema } from '@/lib/validations/agent';

/**
 * Initial data for creating an agent, typically used when duplicating.
 * Differs from Agent in that it doesn't include id, timestamps, or version.
 */
export interface AgentInitialData {
  color?: AgentColor | null;
  description?: string;
  displayName: string;
  extendedThinkingEnabled?: boolean;
  maxThinkingTokens?: null | number;
  name: string;
  systemPrompt: string;
  type: AgentType;
}

type AgentColor = (typeof agentColors)[number];

type AgentType = 'planning' | 'review' | 'specialist';

interface UseAgentEditorFormOptions {
  /** The agent being edited (required for edit mode) */
  agent?: Agent;
  /** Initial data for duplicating an agent */
  initialData?: AgentInitialData;
  /** Whether we're in edit mode */
  isEditMode: boolean;
  /** The submit handler that performs the actual mutation */
  onSubmit: (value: CreateAgentFormData | UpdateAgentFormValues) => Promise<void>;
  /** Callback when form submission completes successfully */
  onSubmitSuccess: () => void;
  /** Project ID for create mode (to scope agent to a project) */
  projectId?: number;
}

/**
 * Hook for managing the agent editor form.
 * Handles form initialization, validation schema selection, and default values.
 *
 * @param options - Configuration options for the hook
 * @returns Form instance and helper functions
 */
export const useAgentEditorForm = ({
  agent,
  initialData,
  isEditMode,
  onSubmit,
  onSubmitSuccess,
  projectId,
}: UseAgentEditorFormOptions) => {
  // Determine validation schema based on mode
  const validationSchema = isEditMode ? updateAgentSchema : createAgentFormSchema;

  // Helper to convert projectId to form value
  const projectIdToFormValue = useCallback((id: null | number | undefined): string => {
    return id === null || id === undefined ? GLOBAL_PROJECT_VALUE : String(id);
  }, []);

  // Determine default values based on mode and initialData
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
        extendedThinkingEnabled: initialData.extendedThinkingEnabled ?? false,
        maxThinkingTokens: initialData.maxThinkingTokens ?? null,
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
      type: 'specialist' as AgentType,
    } as CreateAgentFormData;
  }, [isEditMode, agent, initialData, projectId, projectIdToFormValue]);

  const form = useAppForm({
    defaultValues: getDefaultValues(),
    onSubmit: async ({ value }) => {
      await onSubmit(value);
      onSubmitSuccess();
    },
    validators: {
      onSubmit: validationSchema,
    },
  });

  return {
    form,
    getDefaultValues,
  };
};

/**
 * Get the default agent type for a new agent.
 */
export const getDefaultAgentType = (): AgentToolType => 'specialist';

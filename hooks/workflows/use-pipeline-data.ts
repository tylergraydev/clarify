'use client';

import { useMemo } from 'react';

import type { Agent } from '@/db/schema/agents.schema';
import type { Repository } from '@/db/schema/repositories.schema';
import type { WorkflowStep } from '@/db/schema/workflow-steps.schema';
import type { Workflow } from '@/db/schema/workflows.schema';
import type { ClarificationStepOutput } from '@/lib/validations/clarification';

import { useAgent, useAgents } from '@/hooks/queries/use-agents';
import { useDefaultClarificationAgent } from '@/hooks/queries/use-default-clarification-agent';
import { useDefaultRefinementAgent } from '@/hooks/queries/use-default-refinement-agent';
import { useCancelRefinement, useRegenerateRefinement } from '@/hooks/queries/use-refinement';
import { useRepositoriesByProject } from '@/hooks/queries/use-repositories';
import {
  useCompleteStep,
  useSkipStep,
  useStartStep,
  useStepsByWorkflow,
  useUpdateStep,
} from '@/hooks/queries/use-steps';
import { useWorkflow } from '@/hooks/queries/use-workflows';
import { deriveStepState, sortStepsByNumber } from '@/lib/utils/pipeline-step-utils';

export interface PipelineData {
  /** The active clarification step (running state) */
  activeClarificationStep: null | WorkflowStep;
  /** Output from the active clarification step */
  activeClarificationStepOutput: ClarificationStepOutput | null;
  /** The active discovery step (running state) */
  activeDiscoveryStep: null | WorkflowStep;
  /** The active refinement step (running state) */
  activeRefinementStep: null | WorkflowStep;
  /** All agents */
  agents: Array<Agent> | undefined;
  /** Cancel refinement mutation */
  cancelRefinement: ReturnType<typeof useCancelRefinement>;
  /** The clarification agent */
  clarificationAgent: Agent | undefined;
  /** The clarification agent ID */
  clarificationAgentId: null | number;
  /** Clarification output for refinement context */
  clarificationOutputForRefinement: ClarificationStepOutput | null;
  /** Number of completed steps */
  completedCount: number;
  /** Complete step mutation */
  completeStep: ReturnType<typeof useCompleteStep>;
  /** Current running step (for progress bar title) */
  currentStep: undefined | WorkflowStep;
  /** Discovery agent ID */
  discoveryAgentId: number;
  /** Whether any step is currently running */
  hasRunningStep: boolean;
  /** Whether data is loading */
  isLoading: boolean;
  /** Pause behavior for the workflow */
  pauseBehavior: string;
  /** The primary repository for this workflow's project */
  primaryRepository: Repository | undefined;
  /** The refined feature request text */
  refinedFeatureRequest: string;
  /** The refinement agent */
  refinementAgent: Agent | undefined;
  /** The refinement agent ID */
  refinementAgentId: null | number;
  /** The refinement step's updatedAt timestamp */
  refinementUpdatedAt: string | undefined;
  /** Regenerate refinement mutation */
  regenerateRefinement: ReturnType<typeof useRegenerateRefinement>;
  /** Repository path string */
  repositoryPath: string;
  /** Skip step mutation */
  skipStep: ReturnType<typeof useSkipStep>;
  /** Steps sorted by stepNumber */
  sortedSteps: Array<WorkflowStep>;
  /** Start step mutation */
  startStep: ReturnType<typeof useStartStep>;
  /** Update step mutation */
  updateStep: ReturnType<typeof useUpdateStep>;
  /** The workflow */
  workflow: null | undefined | Workflow;
}

interface UsePipelineDataOptions {
  workflowId: number;
}

/**
 * Encapsulates all data fetching, mutations, and derived state for PipelineView.
 */
export function usePipelineData({ workflowId }: UsePipelineDataOptions): PipelineData {
  const { data: steps, isLoading: isLoadingSteps } = useStepsByWorkflow(workflowId);
  const { data: workflow, isLoading: isLoadingWorkflow } = useWorkflow(workflowId);
  const { agentId: defaultAgentId } = useDefaultClarificationAgent();
  const { agentId: defaultRefinementAgentId } = useDefaultRefinementAgent();

  // Get repositories for this workflow's project to find the primary repository path
  const { data: repositories } = useRepositoriesByProject(workflow?.projectId ?? 0);
  const primaryRepository = useMemo(
    () => repositories?.find((r) => r.setAsDefaultAt !== null) ?? repositories?.[0],
    [repositories]
  );

  const updateStep = useUpdateStep();
  const completeStep = useCompleteStep();
  const startStep = useStartStep();
  const skipStep = useSkipStep();
  const cancelRefinement = useCancelRefinement();
  const regenerateRefinement = useRegenerateRefinement();

  // Find the active clarification step to get its agentId
  const activeClarificationStep = useMemo(() => {
    if (!steps) return null;
    return (
      steps.find((step) => step.stepType === 'clarification' && deriveStepState(step.status) === 'running') ?? null
    );
  }, [steps]);

  // Find the active refinement step
  const activeRefinementStep = useMemo(() => {
    if (!steps) return null;
    return steps.find((step) => step.stepType === 'refinement' && deriveStepState(step.status) === 'running') ?? null;
  }, [steps]);

  // Find the active discovery step
  const activeDiscoveryStep = useMemo(() => {
    if (!steps) return null;
    return steps.find((step) => step.stepType === 'discovery' && deriveStepState(step.status) === 'running') ?? null;
  }, [steps]);

  // Get agent details for the clarification step (either from step.agentId or default)
  const clarificationAgentId = activeClarificationStep?.agentId ?? defaultAgentId;
  const { data: clarificationAgent } = useAgent(clarificationAgentId ?? 0);

  // Get discovery agent for file discovery step
  const { data: agents } = useAgents();
  const discoveryAgent = useMemo(() => agents?.find((a) => a.name === 'file-discovery-agent'), [agents]);
  const discoveryAgentId = discoveryAgent?.id ?? 1;

  // Get refinement agent (from step.agentId or default setting)
  const refinementAgentId = activeRefinementStep?.agentId ?? defaultRefinementAgentId;
  const refinementAgent = useMemo(() => agents?.find((a) => a.id === refinementAgentId), [agents, refinementAgentId]);

  // Get refinement step data for discovery workspace
  const refinementStep = useMemo(() => steps?.find((s) => s.stepType === 'refinement'), [steps]);
  const refinedFeatureRequest = refinementStep?.outputText ?? workflow?.featureRequest ?? '';
  const refinementUpdatedAt = refinementStep?.updatedAt;

  // Get completed clarification step for refinement context
  const completedClarificationStep = useMemo(() => {
    if (!steps) return null;
    return (
      steps.find((step) => step.stepType === 'clarification' && deriveStepState(step.status) === 'completed') ?? null
    );
  }, [steps]);
  const clarificationOutputForRefinement = useMemo(() => {
    if (!completedClarificationStep) return null;
    return completedClarificationStep.outputStructured as ClarificationStepOutput | null;
  }, [completedClarificationStep]);

  const sortedSteps = useMemo(() => (steps ? sortStepsByNumber(steps) : []), [steps]);
  const hasRunningStep = useMemo(
    () => sortedSteps.some((step) => deriveStepState(step.status) === 'running'),
    [sortedSteps]
  );

  const activeClarificationStepOutput = useMemo(() => {
    if (!activeClarificationStep) return null;
    return activeClarificationStep.outputStructured as ClarificationStepOutput | null;
  }, [activeClarificationStep]);

  // Calculate progress metrics
  const completedCount = useMemo(
    () => sortedSteps.filter((step) => deriveStepState(step.status) === 'completed').length,
    [sortedSteps]
  );

  // Find current running step for progress bar title
  const currentStep = useMemo(
    () => sortedSteps.find((step) => deriveStepState(step.status) === 'running'),
    [sortedSteps]
  );

  const repositoryPath = primaryRepository?.path ?? '';
  const pauseBehavior = workflow?.pauseBehavior ?? 'auto_pause';

  return {
    activeClarificationStep,
    activeClarificationStepOutput,
    activeDiscoveryStep,
    activeRefinementStep,
    agents,
    cancelRefinement,
    clarificationAgent,
    clarificationAgentId,
    clarificationOutputForRefinement,
    completedCount,
    completeStep,
    currentStep,
    discoveryAgentId,
    hasRunningStep,
    isLoading: isLoadingSteps || isLoadingWorkflow,
    pauseBehavior,
    primaryRepository,
    refinedFeatureRequest,
    refinementAgent,
    refinementAgentId,
    refinementUpdatedAt,
    regenerateRefinement,
    repositoryPath,
    skipStep,
    sortedSteps,
    startStep,
    updateStep,
    workflow,
  };
}

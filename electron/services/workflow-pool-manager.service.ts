/**
 * Workflow Pool Manager Service
 *
 * Manages concurrency limits for parallel workflow execution.
 * Enforces a configurable maximum number of simultaneously running workflows
 * and queues excess workflows for automatic dequeue when slots become available.
 */
import type {
  AgentsRepository,
  RepositoriesRepository,
  SettingsRepository,
  WorkflowRepositoriesRepository,
  WorkflowsRepository,
  WorkflowStepsRepository,
  WorktreesRepository,
} from '../../db/repositories';

import { worktreeService } from './worktree.service';

const DEFAULT_MAX_CONCURRENT = 3;

export interface WorkflowPoolManager {
  canStartWorkflow(): boolean;
  enqueueWorkflow(workflowId: number): void;
  getConcurrencyStats(): { maxConcurrent: number; queued: number; running: number };
  getQueuedCount(): number;
  getQueuePosition(workflowId: number): number;
  getRunningCount(): number;
  tryDequeueNext(): Promise<boolean>;
}

export function createWorkflowPoolManager(deps: {
  agentsRepository: AgentsRepository;
  repositoriesRepository: RepositoriesRepository;
  settingsRepository: SettingsRepository;
  workflowRepositoriesRepository: WorkflowRepositoriesRepository;
  workflowsRepository: WorkflowsRepository;
  workflowStepsRepository: WorkflowStepsRepository;
  worktreesRepository: WorktreesRepository;
}): WorkflowPoolManager {
  const {
    agentsRepository,
    repositoriesRepository,
    settingsRepository,
    workflowRepositoriesRepository,
    workflowsRepository,
    workflowStepsRepository,
    worktreesRepository,
  } = deps;

  const getMaxConcurrent = (): number => {
    const value = settingsRepository.getValue('maxConcurrentWorkflows');
    if (value) {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed) && parsed >= 1) {
        return parsed;
      }
    }
    return DEFAULT_MAX_CONCURRENT;
  };

  const getRunningCount = (): number => {
    return workflowsRepository.findByStatus('running').length;
  };

  const getQueuedCount = (): number => {
    return workflowsRepository.findByStatus('queued').length;
  };

  /**
   * Executes the start logic for a workflow (extracted from workflow:start handler).
   * Resolves agents, creates worktree, creates steps, and starts the first step.
   */
  const startWorkflowExecution = async (workflowId: number): Promise<void> => {
    const workflow = workflowsRepository.findById(workflowId);
    if (!workflow) return;

    // Resolve clarification agent ID with fallback logic
    let clarificationAgentId: null | number = workflow.clarificationAgentId ?? null;

    if (clarificationAgentId === null) {
      const defaultAgentIdStr = settingsRepository.getValue('defaultClarificationAgentId');
      if (defaultAgentIdStr && defaultAgentIdStr.trim() !== '') {
        const parsedId = parseInt(defaultAgentIdStr, 10);
        if (!isNaN(parsedId)) {
          const defaultAgent = agentsRepository.findById(parsedId);
          if (defaultAgent && defaultAgent.deactivatedAt === null) {
            clarificationAgentId = parsedId;
          }
        }
      }
    }

    if (clarificationAgentId === null) {
      const planningAgents = agentsRepository.findAll({ type: 'planning' });
      const firstPlanningAgent = planningAgents[0];
      if (firstPlanningAgent) {
        clarificationAgentId = firstPlanningAgent.id;
      }
    }

    // Create worktree if enabled
    const createFeatureBranch = settingsRepository.getValue('worktreeCreateFeatureBranch');
    if (createFeatureBranch !== 'false') {
      try {
        const workflowRepos = workflowRepositoriesRepository.findByWorkflowId(workflowId);
        const primaryWorkflowRepo = workflowRepos[0];
        if (primaryWorkflowRepo) {
          const repo = repositoriesRepository.findById(primaryWorkflowRepo.repositoryId);
          if (repo) {
            const branchName = worktreeService.generateBranchName(workflowId, workflow.featureName);
            const targetDir = worktreeService.resolveWorktreeDir(repo.path, branchName);
            const worktreePath = await worktreeService.createWorktree(repo.path, branchName, targetDir);
            await worktreeService.runSetupCommands(worktreePath, repo.path);

            worktreesRepository.create({
              branchName,
              path: worktreePath,
              repositoryId: repo.id,
              status: 'active',
              workflowId,
            });

            console.log(`[WorkflowPool] Created worktree: ${branchName}`);
          }
        }
      } catch (worktreeError) {
        console.error('[WorkflowPool] Worktree creation failed, continuing without worktree:', worktreeError);
      }
    }

    // Start the workflow (update status to running)
    const startedWorkflow = workflowsRepository.start(workflowId);
    if (!startedWorkflow) return;

    // Create planning steps
    const createdSteps = workflowStepsRepository.createPlanningSteps(
      workflowId,
      workflow.skipClarification,
      clarificationAgentId
    );

    // Start the first pending step
    const firstPendingStep = createdSteps.find((step) => step.status === 'pending');
    if (firstPendingStep) {
      workflowStepsRepository.start(firstPendingStep.id);
      console.log(
        `[WorkflowPool] Started first step: ${firstPendingStep.stepType} (id: ${firstPendingStep.id})`
      );
    }
  };

  return {
    canStartWorkflow(): boolean {
      return getRunningCount() < getMaxConcurrent();
    },

    enqueueWorkflow(workflowId: number): void {
      workflowsRepository.updateStatus(workflowId, 'queued');
      console.log(`[WorkflowPool] Enqueued workflow ${workflowId}`);
    },

    getConcurrencyStats() {
      return {
        maxConcurrent: getMaxConcurrent(),
        queued: getQueuedCount(),
        running: getRunningCount(),
      };
    },

    getQueuedCount,

    getQueuePosition(workflowId: number): number {
      const queuedWorkflows = workflowsRepository.findByStatus('queued');
      // Sort by createdAt ascending (oldest first)
      queuedWorkflows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      const index = queuedWorkflows.findIndex((w) => w.id === workflowId);
      return index >= 0 ? index + 1 : 0;
    },

    getRunningCount,

    async tryDequeueNext(): Promise<boolean> {
      const running = getRunningCount();
      const max = getMaxConcurrent();

      if (running >= max) {
        return false;
      }

      // Find oldest queued workflow
      const queuedWorkflows = workflowsRepository.findByStatus('queued');
      if (queuedWorkflows.length === 0) {
        return false;
      }

      queuedWorkflows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      const nextWorkflow = queuedWorkflows[0];

      if (!nextWorkflow) {
        return false;
      }

      console.log(`[WorkflowPool] Dequeuing workflow ${nextWorkflow.id}: ${nextWorkflow.featureName}`);

      try {
        await startWorkflowExecution(nextWorkflow.id);
        return true;
      } catch (error) {
        console.error(`[WorkflowPool] Failed to start dequeued workflow ${nextWorkflow.id}:`, error);
        workflowsRepository.updateStatus(nextWorkflow.id, 'failed', 'Failed to start from queue');
        return false;
      }
    },
  };
}

/**
 * Central IPC Handler Registration
 *
 * This module orchestrates all IPC handler registrations with dependency injection.
 * Repositories are instantiated here and passed to domain-specific handler registration functions.
 *
 * Registration order:
 * 1. Stateless handlers (fs, store, app)
 * 2. Window-dependent handlers (dialog)
 * 3. Database handlers (project, repository, workflow, etc.)
 */
import type { BrowserWindow } from 'electron';

import type { DrizzleDatabase } from '../../db';

import {
  createAgentHooksRepository,
  createAgentSkillsRepository,
  createAgentsRepository,
  createAgentToolsRepository,
  createAuditLogsRepository,
  createDiscoveredFilesRepository,
  createProjectsRepository,
  createRepositoriesRepository,
  createSettingsRepository,
  createTemplatePlaceholdersRepository,
  createTemplatesRepository,
  createWorkflowRepositoriesRepository,
  createWorkflowsRepository,
  createWorkflowStepsRepository,
  createWorktreesRepository,
} from '../../db/repositories';
import { registerAgentHookHandlers } from './agent-hook.handlers';
import { registerAgentSkillHandlers } from './agent-skill.handlers';
import { registerAgentStreamHandlers } from './agent-stream.handlers';
import { registerAgentToolHandlers } from './agent-tool.handlers';
// Handler registration imports (to be implemented in Steps 3-10)
import { registerAgentHandlers } from './agent.handlers';
import { registerAppHandlers } from './app.handlers';
import { registerAuditHandlers } from './audit.handlers';
import { registerClarificationHandlers } from './clarification.handlers';
import { registerDebugLogHandlers } from './debug-log.handlers';
import { registerDialogHandlers } from './dialog.handlers';
import { registerDiscoveryHandlers } from './discovery.handlers';
import { registerFsHandlers } from './fs.handlers';
import { registerProjectHandlers } from './project.handlers';
import { registerRefinementHandlers } from './refinement.handlers';
import { registerRepositoryHandlers } from './repository.handlers';
import { registerSettingsHandlers } from './settings.handlers';
import { registerStepHandlers } from './step.handlers';
import { registerStoreHandlers } from './store.handlers';
import { registerTemplateHandlers } from './template.handlers';
import { registerWorkflowRepositoriesHandlers } from './workflow-repositories.handlers';
import { registerWorkflowHandlers } from './workflow.handlers';
import { registerWorktreeHandlers } from './worktree.handlers';

// Re-export channels for external use
export { IpcChannels } from './channels';

/**
 * Register all IPC handlers with their dependencies.
 *
 * @param db - The Drizzle database instance for repository creation
 * @param getMainWindow - Function to get the main BrowserWindow (may be null during startup)
 * @param createDebugWindow - Function to create/focus the debug window
 */
export function registerAllHandlers(
  db: DrizzleDatabase,
  getMainWindow: () => BrowserWindow | null,
  createDebugWindow: () => Promise<BrowserWindow>
): void {
  // ============================================
  // Stateless handlers (no dependencies)
  // ============================================

  // File system handlers
  registerFsHandlers();

  // Electron store handlers
  registerStoreHandlers();

  // App info handlers
  registerAppHandlers();

  // Debug log handlers (with debug window creation function)
  registerDebugLogHandlers(createDebugWindow);

  // ============================================
  // Window-dependent handlers
  // ============================================

  // Dialog handlers (need window reference for modal dialogs)
  registerDialogHandlers(getMainWindow);

  // Agent stream handlers (need window reference for MessagePort transfer)
  registerAgentStreamHandlers(getMainWindow);

  // ============================================
  // Database handlers - Core entities
  // ============================================

  // Repositories - git repositories linked to projects
  // Note: Created before projects because registerProjectHandlers needs both
  const repositoriesRepository = createRepositoriesRepository(db);

  // Projects - top-level organizational entity
  // Needs repositoriesRepository for addRepo functionality
  const projectsRepository = createProjectsRepository(db);
  registerProjectHandlers(projectsRepository, repositoriesRepository);

  // Register repository handlers
  registerRepositoryHandlers(repositoriesRepository);

  // ============================================
  // Database handlers - Agent system
  // ============================================

  // Agents - AI agent definitions and configurations
  const agentsRepository = createAgentsRepository(db);

  // Agent tools - tool allowlist/denylist for agents
  const agentToolsRepository = createAgentToolsRepository(db);

  // Agent skills - skills referenced by agents
  const agentSkillsRepository = createAgentSkillsRepository(db);

  // Agent hooks - lifecycle hooks for agents
  const agentHooksRepository = createAgentHooksRepository(db);

  // Register agent handlers (needs tools, skills, hooks, and projects repos for duplication/move/copy/import/export)
  registerAgentHandlers(
    agentsRepository,
    agentToolsRepository,
    agentSkillsRepository,
    agentHooksRepository,
    projectsRepository
  );

  // Register tool, skill, and hook handlers
  registerAgentToolHandlers(agentToolsRepository);
  registerAgentSkillHandlers(agentSkillsRepository);
  registerAgentHookHandlers(agentHooksRepository);

  // Templates - prompt templates for workflows
  const templatesRepository = createTemplatesRepository(db);
  const templatePlaceholdersRepository = createTemplatePlaceholdersRepository(db);
  registerTemplateHandlers(templatesRepository, templatePlaceholdersRepository);

  // ============================================
  // Database handlers - Settings (needed by workflow handlers)
  // ============================================

  // Settings - application configuration
  // Note: Created before workflows because registerWorkflowHandlers needs settings for agent fallback
  const settingsRepository = createSettingsRepository(db);
  registerSettingsHandlers(settingsRepository);

  // ============================================
  // Database handlers - Workflow system
  // ============================================

  // Workflow steps - individual steps within workflows
  // Note: Created before workflows because registerWorkflowHandlers needs steps repository
  const workflowStepsRepository = createWorkflowStepsRepository(db);
  const workflowsRepository = createWorkflowsRepository(db);
  registerStepHandlers(workflowStepsRepository, workflowsRepository);

  // Clarification handlers - need steps repository to look up agentId from step
  // Also needs getMainWindow for streaming events to renderer
  registerClarificationHandlers(workflowStepsRepository, getMainWindow);

  // Refinement handlers - needs getMainWindow for streaming events to renderer
  registerRefinementHandlers(getMainWindow);

  // Workflows - orchestration runs
  // Needs workflowStepsRepository for creating planning steps on start
  // Also needs settingsRepository and agentsRepository for clarification agent fallback logic
  registerWorkflowHandlers(workflowsRepository, workflowStepsRepository, settingsRepository, agentsRepository);

  // Workflow repositories - repository associations for workflows
  const workflowRepositoriesRepository = createWorkflowRepositoriesRepository(db);
  registerWorkflowRepositoriesHandlers(workflowRepositoriesRepository);

  // ============================================
  // Database handlers - Supporting entities
  // ============================================

  // Discovered files - files found during analysis
  // Also needs workflowStepsRepository and getMainWindow for discovery streaming
  const discoveredFilesRepository = createDiscoveredFilesRepository(db);
  registerDiscoveryHandlers(discoveredFilesRepository, workflowStepsRepository, getMainWindow);

  // Audit logs - system event tracking
  const auditLogsRepository = createAuditLogsRepository(db);
  registerAuditHandlers(auditLogsRepository);

  // ============================================
  // Database handlers - Git worktrees
  // ============================================

  // Worktrees - git worktree management for parallel workflows
  const worktreesRepository = createWorktreesRepository(db);
  registerWorktreeHandlers(worktreesRepository);
}

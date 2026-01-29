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
import type { BrowserWindow } from "electron";

import type { DrizzleDatabase } from "../../db";

import {
  createAgentsRepository,
  createAuditLogsRepository,
  createDiscoveredFilesRepository,
  createProjectsRepository,
  createRepositoriesRepository,
  createSettingsRepository,
  createTemplatesRepository,
  createWorkflowsRepository,
  createWorkflowStepsRepository,
} from "../../db/repositories";
// Handler registration imports (to be implemented in Steps 3-10)
import { registerAgentHandlers } from "./agent.handlers";
import { registerAppHandlers } from "./app.handlers";
import { registerAuditHandlers } from "./audit.handlers";
import { registerDialogHandlers } from "./dialog.handlers";
import { registerDiscoveryHandlers } from "./discovery.handlers";
import { registerFsHandlers } from "./fs.handlers";
import { registerProjectHandlers } from "./project.handlers";
import { registerRepositoryHandlers } from "./repository.handlers";
import { registerSettingsHandlers } from "./settings.handlers";
import { registerStepHandlers } from "./step.handlers";
import { registerStoreHandlers } from "./store.handlers";
import { registerTemplateHandlers } from "./template.handlers";
import { registerWorkflowHandlers } from "./workflow.handlers";

// Re-export channels for external use
export { IpcChannels } from "./channels";

/**
 * Register all IPC handlers with their dependencies.
 *
 * @param db - The Drizzle database instance for repository creation
 * @param getMainWindow - Function to get the main BrowserWindow (may be null during startup)
 */
export function registerAllHandlers(
  db: DrizzleDatabase,
  getMainWindow: () => BrowserWindow | null
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

  // ============================================
  // Window-dependent handlers
  // ============================================

  // Dialog handlers (need window reference for modal dialogs)
  registerDialogHandlers(getMainWindow);

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
  registerAgentHandlers(agentsRepository);

  // Templates - prompt templates for workflows
  const templatesRepository = createTemplatesRepository(db);
  registerTemplateHandlers(templatesRepository);

  // ============================================
  // Database handlers - Workflow system
  // ============================================

  // Workflows - orchestration runs
  const workflowsRepository = createWorkflowsRepository(db);
  registerWorkflowHandlers(workflowsRepository);

  // Workflow steps - individual steps within workflows
  const workflowStepsRepository = createWorkflowStepsRepository(db);
  registerStepHandlers(workflowStepsRepository);

  // ============================================
  // Database handlers - Supporting entities
  // ============================================

  // Discovered files - files found during analysis
  const discoveredFilesRepository = createDiscoveredFilesRepository(db);
  registerDiscoveryHandlers(discoveredFilesRepository);

  // Audit logs - system event tracking
  const auditLogsRepository = createAuditLogsRepository(db);
  registerAuditHandlers(auditLogsRepository);

  // ============================================
  // Database handlers - Settings
  // ============================================

  // Settings - application configuration
  const settingsRepository = createSettingsRepository(db);
  registerSettingsHandlers(settingsRepository);
}

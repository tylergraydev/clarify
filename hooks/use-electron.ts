'use client';

import { useElectronAgents } from './electron/domains/use-electron-agents';
import { useElectronAudit } from './electron/domains/use-electron-audit';
import { useElectronDiscovery } from './electron/domains/use-electron-discovery';
import { useElectronProjects } from './electron/domains/use-electron-projects';
import { useElectronSettings } from './electron/domains/use-electron-settings';
import { useElectronTemplates } from './electron/domains/use-electron-templates';
import { useElectronWorkflows } from './electron/domains/use-electron-workflows';
import { useElectronWorktrees } from './electron/domains/use-electron-worktrees';
import { useElectron } from './electron/use-electron-base';

// Re-export standalone hooks for direct usage
export { useElectronApp } from './electron/use-electron-app';
export { useElectronDialog } from './electron/use-electron-dialog';
export { useElectronFs } from './electron/use-electron-fs';
export { useElectronStore } from './electron/use-electron-store';

/**
 * Hook that provides access to all database domains via the ElectronAPI.
 * Write operations throw errors when API is unavailable.
 * Read operations return safe defaults (empty arrays or undefined).
 */
export function useElectronDb() {
  const { isElectron } = useElectron();
  const { agentHooks, agents, agentSkills, agentTools } = useElectronAgents();
  const { audit } = useElectronAudit();
  const { discovery } = useElectronDiscovery();
  const { projects, repositories } = useElectronProjects();
  const { settings } = useElectronSettings();
  const { templates } = useElectronTemplates();
  const { steps, workflowRepositories, workflows } = useElectronWorkflows();
  const { worktrees } = useElectronWorktrees();

  return {
    agentHooks,
    agents,
    agentSkills,
    agentTools,
    audit,
    discovery,
    isElectron,
    projects,
    repositories,
    settings,
    steps,
    templates,
    workflowRepositories,
    workflows,
    worktrees,
  };
}

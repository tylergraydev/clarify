'use client';

import { useElectronAgentActivity } from './electron/domains/use-electron-agent-activity';
import { useElectronAgents } from './electron/domains/use-electron-agents';
import { useElectronAudit } from './electron/domains/use-electron-audit';
import { useElectronChat } from './electron/domains/use-electron-chat';
import { useElectronClarification } from './electron/domains/use-electron-clarification';
import { useElectronDiff } from './electron/domains/use-electron-diff';
import { useElectronDiffComments } from './electron/domains/use-electron-diff-comments';
import { useElectronDiscovery } from './electron/domains/use-electron-discovery';
import { useElectronEditor } from './electron/domains/use-electron-editor';
import { useElectronFileViewState } from './electron/domains/use-electron-file-view-state';
import { useElectronGitHub } from './electron/domains/use-electron-github';
import { useElectronMcpServers } from './electron/domains/use-electron-mcp-servers';
import { useElectronPlanning } from './electron/domains/use-electron-planning';
import { useElectronProjects } from './electron/domains/use-electron-projects';
import { useElectronProviders } from './electron/domains/use-electron-providers';
import { useElectronSettings } from './electron/domains/use-electron-settings';
import { useElectronTemplates } from './electron/domains/use-electron-templates';
import { useElectronWorkflows } from './electron/domains/use-electron-workflows';
import { useElectronWorktrees } from './electron/domains/use-electron-worktrees';
import { useElectron } from './electron/use-electron-base';

// Re-export standalone hooks for direct usage
export { useElectronApp } from './electron/use-electron-app';
export { useElectronDialog } from './electron/use-electron-dialog';
export { useElectronFileExplorer } from './electron/use-electron-file-explorer';
export { useElectronFs } from './electron/use-electron-fs';
export { useElectronStore } from './electron/use-electron-store';

/**
 * Hook that provides access to all database domains via the ElectronAPI.
 * Write operations throw errors when API is unavailable.
 * Read operations return safe defaults (empty arrays or undefined).
 */
export function useElectronDb() {
  const { isElectron } = useElectron();
  const { agentActivity } = useElectronAgentActivity();
  const { agentHooks, agents, agentSkills, agentTools } = useElectronAgents();
  const { audit } = useElectronAudit();
  const { chat } = useElectronChat();
  const { clarification } = useElectronClarification();
  const { diff } = useElectronDiff();
  const { diffComments } = useElectronDiffComments();
  const { github } = useElectronGitHub();
  const { discovery } = useElectronDiscovery();
  const { editor } = useElectronEditor();
  const { fileViewState } = useElectronFileViewState();
  const { mcpServers } = useElectronMcpServers();
  const { planning } = useElectronPlanning();
  const { providers } = useElectronProviders();
  const { projects, repositories } = useElectronProjects();
  const { settings } = useElectronSettings();
  const { templates } = useElectronTemplates();
  const { steps, workflowRepositories, workflows } = useElectronWorkflows();
  const { worktrees } = useElectronWorktrees();

  return {
    agentActivity,
    agentHooks,
    agents,
    agentSkills,
    agentTools,
    audit,
    chat,
    clarification,
    diff,
    diffComments,
    discovery,
    editor,
    fileViewState,
    github,
    isElectron,
    mcpServers,
    planning,
    projects,
    providers,
    repositories,
    settings,
    steps,
    templates,
    workflowRepositories,
    workflows,
    worktrees,
  };
}

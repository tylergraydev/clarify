/**
 * Query Hooks Index
 *
 * Barrel export for all TanStack Query hooks organized alphabetically by domain.
 * Provides a single import point for all query and mutation hooks.
 */

// ============================================================================
// Agent Hook Hooks
// ============================================================================
export { useAgentHooks, useCreateAgentHook, useDeleteAgentHook, useUpdateAgentHook } from './use-agent-hooks';

// ============================================================================
// Agent Skill Hooks
// ============================================================================
export {
  useAgentSkills,
  useCreateAgentSkill,
  useDeleteAgentSkill,
  useSetAgentSkillRequired,
  useUpdateAgentSkill,
} from './use-agent-skills';

// ============================================================================
// Agent Tool Hooks
// ============================================================================
export {
  useAgentTools,
  useAllowAgentTool,
  useCreateAgentTool,
  useDeleteAgentTool,
  useDisallowAgentTool,
  useUpdateAgentTool,
} from './use-agent-tools';

// ============================================================================
// Agent Hooks
// ============================================================================
export {
  useActivateAgent,
  useActiveAgents,
  useAgent,
  useAgents,
  useAgentsByProject,
  useAgentsByType,
  useAllAgents,
  useBuiltInAgents,
  useCopyAgentToProject,
  useCreateAgent,
  useCreateAgentOverride,
  useDeactivateAgent,
  useDeleteAgent,
  useDuplicateAgent,
  useExportAgent,
  useExportAgentsBatch,
  useGlobalAgents,
  useImportAgent,
  useMoveAgent,
  useProjectAgents,
  useResetAgent,
  useUpdateAgent,
} from './use-agents';

// ============================================================================
// Audit Log Hooks
// ============================================================================
export {
  useAuditLogs,
  useAuditLogsByStep,
  useAuditLogsByWorkflow,
  useCreateAuditLog,
  useExportAuditLog,
} from './use-audit-logs';

// ============================================================================
// Debug Log Hooks
// ============================================================================
export {
  useClearDebugLogs,
  useDebugLogPath,
  useDebugLogs,
  useDebugLogSessionIds,
  useOpenDebugLogFile,
} from './use-debug-logs';

export type { UseDebugLogsOptions } from './use-debug-logs';

// ============================================================================
// Discovered File Hooks
// ============================================================================
export {
  useAddDiscoveredFile,
  useDiscoveredFiles,
  useExcludeFile,
  useIncludedFiles,
  useIncludeFile,
  useUpdateDiscoveredFile,
} from './use-discovered-files';

// ============================================================================
// Project Hooks
// ============================================================================
export {
  useAddRepositoryToProject,
  useArchiveProject,
  useCreateProject,
  useDeleteProject,
  useDeleteProjectPermanently,
  useProject,
  useProjects,
  useUnarchiveProject,
  useUpdateProject,
} from './use-projects';

// ============================================================================
// Repository Hooks
// ============================================================================
export {
  useCreateRepository,
  useDeleteRepository,
  useRepositories,
  useRepositoriesByProject,
  useRepository,
  useSetDefaultRepository,
  useUpdateRepository,
} from './use-repositories';

// ============================================================================
// Settings Hooks
// ============================================================================
export {
  useBulkUpdateSettings,
  useResetSetting,
  useSetting,
  useSettingByKey,
  useSettings,
  useSettingsByCategory,
  useUpdateSetting,
} from './use-settings';

// ============================================================================
// Step Hooks
// ============================================================================
export { useCompleteStep, useEditStep, useFailStep, useRegenerateStep, useStep, useStepsByWorkflow } from './use-steps';

// ============================================================================
// Template Hooks
// ============================================================================
export {
  useActiveTemplates,
  useBuiltInTemplates,
  useCreateTemplate,
  useDeleteTemplate,
  useIncrementTemplateUsage,
  useTemplate,
  useTemplates,
  useTemplatesByCategory,
  useUpdateTemplate,
} from './use-templates';

// ============================================================================
// Workflow Hooks
// ============================================================================
export {
  useCancelWorkflow,
  useCreateWorkflow,
  usePauseWorkflow,
  useResumeWorkflow,
  useStartWorkflow,
  useWorkflow,
  useWorkflows,
  useWorkflowsByProject,
} from './use-workflows';

// ============================================================================
// Query Keys Re-export
// ============================================================================
// Re-export query keys from lib/queries for convenient access
export {
  agentHookKeys,
  agentKeys,
  agentSkillKeys,
  agentToolKeys,
  auditLogKeys,
  debugLogKeys,
  discoveredFileKeys,
  projectKeys,
  queries,
  repositoryKeys,
  settingKeys,
  stepKeys,
  templateKeys,
  workflowKeys,
} from '@/lib/queries';

export type { QueryKeys } from '@/lib/queries';

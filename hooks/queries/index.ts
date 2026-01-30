/**
 * Query Hooks Index
 *
 * Barrel export for all TanStack Query hooks organized alphabetically by domain.
 * Provides a single import point for all query and mutation hooks.
 */

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
  useBuiltInAgents,
  useDeactivateAgent,
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
  useCreateProject,
  useDeleteProject,
  useProject,
  useProjects,
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
  agentKeys,
  auditLogKeys,
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

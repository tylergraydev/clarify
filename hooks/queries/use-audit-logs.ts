'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { auditLogKeys } from '@/lib/queries/audit-logs';

import { useElectronDb } from '../use-electron';

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch all audit logs
 */
export function useAuditLogs() {
  const { audit, isElectron } = useElectronDb();

  return useQuery({
    ...auditLogKeys.list(),
    enabled: isElectron,
    queryFn: () => audit.list(),
  });
}

/**
 * Fetch audit logs filtered by workflow step ID
 */
export function useAuditLogsByStep(stepId: number) {
  const { audit, isElectron } = useElectronDb();

  return useQuery({
    ...auditLogKeys.byWorkflowStep(stepId),
    enabled: isElectron && stepId > 0,
    queryFn: () => audit.findByStep(stepId),
  });
}

/**
 * Fetch audit logs filtered by workflow ID
 */
export function useAuditLogsByWorkflow(workflowId: number) {
  const { audit, isElectron } = useElectronDb();

  return useQuery({
    ...auditLogKeys.byWorkflow(workflowId),
    enabled: isElectron && workflowId > 0,
    queryFn: () => audit.findByWorkflow(workflowId),
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new audit log entry
 */
export function useCreateAuditLog() {
  const queryClient = useQueryClient();
  const { audit } = useElectronDb();

  return useMutation({
    mutationFn: (data: Parameters<typeof audit.create>[0]) => audit.create(data),
    onSuccess: (auditLog) => {
      // Invalidate list queries
      void queryClient.invalidateQueries({ queryKey: auditLogKeys.list._def });
      // Invalidate workflow-specific queries if workflowId exists
      if (auditLog.workflowId) {
        void queryClient.invalidateQueries({
          queryKey: auditLogKeys.byWorkflow(auditLog.workflowId).queryKey,
        });
      }
      // Invalidate step-specific queries if workflowStepId exists
      if (auditLog.workflowStepId) {
        void queryClient.invalidateQueries({
          queryKey: auditLogKeys.byWorkflowStep(auditLog.workflowStepId).queryKey,
        });
      }
    },
  });
}

/**
 * Export audit log for a workflow as formatted string
 * Returns the exported content for download
 */
export function useExportAuditLog() {
  const { audit } = useElectronDb();

  return useMutation({
    mutationFn: (workflowId: number) => audit.export(workflowId),
  });
}

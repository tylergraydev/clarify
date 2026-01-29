"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { NewAuditLog } from "@/types/electron";

import { auditLogKeys } from "@/lib/queries/audit-logs";

import { useElectron } from "../use-electron";

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch all audit logs
 */
export function useAuditLogs() {
  const { api, isElectron } = useElectron();

  return useQuery({
    ...auditLogKeys.list(),
    enabled: isElectron,
    queryFn: () => api!.audit.list(),
  });
}

/**
 * Fetch audit logs filtered by workflow step ID
 */
export function useAuditLogsByStep(stepId: number) {
  const { api, isElectron } = useElectron();

  return useQuery({
    ...auditLogKeys.byWorkflowStep(stepId),
    enabled: isElectron && stepId > 0,
    queryFn: () => api!.audit.findByStep(stepId),
  });
}

/**
 * Fetch audit logs filtered by workflow ID
 */
export function useAuditLogsByWorkflow(workflowId: number) {
  const { api, isElectron } = useElectron();

  return useQuery({
    ...auditLogKeys.byWorkflow(workflowId),
    enabled: isElectron && workflowId > 0,
    queryFn: () => api!.audit.findByWorkflow(workflowId),
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
  const { api } = useElectron();

  return useMutation({
    mutationFn: (data: NewAuditLog) => api!.audit.create(data),
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
          queryKey: auditLogKeys.byWorkflowStep(auditLog.workflowStepId)
            .queryKey,
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
  const { api } = useElectron();

  return useMutation({
    mutationFn: (workflowId: number) => api!.audit.export(workflowId),
  });
}

'use client';

import { $path } from 'next-typesafe-url';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

import type { Workflow } from '@/types/electron';

import { useActiveWorkflows } from '@/hooks/queries/use-workflows';
import { useToast } from '@/hooks/use-toast';

/**
 * Snapshot of a workflow's attention-relevant state, used to detect transitions.
 */
interface WorkflowSnapshot {
  currentStepNumber: null | number;
  status: string;
}

/**
 * Global component that monitors active workflows and shows toast notifications
 * when a workflow enters a state requiring user attention.
 *
 * Detects two types of attention events:
 * - **Awaiting Input**: The workflow's clarification step generated questions
 *   and is waiting for the user to answer them.
 * - **Auto-Paused**: The workflow completed a step and paused because
 *   `pauseBehavior` is set to `auto_pause`.
 *
 * Toasts include a "Go to Workflow" action button that navigates directly
 * to the workflow detail page. Each event is deduped so the same transition
 * only fires once.
 *
 * Must be rendered inside a ToastProvider and QueryProvider.
 */
/**
 * Extract the workflow ID from the pathname when on the workflow detail page.
 * Returns `null` if the user is not viewing a specific workflow.
 */
function getViewedWorkflowId(pathname: string): null | number {
  const match = /^\/workflows\/(?:old\/)?(\d+)$/.exec(pathname);
  if (!match?.[1]) return null;
  return Number(match[1]);
}

export const WorkflowAttentionNotifier = () => {
  const { data: activeWorkflows } = useActiveWorkflows();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();

  /** Previous state snapshot per workflow ID */
  const prevSnapshotRef = useRef<Map<number, WorkflowSnapshot>>(new Map());

  /** Set of dedupe keys to prevent duplicate toasts for the same event */
  const notifiedRef = useRef<Set<string>>(new Set());

  /**
   * Show a toast notification for a workflow that needs attention.
   * Suppressed when the user is already viewing this workflow's detail page.
   */
  function showAttentionToast(workflow: Workflow, reason: 'awaiting_input' | 'paused') {
    const viewedWorkflowId = getViewedWorkflowId(pathname);
    if (viewedWorkflowId === workflow.id) return;

    const workflowPath = $path({
      route: '/workflows/[id]',
      routeParams: { id: workflow.id },
    });

    if (reason === 'awaiting_input') {
      toast.warning({
        actionProps: {
          children: 'Go to Workflow',
          onClick: () => router.push(workflowPath),
        },
        description: `"${workflow.featureName}" needs your input to continue.`,
        timeout: 0,
        title: 'Awaiting Your Input',
      });
    } else {
      toast.info({
        actionProps: {
          children: 'Go to Workflow',
          onClick: () => router.push(workflowPath),
        },
        description: `"${workflow.featureName}" paused after completing a step.`,
        timeout: 0,
        title: 'Workflow Paused',
      });
    }
  }

  useEffect(() => {
    if (!activeWorkflows) return;

    const prevSnapshots = prevSnapshotRef.current;
    const notified = notifiedRef.current;

    for (const workflow of activeWorkflows) {
      const prev = prevSnapshots.get(workflow.id);
      const currentStep = workflow.currentStepNumber ?? 0;

      // Detect transition to awaiting_input
      if (workflow.status === 'awaiting_input' && prev && prev.status !== 'awaiting_input') {
        const dedupeKey = `${String(workflow.id)}:awaiting_input`;

        if (!notified.has(dedupeKey)) {
          notified.add(dedupeKey);
          showAttentionToast(workflow, 'awaiting_input');
        }
      }

      // Detect transition to paused via auto_pause (step advanced)
      if (
        workflow.status === 'paused' &&
        workflow.pauseBehavior === 'auto_pause' &&
        prev &&
        prev.status !== 'paused' &&
        currentStep > (prev.currentStepNumber ?? 0)
      ) {
        const dedupeKey = `${String(workflow.id)}:paused:${String(currentStep)}`;

        if (!notified.has(dedupeKey)) {
          notified.add(dedupeKey);
          showAttentionToast(workflow, 'paused');
        }
      }

      // Update snapshot
      prevSnapshots.set(workflow.id, {
        currentStepNumber: currentStep,
        status: workflow.status,
      });
    }

    // Clean up snapshots for workflows no longer in the active list
    const activeIds = new Set(activeWorkflows.map((w) => w.id));
    for (const id of prevSnapshots.keys()) {
      if (!activeIds.has(id)) {
        prevSnapshots.delete(id);
      }
    }

    // Prune old dedupe entries for workflows that are no longer active
    for (const key of notified) {
      const workflowId = parseInt(key.split(':')[0] ?? '', 10);
      if (!activeIds.has(workflowId)) {
        notified.delete(key);
      }
    }
  }, [activeWorkflows, pathname]); // eslint-disable-line react-hooks/exhaustive-deps -- toast and router are stable refs

  // This component renders nothing — it only produces side effects (toasts)
  return null;
};

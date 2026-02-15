'use client';

import type { ReactNode } from 'react';

import { createContext, use } from 'react';

import { usePlanningStream, type UsePlanningStreamReturn } from '@/hooks/use-planning-stream';

// =============================================================================
// Context
// =============================================================================

const PlanningStreamContext = createContext<null | UsePlanningStreamReturn>(null);

// =============================================================================
// Provider
// =============================================================================

interface PlanningStreamProviderProps {
  children: ReactNode;
  /** Whether the planning stream should be actively subscribed */
  isEnabled: boolean;
  /** The workflow ID to scope the stream to */
  workflowId: number;
}

/**
 * Provides a single planning stream subscription to all descendants.
 * Prevents duplicate subscriptions by centralizing the stream hook call.
 */
export const PlanningStreamProvider = ({ children, isEnabled, workflowId }: PlanningStreamProviderProps) => {
  const stream = usePlanningStream({ enabled: isEnabled, workflowId });

  return <PlanningStreamContext value={stream}>{children}</PlanningStreamContext>;
};

// =============================================================================
// Consumer Hook
// =============================================================================

/**
 * Consumes the planning stream state from the nearest
 * PlanningStreamProvider. Throws if called outside a provider.
 */
export const usePlanningStreamContext = (): UsePlanningStreamReturn => {
  const context = use(PlanningStreamContext);
  if (!context) {
    throw new Error('usePlanningStreamContext can only be called from within a <PlanningStreamProvider>');
  }
  return context;
};

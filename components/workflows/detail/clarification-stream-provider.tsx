'use client';

import type { ReactNode } from 'react';

import { createContext, use } from 'react';

import { useClarificationStream, type UseClarificationStreamReturn } from '@/hooks/use-clarification-stream';

// =============================================================================
// Context
// =============================================================================

const ClarificationStreamContext = createContext<null | UseClarificationStreamReturn>(null);

// =============================================================================
// Provider
// =============================================================================

interface ClarificationStreamProviderProps {
  children: ReactNode;
  /** Whether the clarification stream should be actively subscribed */
  isEnabled: boolean;
  /** The workflow ID to scope the stream to */
  workflowId: number;
}

/**
 * Provides a single clarification stream subscription to all descendants.
 * Prevents duplicate subscriptions by centralizing the stream hook call.
 */
export const ClarificationStreamProvider = ({ children, isEnabled, workflowId }: ClarificationStreamProviderProps) => {
  const stream = useClarificationStream({ enabled: isEnabled, workflowId });

  return <ClarificationStreamContext value={stream}>{children}</ClarificationStreamContext>;
};

// =============================================================================
// Consumer Hook
// =============================================================================

/**
 * Consumes the clarification stream state from the nearest
 * ClarificationStreamProvider. Throws if called outside a provider.
 */
export const useClarificationStreamContext = (): UseClarificationStreamReturn => {
  const context = use(ClarificationStreamContext);
  if (!context) {
    throw new Error('useClarificationStreamContext can only be called from within a <ClarificationStreamProvider>');
  }
  return context;
};

import type { ClarificationServicePhase } from '@/lib/validations/clarification';

/**
 * Human-readable labels for clarification service phases.
 * Shared between the clarification step content and streaming panel.
 */
export const PHASE_LABELS: Record<ClarificationServicePhase, string> = {
  cancelled: 'Cancelled',
  complete: 'Complete',
  error: 'Error',
  executing: 'Analyzing feature request...',
  executing_extended_thinking: 'Thinking deeply...',
  idle: 'Idle',
  loading_agent: 'Loading agent...',
  processing_response: 'Processing response...',
  timeout: 'Timed out',
  waiting_for_user: 'Waiting for answers',
};

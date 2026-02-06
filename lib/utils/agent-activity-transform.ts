import type { AgentActivity } from '@/db/schema/agent-activity.schema';
import type { StreamToolEvent } from '@/types/workflow-stream';

/**
 * Summary of token usage and estimated cost extracted from `usage`-type activity records.
 */
export interface ActivityUsageSummary {
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
  estimatedCost: number;
  inputTokens: number;
  outputTokens: number;
}

/**
 * The result of transforming persisted `AgentActivity` records into
 * the shape consumed by `StepStreamContent`.
 */
export interface TransformedActivityState {
  textContent: string;
  thinkingContent: string;
  toolEvents: Array<StreamToolEvent>;
  usageSummary: ActivityUsageSummary | null;
}

/**
 * Transforms an array of persisted `AgentActivity` records into the
 * `StreamToolEvent[]` format (plus accumulated text/thinking content
 * and a usage summary) that `StepStreamContent` expects.
 *
 * Activities are processed in creation order. Each event type is handled as follows:
 * - `tool_start` creates a new `StreamToolEvent` entry.
 * - `tool_stop` finds the matching event by `toolUseId` and sets `stoppedAt`.
 * - `tool_update` finds the matching event by `toolUseId` and updates `input`.
 * - `text_delta` concatenates `textDelta` into the accumulated text content.
 * - `thinking_delta` concatenates `textDelta` into the accumulated thinking content.
 * - `usage` extracts token counts and cost into the usage summary.
 *
 * @param activities - The persisted activity records, ideally sorted by `id` ascending.
 * @returns The transformed state ready for `StepStreamContent`.
 */
export function transformActivityToStreamState(activities: Array<AgentActivity>): TransformedActivityState {
  const toolEvents: Array<StreamToolEvent> = [];
  const toolEventsByUseId = new Map<string, StreamToolEvent>();

  let textContent = '';
  let thinkingContent = '';
  let usageSummary: ActivityUsageSummary | null = null;

  for (const activity of activities) {
    switch (activity.eventType) {
      case 'text_delta': {
        if (activity.textDelta) {
          textContent += activity.textDelta;
        }
        break;
      }

      case 'thinking_delta': {
        if (activity.textDelta) {
          thinkingContent += activity.textDelta;
        }
        break;
      }

      case 'tool_start': {
        if (activity.toolUseId) {
          const event: StreamToolEvent = {
            input: (activity.toolInput as Record<string, unknown>) ?? {},
            startedAt: activity.startedAt ?? Date.now(),
            stoppedAt: null,
            toolName: activity.toolName ?? 'unknown',
            toolUseId: activity.toolUseId,
          };

          toolEvents.push(event);
          toolEventsByUseId.set(activity.toolUseId, event);
        }
        break;
      }

      case 'tool_stop': {
        if (activity.toolUseId) {
          const existing = toolEventsByUseId.get(activity.toolUseId);
          if (existing) {
            existing.stoppedAt = activity.stoppedAt ?? Date.now();
          }
        }
        break;
      }

      case 'tool_update': {
        if (activity.toolUseId) {
          const existing = toolEventsByUseId.get(activity.toolUseId);
          if (existing && activity.toolInput) {
            existing.input = activity.toolInput as Record<string, unknown>;
          }
        }
        break;
      }

      case 'usage': {
        usageSummary = {
          cacheCreationInputTokens: activity.cacheCreationInputTokens ?? 0,
          cacheReadInputTokens: activity.cacheReadInputTokens ?? 0,
          estimatedCost: activity.estimatedCost ?? 0,
          inputTokens: activity.inputTokens ?? 0,
          outputTokens: activity.outputTokens ?? 0,
        };
        break;
      }

      default:
        // Other event types (e.g. phase_change, thinking_start) are
        // not needed for the StreamToolEvent format and are skipped.
        break;
    }
  }

  return {
    textContent,
    thinkingContent,
    toolEvents,
    usageSummary,
  };
}

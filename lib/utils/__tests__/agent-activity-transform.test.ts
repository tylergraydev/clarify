import { describe, expect, it } from 'vitest';

import type { AgentActivity } from '@/db/schema/agent-activity.schema';

import { transformActivityToStreamState } from '../agent-activity-transform';

/** Helper to create a minimal AgentActivity record with sensible defaults. */
function makeActivity(overrides: Partial<AgentActivity> & Pick<AgentActivity, 'eventType'>): AgentActivity {
  return {
    cacheCreationInputTokens: null,
    cacheReadInputTokens: null,
    createdAt: '2025-01-01T00:00:00Z',
    durationMs: null,
    estimatedCost: null,
    id: 1,
    inputTokens: null,
    outputTokens: null,
    phase: null,
    startedAt: null,
    stoppedAt: null,
    textDelta: null,
    thinkingBlockIndex: null,
    toolInput: null,
    toolName: null,
    toolUseId: null,
    updatedAt: '2025-01-01T00:00:00Z',
    workflowStepId: 1,
    ...overrides,
  };
}

describe('transformActivityToStreamState', () => {
  it('returns default state for empty array', () => {
    const result = transformActivityToStreamState([]);
    expect(result).toEqual({
      textContent: '',
      thinkingContent: '',
      toolEvents: [],
      usageSummary: null,
    });
  });

  it('concatenates text_delta events into textContent', () => {
    const activities = [
      makeActivity({ eventType: 'text_delta', textDelta: 'Hello ' }),
      makeActivity({ eventType: 'text_delta', textDelta: 'world' }),
    ];
    const result = transformActivityToStreamState(activities);
    expect(result.textContent).toBe('Hello world');
  });

  it('concatenates thinking_delta events into thinkingContent', () => {
    const activities = [
      makeActivity({ eventType: 'thinking_delta', textDelta: 'Thinking ' }),
      makeActivity({ eventType: 'thinking_delta', textDelta: 'deeply' }),
    ];
    const result = transformActivityToStreamState(activities);
    expect(result.thinkingContent).toBe('Thinking deeply');
  });

  it('creates a StreamToolEvent from tool_start', () => {
    const activities = [
      makeActivity({
        eventType: 'tool_start',
        startedAt: 1000,
        stoppedAt: null,
        toolInput: { path: '/foo' },
        toolName: 'Read',
        toolUseId: 'tu-1',
      }),
    ];
    const result = transformActivityToStreamState(activities);
    expect(result.toolEvents).toHaveLength(1);
    expect(result.toolEvents[0]).toEqual({
      input: { path: '/foo' },
      startedAt: 1000,
      stoppedAt: null,
      toolName: 'Read',
      toolUseId: 'tu-1',
    });
  });

  it('tool_stop sets stoppedAt on matching tool event', () => {
    const activities = [
      makeActivity({
        eventType: 'tool_start',
        startedAt: 1000,
        toolInput: {},
        toolName: 'Read',
        toolUseId: 'tu-1',
      }),
      makeActivity({
        eventType: 'tool_stop',
        stoppedAt: 2000,
        toolUseId: 'tu-1',
      }),
    ];
    const result = transformActivityToStreamState(activities);
    expect(result.toolEvents[0]?.stoppedAt).toBe(2000);
  });

  it('tool_update replaces input on matching tool event', () => {
    const activities = [
      makeActivity({
        eventType: 'tool_start',
        startedAt: 1000,
        toolInput: { old: true },
        toolName: 'Write',
        toolUseId: 'tu-2',
      }),
      makeActivity({
        eventType: 'tool_update',
        toolInput: { new: true },
        toolUseId: 'tu-2',
      }),
    ];
    const result = transformActivityToStreamState(activities);
    expect(result.toolEvents[0]?.input).toEqual({ new: true });
  });

  it('usage event populates usageSummary', () => {
    const activities = [
      makeActivity({
        cacheCreationInputTokens: 10,
        cacheReadInputTokens: 20,
        estimatedCost: 0.05,
        eventType: 'usage',
        inputTokens: 100,
        outputTokens: 200,
      }),
    ];
    const result = transformActivityToStreamState(activities);
    expect(result.usageSummary).toEqual({
      cacheCreationInputTokens: 10,
      cacheReadInputTokens: 20,
      estimatedCost: 0.05,
      inputTokens: 100,
      outputTokens: 200,
    });
  });

  it('skips events with null textDelta for text_delta', () => {
    const activities = [
      makeActivity({ eventType: 'text_delta', textDelta: null }),
    ];
    const result = transformActivityToStreamState(activities);
    expect(result.textContent).toBe('');
  });

  it('skips tool_start with null toolUseId', () => {
    const activities = [
      makeActivity({ eventType: 'tool_start', toolUseId: null }),
    ];
    const result = transformActivityToStreamState(activities);
    expect(result.toolEvents).toHaveLength(0);
  });

  it('skips thinking_delta with null textDelta', () => {
    const activities = [
      makeActivity({ eventType: 'thinking_delta', textDelta: null }),
    ];
    const result = transformActivityToStreamState(activities);
    expect(result.thinkingContent).toBe('');
  });

  it('tool_stop with null toolUseId has no effect', () => {
    const activities = [
      makeActivity({ eventType: 'tool_stop', toolUseId: null }),
    ];
    const result = transformActivityToStreamState(activities);
    expect(result.toolEvents).toHaveLength(0);
  });

  it('tool_stop with non-matching toolUseId does not crash', () => {
    const activities = [
      makeActivity({
        eventType: 'tool_start',
        startedAt: 1000,
        toolInput: {},
        toolName: 'Read',
        toolUseId: 'tu-1',
      }),
      makeActivity({
        eventType: 'tool_stop',
        stoppedAt: 2000,
        toolUseId: 'tu-nonexistent',
      }),
    ];
    const result = transformActivityToStreamState(activities);
    expect(result.toolEvents).toHaveLength(1);
    expect(result.toolEvents[0]?.stoppedAt).toBeNull();
  });

  it('tool_update with null toolUseId has no effect', () => {
    const activities = [
      makeActivity({ eventType: 'tool_update', toolUseId: null }),
    ];
    const result = transformActivityToStreamState(activities);
    expect(result.toolEvents).toHaveLength(0);
  });

  it('tool_update with valid toolUseId but null toolInput does not replace input', () => {
    const activities = [
      makeActivity({
        eventType: 'tool_start',
        startedAt: 1000,
        toolInput: { original: true },
        toolName: 'Write',
        toolUseId: 'tu-3',
      }),
      makeActivity({
        eventType: 'tool_update',
        toolInput: null,
        toolUseId: 'tu-3',
      }),
    ];
    const result = transformActivityToStreamState(activities);
    expect(result.toolEvents[0]?.input).toEqual({ original: true });
  });

  it('tool_start defaults for null fields (toolInput, startedAt, stoppedAt, toolName)', () => {
    const activities = [
      makeActivity({
        eventType: 'tool_start',
        startedAt: null,
        stoppedAt: null,
        toolInput: null,
        toolName: null,
        toolUseId: 'tu-defaults',
      }),
    ];
    const result = transformActivityToStreamState(activities);
    expect(result.toolEvents).toHaveLength(1);
    expect(result.toolEvents[0]?.input).toEqual({});
    expect(result.toolEvents[0]?.toolName).toBe('unknown');
    expect(result.toolEvents[0]?.stoppedAt).toBeNull();
    expect(typeof result.toolEvents[0]?.startedAt).toBe('number');
  });

  it('tool_stop defaults stoppedAt to Date.now() when null', () => {
    const activities = [
      makeActivity({
        eventType: 'tool_start',
        startedAt: 1000,
        toolInput: {},
        toolName: 'Read',
        toolUseId: 'tu-stopnull',
      }),
      makeActivity({
        eventType: 'tool_stop',
        stoppedAt: null,
        toolUseId: 'tu-stopnull',
      }),
    ];
    const result = transformActivityToStreamState(activities);
    expect(typeof result.toolEvents[0]?.stoppedAt).toBe('number');
    expect(result.toolEvents[0]!.stoppedAt).toBeGreaterThan(0);
  });

  it('usage event defaults null fields to 0', () => {
    const activities = [
      makeActivity({
        cacheCreationInputTokens: null,
        cacheReadInputTokens: null,
        estimatedCost: null,
        eventType: 'usage',
        inputTokens: null,
        outputTokens: null,
      }),
    ];
    const result = transformActivityToStreamState(activities);
    expect(result.usageSummary).toEqual({
      cacheCreationInputTokens: 0,
      cacheReadInputTokens: 0,
      estimatedCost: 0,
      inputTokens: 0,
      outputTokens: 0,
    });
  });

  it('tool_update with matching toolUseId but no existing event (non-matching) has no effect', () => {
    const activities = [
      makeActivity({
        eventType: 'tool_update',
        toolInput: { updated: true },
        toolUseId: 'tu-orphan',
      }),
    ];
    const result = transformActivityToStreamState(activities);
    expect(result.toolEvents).toHaveLength(0);
  });

  it('ignores unknown event types like phase_change (default case)', () => {
    const activities = [
      makeActivity({ eventType: 'phase_change' as AgentActivity['eventType'] }),
    ];
    const result = transformActivityToStreamState(activities);
    expect(result.textContent).toBe('');
    expect(result.thinkingContent).toBe('');
    expect(result.toolEvents).toHaveLength(0);
    expect(result.usageSummary).toBeNull();
  });

  it('processes mixed event sequence correctly', () => {
    const activities = [
      makeActivity({ eventType: 'text_delta', textDelta: 'Start ' }),
      makeActivity({
        eventType: 'tool_start',
        startedAt: 100,
        toolInput: {},
        toolName: 'Bash',
        toolUseId: 'tu-mix',
      }),
      makeActivity({ eventType: 'thinking_delta', textDelta: 'Hmm' }),
      makeActivity({
        eventType: 'tool_stop',
        stoppedAt: 200,
        toolUseId: 'tu-mix',
      }),
      makeActivity({ eventType: 'text_delta', textDelta: 'end' }),
      makeActivity({
        cacheCreationInputTokens: 0,
        cacheReadInputTokens: 0,
        estimatedCost: 0.01,
        eventType: 'usage',
        inputTokens: 50,
        outputTokens: 25,
      }),
    ];

    const result = transformActivityToStreamState(activities);
    expect(result.textContent).toBe('Start end');
    expect(result.thinkingContent).toBe('Hmm');
    expect(result.toolEvents).toHaveLength(1);
    expect(result.toolEvents[0]?.stoppedAt).toBe(200);
    expect(result.usageSummary).not.toBeNull();
    expect(result.usageSummary?.inputTokens).toBe(50);
  });
});

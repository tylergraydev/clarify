import { describe, expect, it } from 'vitest';

import { MAX_RETRY_ATTEMPTS } from '../agent-step-constants';
import { calculateBackoffDelay, isTransientError, RetryTracker } from '../retry-backoff';

describe('RetryTracker', () => {
  it('getRetryCount returns 0 for unknown session', () => {
    const tracker = new RetryTracker();
    expect(tracker.getRetryCount('unknown-session')).toBe(0);
  });

  it('incrementRetryCount returns incremented count', () => {
    const tracker = new RetryTracker();
    expect(tracker.incrementRetryCount('s1')).toBe(1);
    expect(tracker.incrementRetryCount('s1')).toBe(2);
    expect(tracker.incrementRetryCount('s1')).toBe(3);
  });

  it('tracks retry counts independently per session', () => {
    const tracker = new RetryTracker();
    tracker.incrementRetryCount('s1');
    tracker.incrementRetryCount('s1');
    tracker.incrementRetryCount('s2');

    expect(tracker.getRetryCount('s1')).toBe(2);
    expect(tracker.getRetryCount('s2')).toBe(1);
  });

  it('isRetryLimitReached returns false when under limit', () => {
    const tracker = new RetryTracker();
    tracker.incrementRetryCount('s1');
    tracker.incrementRetryCount('s1');
    expect(tracker.isRetryLimitReached('s1')).toBe(false);
  });

  it('isRetryLimitReached returns true at MAX_RETRY_ATTEMPTS', () => {
    const tracker = new RetryTracker();
    for (let i = 0; i < MAX_RETRY_ATTEMPTS; i++) {
      tracker.incrementRetryCount('s1');
    }
    expect(tracker.isRetryLimitReached('s1')).toBe(true);
  });

  it('clearRetryCount resets specific session', () => {
    const tracker = new RetryTracker();
    tracker.incrementRetryCount('s1');
    tracker.incrementRetryCount('s2');
    tracker.clearRetryCount('s1');

    expect(tracker.getRetryCount('s1')).toBe(0);
    expect(tracker.getRetryCount('s2')).toBe(1);
  });

  it('clearAll resets all sessions', () => {
    const tracker = new RetryTracker();
    tracker.incrementRetryCount('s1');
    tracker.incrementRetryCount('s2');
    tracker.clearAll();

    expect(tracker.getRetryCount('s1')).toBe(0);
    expect(tracker.getRetryCount('s2')).toBe(0);
  });
});

describe('calculateBackoffDelay', () => {
  it('returns 1000ms for retry 1', () => {
    expect(calculateBackoffDelay(1)).toBe(1000);
  });

  it('returns 2000ms for retry 2', () => {
    expect(calculateBackoffDelay(2)).toBe(2000);
  });

  it('returns 4000ms for retry 3', () => {
    expect(calculateBackoffDelay(3)).toBe(4000);
  });

  it('follows BASE_RETRY_DELAY_MS * 2^(retryCount-1) formula', () => {
    for (let i = 1; i <= 5; i++) {
      expect(calculateBackoffDelay(i)).toBe(1000 * Math.pow(2, i - 1));
    }
  });
});

describe('isTransientError', () => {
  it.each([
    'timeout',
    'network error',
    'connection refused',
    'rate limit exceeded',
    'temporarily unavailable',
    'service unavailable',
    'too many requests',
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
  ])('matches transient error pattern: %s', (message) => {
    expect(isTransientError(message)).toBe(true);
  });

  it.each([
    'Invalid API key',
    'Schema validation failed',
    'Permission denied',
  ])('does not match non-transient error: %s', (message) => {
    expect(isTransientError(message)).toBe(false);
  });

  it('matches case-insensitively', () => {
    expect(isTransientError('TIMEOUT ERROR')).toBe(true);
    expect(isTransientError('Network Error')).toBe(true);
    expect(isTransientError('Connection Refused')).toBe(true);
  });
});

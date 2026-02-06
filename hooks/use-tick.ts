'use client';

import { useEffect, useState } from 'react';

/**
 * Reusable hook that forces periodic re-renders for live elapsed timers.
 * Returns the current timestamp (ms) captured at each tick interval.
 * No interval is created when `enabled` is false.
 *
 * The returned timestamp is stored in state so it can be used during
 * render without calling `Date.now()` directly (which violates React
 * component purity rules).
 *
 * @param options.enabled - Whether the tick interval is active
 * @param options.intervalMs - Milliseconds between ticks (default: 1000)
 * @returns The current timestamp in milliseconds, updated each tick
 */
export function useTick({ enabled, intervalMs = 1000 }: { enabled: boolean; intervalMs?: number }): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return;

    const id = setInterval(() => {
      setNow(Date.now());
    }, intervalMs);

    return () => {
      clearInterval(id);
    };
  }, [enabled, intervalMs]);

  return now;
}

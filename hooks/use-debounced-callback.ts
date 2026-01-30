import { useCallback, useEffect, useRef } from 'react';

interface UseDebouncedCallbackOptions {
  /** Delay in milliseconds before the callback is invoked */
  delay: number;
}

interface UseDebouncedCallbackReturn<TArgs extends Array<unknown>> {
  /** Cancels any pending debounced call without executing */
  cancel: () => void;
  /** The debounced version of the callback */
  debounced: (...args: TArgs) => void;
  /** Immediately executes the callback if there's a pending call, then cancels the timer */
  flush: () => void;
  /** Whether there's a pending debounced call */
  isPending: () => boolean;
}

/**
 * Creates a debounced version of a callback function.
 *
 * @example
 * ```tsx
 * const { debounced, flush, cancel } = useDebouncedCallback(
 *   () => saveData(),
 *   { delay: 1500 }
 * );
 *
 * // Call debounced to trigger after delay
 * debounced();
 *
 * // Call flush to immediately execute if pending
 * flush();
 *
 * // Call cancel to cancel without executing
 * cancel();
 * ```
 */
export function useDebouncedCallback<TArgs extends Array<unknown>>(
  callback: (...args: TArgs) => void,
  { delay }: UseDebouncedCallbackOptions
): UseDebouncedCallbackReturn<TArgs> {
  const timerRef = useRef<null | ReturnType<typeof setTimeout>>(null);
  const callbackRef = useRef(callback);
  const pendingArgsRef = useRef<null | TArgs>(null);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    pendingArgsRef.current = null;
  }, []);

  const flush = useCallback(() => {
    if (timerRef.current && pendingArgsRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      const args = pendingArgsRef.current;
      pendingArgsRef.current = null;
      callbackRef.current(...args);
    }
  }, []);

  const isPending = useCallback(() => {
    return timerRef.current !== null;
  }, []);

  const debounced = useCallback(
    (...args: TArgs) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      pendingArgsRef.current = args;

      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        pendingArgsRef.current = null;
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );

  return { cancel, debounced, flush, isPending };
}

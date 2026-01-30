'use client';

import { useEffect, useEffectEvent, useState } from 'react';

/**
 * Convenience hook to detect mobile viewport (< 768px).
 * Matches Tailwind's md breakpoint.
 *
 * @returns boolean indicating if viewport is mobile-sized
 *
 * @example
 * ```tsx
 * const isMobile = useIsMobile();
 * if (isMobile) {
 *   // Render mobile-specific UI
 * }
 * ```
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/**
 * Hook to detect if a CSS media query matches.
 * SSR-safe: returns false during server-side rendering.
 *
 * @param query - CSS media query string (e.g., "(max-width: 767px)")
 * @returns boolean indicating if the media query matches
 *
 * @example
 * ```tsx
 * const isLargeScreen = useMediaQuery("(min-width: 1024px)");
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  const updateMatches = useEffectEvent((matches: boolean) => {
    setMatches(matches);
  });

  useEffect(() => {
    const media = window.matchMedia(query);
    updateMatches(media.matches);

    const listener = (event: MediaQueryListEvent) => {
      updateMatches(event.matches);
    };

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

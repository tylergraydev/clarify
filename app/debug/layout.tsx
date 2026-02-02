'use client';

import type { ReactNode } from 'react';

import { QueryProvider } from '@/components/providers/query-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';

// ============================================================================
// Types
// ============================================================================

interface DebugLayoutProps {
  children: ReactNode;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Minimal layout for the debug window.
 *
 * This layout is designed for a standalone Electron window and intentionally
 * excludes the AppShell components (header, sidebar, status bar) that are
 * present in the main application layout.
 *
 * Features:
 * - QueryProvider for TanStack Query support
 * - ThemeProvider for consistent theming with main window
 * - Full viewport height styling
 */
export default function DebugLayout({ children }: DebugLayoutProps) {
  return (
    <QueryProvider>
      <ThemeProvider>
        {/* Debug Window Container */}
        <div
          className={`
            flex
            h-screen
            flex-col
            overflow-hidden
            bg-background
            text-foreground
          `}
        >
          {children}
        </div>
      </ThemeProvider>
    </QueryProvider>
  );
}

'use client';

import { AppHeader, AppSidebar, StatusBar } from '@/components/shell';
import { useShellStore } from '@/lib/stores/shell-store';
import { cn } from '@/lib/utils';

type AppLayoutProps = RequiredChildren;

/**
 * App shell layout component that provides the four-region design:
 * - AppHeader at the top (fixed)
 * - AppSidebar on the left (fixed)
 * - Main content area in the center
 * - StatusBar at the bottom (fixed)
 *
 * The main content area adjusts its margins to account for the fixed
 * header, sidebar, and status bar positions.
 */
export default function AppLayout({ children }: AppLayoutProps) {
  const { isSidebarCollapsed } = useShellStore();

  return (
    <div className={'relative min-h-screen bg-background'}>
      {/* Header - fixed at top */}
      <AppHeader />

      {/* Sidebar - fixed on left */}
      <AppSidebar />

      {/* Main content area */}
      <main
        className={cn(
          `
            min-h-[calc(100vh-3rem-2rem)]
            overflow-y-auto
            transition-[margin-left] duration-200 ease-out
          `,
          // Margin top accounts for header height (48px = 3rem)
          'mt-12',
          // Margin bottom accounts for status bar height (32px = 2rem)
          'mb-8',
          // Padding uses CSS variables for responsive values
          'px-(--padding-content-x) py-(--padding-content-y)',
          // Margin left accounts for sidebar width based on collapsed state
          isSidebarCollapsed
            ? 'ml-(--sidebar-width-collapsed)'
            : 'ml-(--sidebar-width-expanded)'
        )}
      >
        {children}
      </main>

      {/* Status bar - fixed at bottom */}
      <StatusBar />
    </div>
  );
}

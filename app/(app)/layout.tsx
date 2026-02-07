'use client';

import { ShellLayoutProvider } from '@/components/providers/shell-layout-provider';
import { AppHeader, AppSidebar, StatusBar } from '@/components/shell';
import { WorkflowAttentionNotifier } from '@/components/workflows/workflow-attention-notifier';
import { useActiveWorkflows } from '@/hooks/queries/use-workflows';
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
  const { data: activeWorkflows } = useActiveWorkflows();

  return (
    <ShellLayoutProvider>
      {/* Global workflow attention toasts (renders nothing, fires toasts on status transitions) */}
      <WorkflowAttentionNotifier />

      <div className={'relative min-h-screen bg-background'}>
        {/* Header - fixed at top */}
        <AppHeader />

        {/* Sidebar - fixed on left, hidden on mobile */}
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
            // No left margin on mobile (sidebar hidden), responsive margin on tablet+
            'ml-0',
            isSidebarCollapsed ? 'md:ml-(--sidebar-width-collapsed)' : 'md:ml-(--sidebar-width-expanded)'
          )}
        >
          {children}
        </main>

        {/* Status bar - fixed at bottom */}
        <StatusBar activeWorkflowCount={activeWorkflows?.length ?? 0} />
      </div>
    </ShellLayoutProvider>
  );
}

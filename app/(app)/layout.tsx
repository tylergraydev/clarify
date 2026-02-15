'use client';

import { CommandPalette, CommandPaletteDialogs } from '@/components/command-palette';
import { ShellLayoutProvider } from '@/components/providers/shell-layout-provider';
import { AppHeader, AppSidebar, StatusBar } from '@/components/shell';
import { TerminalPanel } from '@/components/terminal';
import { WorkflowAttentionNotifier } from '@/components/workflows/workflow-attention-notifier';
import { useActiveWorkflows } from '@/hooks/queries/use-workflows';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';
import { useCommandPaletteStore } from '@/lib/stores/command-palette-store';
import { useShellStore } from '@/lib/stores/shell-store';
import { cn } from '@/lib/utils';

type AppLayoutProps = RequiredChildren;

/**
 * App shell layout component that provides the four-region design:
 * - AppHeader at the top (fixed)
 * - AppSidebar on the left (fixed)
 * - Main content area in the center (flex-1)
 * - TerminalPanel at the bottom of the content area (resizable)
 * - StatusBar at the bottom (fixed)
 *
 * The main content and terminal panel live in a flex-col wrapper
 * that fills the available space between header and status bar.
 */
export default function AppLayout({ children }: AppLayoutProps) {
  const { isSidebarCollapsed } = useShellStore();
  const { data: activeWorkflows } = useActiveWorkflows();
  const { toggle: toggleCommandPalette } = useCommandPaletteStore();

  useKeyboardShortcut(toggleCommandPalette, { key: 'k', modifiers: ['meta'] });

  return (
    <ShellLayoutProvider>
      {/* Global command palette (Cmd+K) */}
      <CommandPalette />
      <CommandPaletteDialogs />

      {/* Global workflow attention toasts (renders nothing, fires toasts on status transitions) */}
      <WorkflowAttentionNotifier />

      <div className={'relative min-h-screen bg-background'}>
        {/* Header - fixed at top */}
        <AppHeader />

        {/* Sidebar - fixed on left, hidden on mobile */}
        <AppSidebar />

        {/* Content wrapper: main + terminal panel */}
        <div
          className={cn(
            'flex flex-col transition-[margin-left] duration-200 ease-out',
            // Top accounts for header height (48px = 3rem)
            'mt-12',
            // Bottom accounts for status bar height (32px = 2rem)
            'mb-8',
            // Height fills between header and status bar
            'h-[calc(100vh-3rem-2rem)]',
            // No left margin on mobile (sidebar hidden), responsive margin on tablet+
            'ml-0',
            isSidebarCollapsed ? 'md:ml-(--sidebar-width-collapsed)' : 'md:ml-(--sidebar-width-expanded)'
          )}
        >
          {/* Main content area */}
          <main
            className={cn(
              'flex-1 overflow-y-auto',
              'px-(--padding-content-x) py-(--padding-content-y)'
            )}
          >
            {children}
          </main>

          {/* Terminal panel - sits at bottom of content wrapper */}
          <TerminalPanel />
        </div>

        {/* Status bar - fixed at bottom */}
        <StatusBar activeWorkflowCount={activeWorkflows?.length ?? 0} />
      </div>
    </ShellLayoutProvider>
  );
}

'use client';

import { DebugLogViewer } from '@/components/debug';

/**
 * Debug Window Page.
 *
 * This page serves as the entry point for the standalone debug log window.
 * It renders the DebugLogViewer component for viewing and filtering logs.
 *
 * Features:
 * - Full viewport height display
 * - Integration with debug log IPC events
 * - Real-time log streaming from Claude Agent SDK
 * - Virtualized log list for performance
 * - Filtering by level, category, and session
 * - Auto-refresh capability
 */
export default function DebugPage() {
  return (
    <div className={'flex h-full flex-1 flex-col bg-background'}>
      {/* Header */}
      <div
        className={`
          flex
          h-12
          shrink-0
          items-center
          border-b
          border-border
          bg-card
          px-4
        `}
      >
        <h1 className={'text-sm font-medium'}>Debug Log Viewer</h1>
      </div>

      {/* Main Content */}
      <div className={'flex-1 overflow-hidden'}>
        <DebugLogViewer className={'h-full'} />
      </div>
    </div>
  );
}

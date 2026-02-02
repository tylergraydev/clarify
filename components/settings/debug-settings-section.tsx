'use client';

import type { ReactElement } from 'react';

import { ExternalLink, FolderOpen } from 'lucide-react';

import { useDebugLogPath, useOpenDebugLogFile } from '@/hooks/queries/use-debug-logs';
import { useToast } from '@/hooks/use-toast';

import { Button } from '../ui/button';
import { SettingsSection } from './settings-section';

/**
 * Debug settings section for managing debug logging and diagnostics.
 * Contains controls for opening the debug window and accessing log files.
 *
 * Note: Like UISettingsSection, this section manages its own state through
 * IPC calls rather than being part of the form.
 */
export const DebugSettingsSection = (): ReactElement => {
  const toast = useToast();
  const { data: logPath, isLoading: isLoadingPath } = useDebugLogPath();
  const openLogFileMutation = useOpenDebugLogFile();

  const handleOpenDebugWindow = async () => {
    try {
      await window.electronAPI?.debugLog.openDebugWindow();
    } catch {
      toast.error({
        description: 'Failed to open debug window. Please try again.',
        title: 'Error',
      });
    }
  };

  const handleOpenLogFile = async () => {
    try {
      const result = await openLogFileMutation.mutateAsync();
      if (!result.success) {
        toast.error({
          description: result.error ?? 'Failed to open log file.',
          title: 'Error',
        });
      }
    } catch {
      toast.error({
        description: 'Failed to open log file. Please try again.',
        title: 'Error',
      });
    }
  };

  const isLogPathDisplayed = !isLoadingPath && logPath;

  return (
    <SettingsSection title={'Debug & Diagnostics'}>
      {/* Debug Window Control */}
      <div className={'flex flex-col gap-2'}>
        <div className={'flex items-center justify-between'}>
          <div className={'flex flex-col gap-1'}>
            <span className={'text-sm font-medium'}>Debug Window</span>
            <span className={'text-xs text-muted-foreground'}>
              Open a separate window to view real-time debug logs and diagnostics
            </span>
          </div>
          <Button onClick={handleOpenDebugWindow} size={'sm'} variant={'outline'}>
            <ExternalLink className={'size-4'} />
            Open Debug Window
          </Button>
        </div>
      </div>

      {/* Log File Access */}
      <div className={'flex flex-col gap-2'}>
        <div className={'flex items-center justify-between'}>
          <div className={'flex flex-col gap-1'}>
            <span className={'text-sm font-medium'}>Log File</span>
            <span className={'text-xs text-muted-foreground'}>
              Open the debug log file in your default text editor
            </span>
          </div>
          <Button
            disabled={openLogFileMutation.isPending}
            onClick={handleOpenLogFile}
            size={'sm'}
            variant={'outline'}
          >
            <FolderOpen className={'size-4'} />
            {openLogFileMutation.isPending ? 'Opening...' : 'Open Log File'}
          </Button>
        </div>

        {/* Log File Path Display */}
        {isLogPathDisplayed && (
          <div className={'rounded-md bg-muted px-3 py-2'}>
            <span className={'font-mono text-xs text-muted-foreground'}>{logPath}</span>
          </div>
        )}
      </div>
    </SettingsSection>
  );
};

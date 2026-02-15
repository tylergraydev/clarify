'use client';

import type { ReactElement } from 'react';

import { CheckCircle2, Code2, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { useCallback, useState } from 'react';

import type { EditorId } from '@/types/editor';

import {
  useDetectedEditors,
  useOpenInEditor,
  usePreferredEditor,
  useSetPreferredEditor,
} from '@/hooks/queries/use-editor';
import { useToast } from '@/hooks/use-toast';

import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  SelectItem,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { SettingsSection } from './settings-section';

// ============================================================================
// EditorSettingsSection
// ============================================================================

export const EditorSettingsSection = (): ReactElement => {
  const toast = useToast();
  const { data: detectedEditors, isLoading, refetch } = useDetectedEditors();
  const { data: preferred } = usePreferredEditor();
  const setPreferredMutation = useSetPreferredEditor();
  const openMutation = useOpenInEditor();

  const [customCommand, setCustomCommand] = useState(preferred?.customCommand ?? '');

  const handleEditorChange = useCallback(
    async (editorId: string) => {
      if (!editorId) return;
      try {
        await setPreferredMutation.mutateAsync({
          customCommand: editorId === 'custom' ? customCommand : undefined,
          editorId: editorId as EditorId,
        });
        toast.success({ description: `Preferred editor set.`, title: 'Editor Updated' });
      } catch {
        toast.error({ description: 'Failed to set preferred editor.', title: 'Error' });
      }
    },
    [customCommand, setPreferredMutation, toast]
  );

  const handleCustomCommandSave = useCallback(async () => {
    if (!customCommand.trim()) return;
    try {
      await setPreferredMutation.mutateAsync({
        customCommand: customCommand.trim(),
        editorId: 'custom',
      });
      toast.success({ description: 'Custom editor command saved.', title: 'Editor Updated' });
    } catch {
      toast.error({ description: 'Failed to save custom command.', title: 'Error' });
    }
  }, [customCommand, setPreferredMutation, toast]);

  const handleTest = useCallback(async () => {
    try {
      const result = await openMutation.mutateAsync({ filePath: '.' });
      if (result.success) {
        toast.success({ description: 'Editor opened successfully.', title: 'Test Passed' });
      } else {
        toast.error({ description: result.error ?? 'Could not open editor.', title: 'Test Failed' });
      }
    } catch {
      toast.error({ description: 'Failed to test editor.', title: 'Error' });
    }
  }, [openMutation, toast]);

  const handleRedetect = useCallback(async () => {
    try {
      await refetch();
      toast.success({ description: 'Editor detection refreshed.', title: 'Detection Complete' });
    } catch {
      toast.error({ description: 'Failed to detect editors.', title: 'Error' });
    }
  }, [refetch, toast]);

  // Build select items from detected editors + custom option
  const selectItems: Record<string, string> = {};
  if (detectedEditors) {
    for (const editor of detectedEditors) {
      if (editor.available) {
        selectItems[editor.id] = editor.displayName;
      }
    }
  }
  selectItems['custom'] = 'Custom Command';

  return (
    <SettingsSection title={'External Editor'}>
      <p className={'text-xs text-muted-foreground'}>
        Configure your preferred code editor for opening files from the diff viewer and file explorer.
      </p>

      {isLoading ? (
        <div className={'flex items-center justify-center py-4'}>
          <Loader2 className={'size-5 animate-spin text-muted-foreground'} />
        </div>
      ) : (
        <div className={'flex flex-col gap-4'}>
          {/* Detected editors */}
          <div className={'flex flex-col gap-2'}>
            <div className={'flex items-center justify-between'}>
              <span className={'text-xs font-medium text-muted-foreground'}>Detected Editors</span>
              <Button onClick={handleRedetect} size={'sm'} variant={'ghost'}>
                <RefreshCw className={'size-3.5'} />
                Re-detect
              </Button>
            </div>
            <div className={'flex flex-wrap gap-2'}>
              {detectedEditors?.map((editor) => (
                <div className={'flex items-center gap-1.5'} key={editor.id}>
                  {editor.available ? (
                    <CheckCircle2 className={'size-3.5 text-emerald-500'} />
                  ) : (
                    <XCircle className={'size-3.5 text-muted-foreground/50'} />
                  )}
                  <span className={editor.available ? 'text-xs text-foreground' : 'text-xs text-muted-foreground/50'}>
                    {editor.displayName}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Preferred editor selector */}
          <div>
            <label className={'mb-1 block text-xs font-medium text-muted-foreground'}>Preferred Editor</label>
            <div className={'flex items-center gap-2'}>
              <div className={'w-64'}>
                <SelectRoot
                  items={selectItems}
                  onValueChange={(value) => {
                    if (value) void handleEditorChange(value);
                  }}
                  value={preferred?.editorId ?? ''}
                >
                  <SelectTrigger size={'sm'}>
                    <SelectValue placeholder={'Select an editor...'} />
                  </SelectTrigger>
                  <SelectPortal>
                    <SelectPositioner>
                      <SelectPopup size={'sm'}>
                        <SelectList>
                          {Object.entries(selectItems).map(([value, label]) => (
                            <SelectItem key={value} size={'sm'} value={value}>
                              <div className={'flex items-center gap-2'}>
                                <Code2 className={'size-3.5'} />
                                {label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectList>
                      </SelectPopup>
                    </SelectPositioner>
                  </SelectPortal>
                </SelectRoot>
              </div>

              {preferred?.editorId && (
                <div className={'flex items-center gap-2'}>
                  <Badge size={'sm'} variant={'completed'}>
                    Active
                  </Badge>
                  <Button disabled={openMutation.isPending} onClick={handleTest} size={'sm'} variant={'outline'}>
                    {openMutation.isPending ? <Loader2 className={'size-3.5 animate-spin'} /> : null}
                    Test
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Custom command input */}
          {preferred?.editorId === 'custom' && (
            <div>
              <label className={'mb-1 block text-xs font-medium text-muted-foreground'}>Custom Command</label>
              <div className={'flex items-center gap-2'}>
                <Input
                  className={'font-mono'}
                  onChange={(e) => setCustomCommand(e.target.value)}
                  placeholder={'/usr/local/bin/my-editor'}
                  size={'sm'}
                  value={customCommand}
                />
                <Button
                  disabled={!customCommand.trim() || setPreferredMutation.isPending}
                  onClick={handleCustomCommandSave}
                  size={'sm'}
                  variant={'default'}
                >
                  {setPreferredMutation.isPending ? <Loader2 className={'size-3.5 animate-spin'} /> : null}
                  Save
                </Button>
              </div>
              <p className={'mt-1 text-[10px] text-muted-foreground'}>
                The file path will be passed as the first argument.
              </p>
            </div>
          )}
        </div>
      )}
    </SettingsSection>
  );
};

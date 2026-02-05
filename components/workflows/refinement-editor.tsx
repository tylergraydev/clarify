'use client';

import type { ChangeEvent, ComponentPropsWithRef, ReactElement } from 'react';

import { AlertTriangle, RefreshCw, RotateCcw, Save } from 'lucide-react';
import { Fragment, useCallback, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

/**
 * Soft warning threshold for character count (10K characters).
 * Displays a warning when content exceeds this limit.
 */
const CHARACTER_WARNING_THRESHOLD = 10_000;

/**
 * Props for the RefinementEditor component.
 */
interface RefinementEditorProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** The initial text content for the editor */
  initialText: string;
  /** Whether the component is disabled */
  isDisabled?: boolean;
  /** Whether regeneration is in progress */
  isRegenerating?: boolean;
  /** Callback when the regenerate button is clicked with guidance */
  onRegenerate?: (guidance: string) => void;
  /** Callback when the revert button is clicked */
  onRevert?: () => void;
  /** Callback when the save button is clicked with the edited text */
  onSave?: (text: string) => void;
}

/**
 * RefinementEditor provides an interface for editing refinement output with
 * character count warnings, save/revert functionality, and regeneration capability.
 *
 * Features:
 * - Plain textarea for editing refinement text
 * - Character count display with warning at 10K+ characters
 * - Save button (enabled when text differs from initial)
 * - Revert button (enabled when text differs from initial)
 * - Regenerate section with guidance textarea
 *
 * @example
 * ```tsx
 * <RefinementEditor
 *   initialText="Initial refinement content..."
 *   isRegenerating={false}
 *   onSave={(text) => console.log('Saved:', text)}
 *   onRevert={() => console.log('Reverted')}
 *   onRegenerate={(guidance) => console.log('Regenerate with:', guidance)}
 * />
 * ```
 */
export const RefinementEditor = ({
  className,
  initialText,
  isDisabled = false,
  isRegenerating = false,
  onRegenerate,
  onRevert,
  onSave,
  ref,
  ...props
}: RefinementEditorProps): ReactElement => {
  // 1. useState hooks
  const [editedText, setEditedText] = useState(initialText);
  const [guidanceText, setGuidanceText] = useState('');

  // 3. useMemo hooks
  const characterCount = useMemo(() => editedText.length, [editedText]);

  const isOverThreshold = useMemo(() => characterCount > CHARACTER_WARNING_THRESHOLD, [characterCount]);

  const hasChanges = useMemo(() => editedText !== initialText, [editedText, initialText]);

  const isActionsDisabled = useMemo(() => isDisabled || isRegenerating, [isDisabled, isRegenerating]);

  const isSaveEnabled = useMemo(() => hasChanges && !isActionsDisabled, [hasChanges, isActionsDisabled]);

  const isRevertEnabled = useMemo(() => hasChanges && !isActionsDisabled, [hasChanges, isActionsDisabled]);

  const isRegenerateEnabled = useMemo(
    () => guidanceText.trim().length > 0 && !isActionsDisabled,
    [guidanceText, isActionsDisabled]
  );

  // 6. Event handlers
  const handleTextChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setEditedText(event.target.value);
  }, []);

  const handleGuidanceChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setGuidanceText(event.target.value);
  }, []);

  const handleSaveClick = useCallback(() => {
    if (isSaveEnabled && onSave) {
      onSave(editedText);
    }
  }, [editedText, isSaveEnabled, onSave]);

  const handleRevertClick = useCallback(() => {
    if (isRevertEnabled && onRevert) {
      setEditedText(initialText);
      onRevert();
    }
  }, [initialText, isRevertEnabled, onRevert]);

  const handleRegenerateClick = useCallback(() => {
    if (isRegenerateEnabled && onRegenerate) {
      onRegenerate(guidanceText);
      setGuidanceText('');
    }
  }, [guidanceText, isRegenerateEnabled, onRegenerate]);

  return (
    <div className={cn('flex flex-col gap-6', className)} ref={ref} {...props}>
      {/* Main Editor Section */}
      <div className={'rounded-2xl border border-border/60 bg-background/80 p-6 shadow-sm'}>
        {/* Editor Header */}
        <div className={'mb-4 flex items-center justify-between'}>
          <h3 className={'text-base font-semibold text-foreground'}>Edit Refinement</h3>

          {/* Character Count */}
          <div
            className={cn(
              'flex items-center gap-2 text-sm',
              isOverThreshold ? 'text-(--warning-text)' : 'text-muted-foreground'
            )}
          >
            {isOverThreshold && <AlertTriangle className={'size-4'} />}
            <span>
              {characterCount.toLocaleString()}
              {' characters'}
            </span>
          </div>
        </div>

        {/* Editor Textarea */}
        <Textarea
          className={'min-h-80 font-mono text-sm'}
          disabled={isActionsDisabled}
          onChange={handleTextChange}
          placeholder={'Enter refinement text...'}
          value={editedText}
        />

        {/* Character Warning */}
        {isOverThreshold && (
          <p className={'mt-2 flex items-center gap-2 text-sm text-(--warning-text)'}>
            <AlertTriangle className={'size-4'} />
            Content exceeds {CHARACTER_WARNING_THRESHOLD.toLocaleString()} characters. Consider summarizing or splitting
            into smaller sections.
          </p>
        )}

        {/* Action Buttons */}
        <div className={'mt-4 flex items-center justify-end gap-3'}>
          <Button disabled={!isRevertEnabled} onClick={handleRevertClick} type={'button'} variant={'outline'}>
            <RotateCcw className={'size-4'} />
            Revert
          </Button>
          <Button disabled={!isSaveEnabled} onClick={handleSaveClick} type={'button'}>
            <Save className={'size-4'} />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Regeneration Section */}
      <div className={'rounded-2xl border border-border/60 bg-background/80 p-6 shadow-sm'}>
        {/* Regeneration Header */}
        <div className={'mb-4'}>
          <h3 className={'text-base font-semibold text-foreground'}>Regenerate with Guidance</h3>
          <p className={'mt-1 text-sm text-muted-foreground'}>
            Provide specific instructions to guide the regeneration of the refinement.
          </p>
        </div>

        {/* Guidance Textarea */}
        <Textarea
          className={'min-h-24'}
          disabled={isActionsDisabled}
          onChange={handleGuidanceChange}
          placeholder={
            'Enter guidance for regeneration (e.g., "Focus more on error handling" or "Add more detail about the database schema")...'
          }
          value={guidanceText}
        />

        {/* Regenerate Button */}
        <div className={'mt-4 flex items-center justify-end'}>
          <Button disabled={!isRegenerateEnabled} onClick={handleRegenerateClick} type={'button'} variant={'secondary'}>
            {isRegenerating ? (
              <Fragment>
                <RefreshCw className={'size-4 animate-spin'} />
                Regenerating...
              </Fragment>
            ) : (
              <Fragment>
                <RefreshCw className={'size-4'} />
                Regenerate with Guidance
              </Fragment>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

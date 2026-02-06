'use client';

import { Check, FolderOpen, Pencil, RotateCcw, SkipForward, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { type ChangeEvent, Fragment } from 'react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

const PLACEHOLDER_REFINED_TEXT = `The feature request has been refined to include detailed implementation context. The user wants to build a new notification system that supports both in-app and email delivery channels. The system should integrate with the existing user preferences module to respect per-user notification settings.

Additionally, the notification system must support batching for high-frequency events to avoid overwhelming users. Each notification type should be configurable with custom templates, and the system should provide a centralized dashboard for monitoring delivery rates and failures.

The implementation should follow the existing event-driven architecture pattern, leveraging the message queue infrastructure already in place. Priority should be given to ensuring backward compatibility with the current alert system during the migration period.`;

const handleRerun = () => {
  // No-op: placeholder
};

const handleRefineMore = () => {
  // No-op: placeholder
};

const handleSkip = () => {
  // No-op: placeholder
};

const handleBrowseFiles = () => {
  // No-op: placeholder
};

export const RefinementStepContent = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [refinedText, setRefinedText] = useState(PLACEHOLDER_REFINED_TEXT);

  const handleEditToggleClick = () => {
    setIsEditing((prev) => !prev);
  };

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setRefinedText(e.target.value);
  };

  return (
    <div className={'flex flex-col gap-6'}>
      {/* Refined Feature Request */}
      <div className={'flex flex-col gap-3'}>
        <div className={'flex items-center justify-between'}>
          <h3 className={'text-sm font-medium text-foreground'}>Refined Feature Request</h3>
          <Button onClick={handleEditToggleClick} size={'sm'} variant={'ghost'}>
            {isEditing ? (
              <Fragment>
                <Check aria-hidden={'true'} className={'size-4'} />
                Done
              </Fragment>
            ) : (
              <Fragment>
                <Pencil aria-hidden={'true'} className={'size-4'} />
                Edit
              </Fragment>
            )}
          </Button>
        </div>

        {isEditing ? (
          <Textarea onChange={handleTextChange} rows={12} value={refinedText} />
        ) : (
          <div className={'max-w-none rounded-md border border-border bg-muted/30 p-4 text-sm/relaxed text-foreground'}>
            {refinedText.split('\n\n').map((paragraph, index) => (
              <p className={'mb-3 last:mb-0'} key={index}>
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Additional Files */}
      <div className={'flex flex-col gap-2'}>
        <h3 className={'text-sm font-medium text-foreground'}>Additional Files</h3>
        <div className={'flex items-center gap-2 rounded-md border border-dashed border-border p-3'}>
          <span className={'text-sm text-muted-foreground'}>No additional files selected</span>
          <Button className={'ml-auto'} onClick={handleBrowseFiles} size={'sm'} variant={'outline'}>
            <FolderOpen aria-hidden={'true'} className={'size-4'} />
            Browse
          </Button>
        </div>
      </div>

      <Separator />

      {/* Action Bar */}
      <div className={'flex items-center gap-2'}>
        <Button onClick={handleRerun} variant={'outline'}>
          <RotateCcw aria-hidden={'true'} className={'size-4'} />
          Re-run
        </Button>

        <Button onClick={handleRefineMore} variant={'outline'}>
          <Sparkles aria-hidden={'true'} className={'size-4'} />
          Refine More
        </Button>

        <Button onClick={handleSkip} variant={'ghost'}>
          <SkipForward aria-hidden={'true'} className={'size-4'} />
          Skip
        </Button>

        {/* Agent Dropdown Placeholder */}
        <Fragment>
          <div className={'ml-auto'}>
            <Button disabled variant={'outline'}>
              Agent: Default
            </Button>
          </div>
        </Fragment>
      </div>
    </div>
  );
};

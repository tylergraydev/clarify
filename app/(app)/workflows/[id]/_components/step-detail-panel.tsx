'use client';

import type { ComponentPropsWithRef, ReactNode } from 'react';

import { format } from 'date-fns';
import { AlertCircle, Clock, Edit3, FileText, Pencil, RefreshCw, SkipForward } from 'lucide-react';

import type { WorkflowStep } from '@/db/schema/workflow-steps.schema';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRegenerateStep, useSkipStep } from '@/hooks/queries/use-steps';
import { cn } from '@/lib/utils';

/**
 * Format a timestamp string for display.
 * @param timestamp - ISO timestamp string or null
 * @returns Formatted date string or placeholder
 */
const formatTimestamp = (timestamp: null | string): string => {
  if (!timestamp) {
    return '—';
  }
  return format(new Date(timestamp), 'MMM d, yyyy h:mm:ss a');
};

/**
 * Format duration in milliseconds to human-readable string.
 * @param durationMs - Duration in milliseconds or null
 * @returns Formatted duration string
 */
const formatDuration = (durationMs: null | number): string => {
  if (durationMs === null || durationMs === undefined) {
    return '—';
  }

  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }

  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${remainingSeconds}s`;
};

interface ContentSectionProps extends Omit<ComponentPropsWithRef<'div'>, 'content' | 'title'> {
  icon: ReactNode;
  sectionTitle: string;
  textContent: null | string;
}

const ContentSection = ({ className, icon, ref, sectionTitle, textContent, ...props }: ContentSectionProps) => {
  const isContentEmpty = !textContent || textContent.trim().length === 0;

  return (
    <Card className={cn('flex flex-col', className)} ref={ref} {...props}>
      <CardHeader className={'py-3'}>
        <CardTitle className={'flex items-center gap-2 text-sm'}>
          {icon}
          {sectionTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className={'flex-1 pb-3'}>
        <div
          className={cn(
            'max-h-48 overflow-y-auto rounded-md border border-border bg-muted/30 p-3',
            'font-mono text-xs/relaxed whitespace-pre-wrap',
            isContentEmpty && 'text-muted-foreground italic'
          )}
        >
          {isContentEmpty ? 'No content available' : textContent}
        </div>
      </CardContent>
    </Card>
  );
};

interface TimingInfoProps extends ComponentPropsWithRef<'div'> {
  completedAt: null | string;
  durationMs: null | number;
  startedAt: null | string;
}

const TimingInfo = ({ className, completedAt, durationMs, ref, startedAt, ...props }: TimingInfoProps) => {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-4 rounded-md border border-border bg-muted/30 px-4 py-3 text-sm',
        className
      )}
      ref={ref}
      {...props}
    >
      {/* Started At */}
      <div className={'flex items-center gap-2'}>
        <Clock aria-hidden={'true'} className={'size-4 text-muted-foreground'} />
        <span className={'text-muted-foreground'}>Started:</span>
        <span className={'font-medium'}>{formatTimestamp(startedAt)}</span>
      </div>

      {/* Completed At */}
      <div className={'flex items-center gap-2'}>
        <span className={'text-muted-foreground'}>Completed:</span>
        <span className={'font-medium'}>{formatTimestamp(completedAt)}</span>
      </div>

      {/* Duration */}
      <div className={'flex items-center gap-2'}>
        <span className={'text-muted-foreground'}>Duration:</span>
        <span className={'font-medium'}>{formatDuration(durationMs)}</span>
      </div>
    </div>
  );
};

type StepDetailPanelProps = ComponentPropsWithRef<'div'> & {
  onEditClick?: () => void;
  step: Pick<
    WorkflowStep,
    | 'completedAt'
    | 'durationMs'
    | 'errorMessage'
    | 'id'
    | 'inputText'
    | 'originalOutputText'
    | 'outputEditedAt'
    | 'outputText'
    | 'startedAt'
    | 'status'
  >;
};

export const StepDetailPanel = ({ className, onEditClick, ref, step, ...props }: StepDetailPanelProps) => {
  const regenerateStepMutation = useRegenerateStep();
  const skipStepMutation = useSkipStep();

  const {
    completedAt,
    durationMs,
    errorMessage,
    id,
    inputText,
    originalOutputText,
    outputEditedAt,
    outputText,
    startedAt,
    status,
  } = step;

  // Determine which actions are available based on status
  const isCanEdit = status === 'completed';
  const isCanRetry = status === 'failed';
  const isCanSkip = status === 'pending' || status === 'paused';
  const hasActions = isCanEdit || isCanRetry || isCanSkip;

  const handleRetry = () => {
    regenerateStepMutation.mutate(id);
  };

  const handleSkip = () => {
    skipStepMutation.mutate(id);
  };

  const isOutputEdited = Boolean(outputEditedAt);
  const hasError = Boolean(errorMessage);

  return (
    <div className={cn('flex flex-col gap-4', className)} ref={ref} {...props}>
      {/* Step Actions */}
      {hasActions && (
        <div className={'flex items-center gap-2'}>
          {isCanEdit && (
            <Button onClick={onEditClick} size={'sm'} variant={'outline'}>
              <Pencil aria-hidden={'true'} className={'mr-1.5 size-3.5'} />
              {'Edit Output'}
            </Button>
          )}
          {isCanRetry && (
            <Button disabled={regenerateStepMutation.isPending} onClick={handleRetry} size={'sm'} variant={'outline'}>
              <RefreshCw
                aria-hidden={'true'}
                className={cn('mr-1.5 size-3.5', regenerateStepMutation.isPending && 'animate-spin')}
              />
              {regenerateStepMutation.isPending ? 'Retrying...' : 'Retry'}
            </Button>
          )}
          {isCanSkip && (
            <Button disabled={skipStepMutation.isPending} onClick={handleSkip} size={'sm'} variant={'outline'}>
              <SkipForward aria-hidden={'true'} className={'mr-1.5 size-3.5'} />
              {skipStepMutation.isPending ? 'Skipping...' : 'Skip'}
            </Button>
          )}
        </div>
      )}

      {/* Error Message */}
      {hasError && (
        <Alert variant={'destructive'}>
          <AlertCircle aria-hidden={'true'} className={'size-4'} />
          <div className={'flex flex-col gap-1'}>
            <AlertTitle>{'Error'}</AlertTitle>
            <AlertDescription className={'font-mono text-xs whitespace-pre-wrap'}>{errorMessage}</AlertDescription>
          </div>
        </Alert>
      )}

      {/* Timing Information */}
      <TimingInfo completedAt={completedAt} durationMs={durationMs} startedAt={startedAt} />

      {/* Input Section */}
      <ContentSection
        icon={<FileText aria-hidden={'true'} className={'size-4'} />}
        sectionTitle={'Input'}
        textContent={inputText}
      />

      {/* Output Section */}
      <div className={'flex flex-col gap-2'}>
        {/* Edited Indicator */}
        {isOutputEdited && (
          <div className={'flex items-center gap-2'}>
            <Badge size={'sm'} variant={'clarifying'}>
              <Edit3 aria-hidden={'true'} className={'mr-1 size-3'} />
              Edited
            </Badge>
            <span className={'text-xs text-muted-foreground'}>Modified on {formatTimestamp(outputEditedAt)}</span>
          </div>
        )}

        <ContentSection
          icon={<FileText aria-hidden={'true'} className={'size-4'} />}
          sectionTitle={isOutputEdited ? 'Output (Edited)' : 'Output'}
          textContent={outputText}
        />

        {/* Original Output if edited */}
        {isOutputEdited && originalOutputText && (
          <ContentSection
            className={'opacity-75'}
            icon={<FileText aria-hidden={'true'} className={'size-4'} />}
            sectionTitle={'Original Output'}
            textContent={originalOutputText}
          />
        )}
      </div>
    </div>
  );
};

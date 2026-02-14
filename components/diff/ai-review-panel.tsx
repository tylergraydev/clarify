'use client';

import {
  AlertTriangle,
  Bug,
  ChevronDown,
  ChevronRight,
  Info,
  Lightbulb,
  ShieldAlert,
} from 'lucide-react';
import { useCallback, useState } from 'react';

import { cn } from '@/lib/utils';

export interface AiReviewIssue {
  category: string;
  description: string;
  lineNumber: null | number;
  severity: 'error' | 'info' | 'suggestion' | 'warning';
  suggestion?: string;
}

interface AiReviewPanelProps {
  className?: string;
  isStreaming?: boolean;
  issues: Array<AiReviewIssue>;
  onAddAsComment?: (issue: AiReviewIssue) => void;
  onJumpToLine?: (lineNumber: number) => void;
}

const SEVERITY_CONFIG: Record<AiReviewIssue['severity'], { color: string; icon: typeof Bug; label: string }> = {
  error: { color: 'text-red-600 dark:text-red-400', icon: Bug, label: 'Error' },
  info: { color: 'text-blue-600 dark:text-blue-400', icon: Info, label: 'Info' },
  suggestion: { color: 'text-green-600 dark:text-green-400', icon: Lightbulb, label: 'Suggestion' },
  warning: { color: 'text-yellow-600 dark:text-yellow-400', icon: AlertTriangle, label: 'Warning' },
};

export const AiReviewPanel = ({
  className,
  isStreaming = false,
  issues,
  onAddAsComment,
  onJumpToLine,
}: AiReviewPanelProps) => {
  const [expandedIssues, setExpandedIssues] = useState<Set<number>>(new Set());

  const handleToggleIssue = useCallback((index: number) => {
    setExpandedIssues((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const suggestionCount = issues.filter((i) => i.severity === 'suggestion').length;

  return (
    <div className={cn('flex flex-col rounded-md border border-border', className)}>
      {/* Header */}
      <div className={'flex items-center gap-3 border-b border-border bg-muted/50 px-3 py-2'}>
        <ShieldAlert aria-hidden={'true'} className={'size-4 text-muted-foreground'} />
        <span className={'text-xs font-medium'}>
          AI Review
          {isStreaming && ' (analyzing...)'}
        </span>
        <div className={'ml-auto flex items-center gap-2 text-[10px]'}>
          {errorCount > 0 && (
            <span className={'text-red-600 dark:text-red-400'}>{errorCount} error{errorCount !== 1 ? 's' : ''}</span>
          )}
          {warningCount > 0 && (
            <span className={'text-yellow-600 dark:text-yellow-400'}>{warningCount} warning{warningCount !== 1 ? 's' : ''}</span>
          )}
          {suggestionCount > 0 && (
            <span className={'text-green-600 dark:text-green-400'}>{suggestionCount} suggestion{suggestionCount !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {/* Issues */}
      {issues.length === 0 ? (
        <div className={'flex items-center justify-center py-6 text-xs text-muted-foreground'}>
          {isStreaming ? 'Analyzing code...' : 'No issues found'}
        </div>
      ) : (
        <div className={'flex flex-col'}>
          {issues.map((issue, index) => {
            const config = SEVERITY_CONFIG[issue.severity];
            const Icon = config.icon;
            const isExpanded = expandedIssues.has(index);

            return (
              <div className={'border-b border-border/50 last:border-b-0'} key={index}>
                {/* Issue header */}
                <button
                  className={'flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted/30'}
                  onClick={() => handleToggleIssue(index)}
                  type={'button'}
                >
                  {isExpanded ? (
                    <ChevronDown aria-hidden={'true'} className={'size-3 shrink-0 text-muted-foreground'} />
                  ) : (
                    <ChevronRight aria-hidden={'true'} className={'size-3 shrink-0 text-muted-foreground'} />
                  )}
                  <Icon aria-hidden={'true'} className={cn('size-3.5 shrink-0', config.color)} />
                  <span className={cn('text-[10px] font-medium', config.color)}>
                    {config.label}
                  </span>
                  <span className={'min-w-0 flex-1 truncate text-xs'}>{issue.description}</span>
                  {issue.lineNumber !== null && (
                    <button
                      className={'shrink-0 rounded-sm px-1 text-[10px] text-muted-foreground hover:text-accent'}
                      onClick={(e) => {
                        e.stopPropagation();
                        onJumpToLine?.(issue.lineNumber!);
                      }}
                      type={'button'}
                    >
                      L{issue.lineNumber}
                    </button>
                  )}
                </button>
                {/* Issue details */}
                {isExpanded && (
                  <div className={'px-3 pb-2 pl-9'}>
                    <p className={'text-xs text-muted-foreground'}>{issue.description}</p>
                    {issue.suggestion && (
                      <div className={'mt-1.5 rounded-sm bg-muted/50 p-2'}>
                        <span className={'text-[10px] font-medium text-muted-foreground'}>Suggestion: </span>
                        <span className={'text-xs'}>{issue.suggestion}</span>
                      </div>
                    )}
                    {onAddAsComment && (
                      <button
                        className={'mt-1.5 text-[10px] text-accent hover:underline'}
                        onClick={() => onAddAsComment(issue)}
                        type={'button'}
                      >
                        Add as comment
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

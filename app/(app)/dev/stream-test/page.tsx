'use client';

import { BrainIcon, Loader2Icon, PlayIcon, SquareIcon } from 'lucide-react';
import { Fragment, useCallback, useState } from 'react';

import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from '@/components/ui/ai/chain-of-thought';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAgentStream } from '@/hooks/use-agent-stream';
import { cn } from '@/lib/utils';

/**
 * Stream Test Page
 *
 * Development page for testing MessagePort streaming between
 * Electron main process and renderer.
 */
export default function StreamTestPage() {
  const stream = useAgentStream();
  const [showDebug, setShowDebug] = useState(false);

  const handleStart = useCallback(async () => {
    try {
      // Note: We don't set cwd here as process.cwd() is not available in the browser.
      // The service will use the default working directory or the cwd can be
      // obtained from settings/project context in a real implementation.
      await stream.start({
        allowedTools: ['Read', 'Glob', 'Grep', 'ask_clarifying_questions'],
        maxTurns: 20,
        permissionMode: 'bypassPermissions',
        prompt: 'Analyze the codebase and ask clarifying questions.',
      });
    } catch (error) {
      console.error('Failed to start stream:', error);
    }
  }, [stream]);

  const handleCancel = useCallback(async () => {
    await stream.cancel();
  }, [stream]);

  // Get the clarification tool call if present
  const clarificationTool = stream.activeTools.find((t) => t.toolName === 'ask_clarifying_questions');

  // Parse questions from tool input
  const questions = clarificationTool?.toolInput as
    | undefined
    | {
        assessment?: {
          codebaseContext?: Array<string>;
          reason: string;
          score: number;
        };
        questions?: Array<{
          header: string;
          multiSelect?: boolean;
          options: Array<{ description: string; label: string }>;
          question: string;
        }>;
      };

  // Computed state for button disabling
  const isStreamActive = stream.isStarting || stream.status === 'running' || stream.status === 'waiting_input';
  const canCancel = stream.status === 'running' || stream.status === 'waiting_input';
  const hasQuestions = questions?.questions && questions.questions.length > 0;

  return (
    <div className={'space-y-6'}>
      {/* Page Header */}
      <header className={'space-y-1'}>
        <h1 className={'text-2xl font-semibold tracking-tight'}>Stream Test</h1>
        <p className={'text-muted-foreground'}>Development page for testing MessagePort streaming prototype.</p>
      </header>

      {/* Controls */}
      <div className={'flex items-center gap-3'}>
        <Button disabled={isStreamActive} onClick={handleStart} size={'sm'}>
          {stream.isStarting ? (
            <Fragment>
              <Loader2Icon className={'mr-2 size-4 animate-spin'} />
              Starting...
            </Fragment>
          ) : (
            <Fragment>
              <PlayIcon className={'mr-2 size-4'} />
              Start Stream
            </Fragment>
          )}
        </Button>

        <Button disabled={!canCancel} onClick={handleCancel} size={'sm'} variant={'outline'}>
          <SquareIcon className={'mr-2 size-4'} />
          Cancel
        </Button>

        <Button onClick={() => setShowDebug(!showDebug)} size={'sm'} variant={'ghost'}>
          {showDebug ? 'Hide' : 'Show'} Debug
        </Button>

        {/* Status Badge */}
        <Badge
          className={cn(
            stream.status === 'running' && 'bg-blue-500/10 text-blue-500',
            stream.status === 'waiting_input' && 'bg-yellow-500/10 text-yellow-500',
            stream.status === 'completed' && 'bg-green-500/10 text-green-500',
            stream.status === 'error' && 'bg-red-500/10 text-red-500',
            stream.status === 'cancelled' && 'bg-muted text-muted-foreground'
          )}
          variant={'default'}
        >
          {stream.status}
        </Badge>

        {stream.sessionId && (
          <span className={'text-xs text-muted-foreground'}>Session: {stream.sessionId.slice(0, 8)}...</span>
        )}
      </div>

      {/* Main Content */}
      <div className={'grid gap-6 lg:grid-cols-2'}>
        {/* Left Column - Stream Output */}
        <div className={'space-y-4'}>
          {/* Chain of Thought */}
          {stream.thinking.length > 0 && (
            <ChainOfThought defaultOpen={stream.status === 'running'}>
              <ChainOfThoughtHeader>
                <BrainIcon className={'mr-2 size-4'} />
                Thinking ({stream.thinking.length} steps)
              </ChainOfThoughtHeader>
              <ChainOfThoughtContent>
                {stream.thinking.map((thought, index) => {
                  const isLastAndRunning = index === stream.thinking.length - 1 && stream.status === 'running';
                  return (
                    <ChainOfThoughtStep key={index} label={thought} status={isLastAndRunning ? 'active' : 'complete'} />
                  );
                })}
              </ChainOfThoughtContent>
            </ChainOfThought>
          )}

          {/* Streaming Text */}
          {stream.text && (
            <div className={'rounded-lg border border-border bg-card p-4'}>
              <h3 className={'mb-2 text-sm font-medium'}>Response</h3>
              <p className={'text-sm whitespace-pre-wrap text-foreground'}>
                {stream.text}
                {stream.status === 'running' && <span className={'ml-0.5 animate-pulse text-blue-500'}>|</span>}
              </p>
            </div>
          )}

          {/* Active Tools */}
          {stream.activeTools.length > 0 && (
            <div className={'rounded-lg border border-border bg-card p-4'}>
              <h3 className={'mb-2 text-sm font-medium'}>Active Tools</h3>
              <div className={'space-y-2'}>
                {stream.activeTools.map((tool) => (
                  <div className={'flex items-center gap-2 text-sm'} key={tool.toolUseId}>
                    <Loader2Icon className={'size-4 animate-spin text-muted-foreground'} />
                    <span className={'font-mono'}>{tool.toolName}</span>
                    <span className={'truncate text-xs text-muted-foreground'}>{JSON.stringify(tool.toolInput)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Clarification Questions */}
        <div className={'space-y-4'}>
          {questions?.assessment && (
            <div className={'rounded-lg border border-border bg-card p-4'}>
              <h3 className={'mb-2 text-sm font-medium'}>Assessment</h3>
              <div className={'space-y-2 text-sm'}>
                <div className={'flex items-center justify-between'}>
                  <span className={'text-muted-foreground'}>Completeness Score</span>
                  <Badge variant={'default'}>{questions.assessment.score}/5</Badge>
                </div>
                <p className={'text-muted-foreground'}>{questions.assessment.reason}</p>
                {questions.assessment.codebaseContext && (
                  <div className={'mt-2'}>
                    <span className={'text-xs font-medium text-muted-foreground'}>Context:</span>
                    <ul className={'mt-1 list-inside list-disc text-xs text-muted-foreground'}>
                      {questions.assessment.codebaseContext.map((ctx, i) => (
                        <li key={i}>{ctx}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {hasQuestions && questions.questions && (
            <div className={'rounded-lg border border-border bg-card p-4'}>
              <h3 className={'mb-4 text-sm font-medium'}>Clarifying Questions ({questions.questions.length})</h3>
              <div className={'space-y-6'}>
                {questions.questions.map((q, qIndex) => (
                  <div className={'space-y-2'} key={qIndex}>
                    <div className={'flex items-center gap-2'}>
                      <Badge variant={'default'}>{q.header}</Badge>
                    </div>
                    <p className={'text-sm'}>{q.question}</p>
                    <div className={'space-y-2'}>
                      {q.options.map((opt, oIndex) => (
                        <label
                          className={
                            'flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 transition-colors hover:bg-muted/50'
                          }
                          key={oIndex}
                        >
                          <input
                            className={'mt-1'}
                            name={`question-${qIndex}`}
                            type={q.multiSelect ? 'checkbox' : 'radio'}
                          />
                          <div>
                            <div className={'text-sm font-medium'}>{opt.label}</div>
                            <div className={'text-xs text-muted-foreground'}>{opt.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className={'mt-4 flex justify-end gap-2'}>
                <Button
                  onClick={() => {
                    if (clarificationTool) {
                      stream.sendToolResult(clarificationTool.toolUseId, { skipped: true });
                    }
                  }}
                  size={'sm'}
                  variant={'ghost'}
                >
                  Skip
                </Button>
                <Button
                  onClick={() => {
                    if (clarificationTool) {
                      // TODO: Collect actual answers from form inputs
                      stream.sendToolResult(clarificationTool.toolUseId, { answers: {} });
                    }
                  }}
                  size={'sm'}
                >
                  Submit Answers
                </Button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {stream.error && (
            <div className={'rounded-lg border border-destructive/50 bg-destructive/10 p-4'}>
              <h3 className={'mb-2 text-sm font-medium text-destructive'}>Error</h3>
              <p className={'text-sm text-destructive'}>{stream.error}</p>
            </div>
          )}

          {/* Result Display */}
          {stream.result && (
            <div className={'rounded-lg border border-green-500/50 bg-green-500/10 p-4'}>
              <h3 className={'mb-2 text-sm font-medium text-green-600 dark:text-green-400'}>Completed</h3>
              <p className={'text-sm'}>{stream.result}</p>
            </div>
          )}
        </div>
      </div>

      {/* Debug Panel */}
      {showDebug && (
        <div className={'rounded-lg border border-border bg-muted/30 p-4'}>
          <h3 className={'mb-2 text-sm font-medium'}>Debug: All Messages ({stream.messages.length})</h3>
          <div className={'max-h-96 space-y-1 overflow-auto font-mono text-xs'}>
            {stream.messages.map((msg, i) => (
              <div className={'rounded-sm bg-background p-2'} key={i}>
                <span className={'text-muted-foreground'}>[{(msg as { type?: string }).type ?? 'unknown'}]</span>{' '}
                {JSON.stringify(msg, null, 2)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { BotIcon, ChevronDownIcon, Loader2Icon, WrenchIcon } from 'lucide-react';
import { memo, useState } from 'react';
import { Streamdown } from 'streamdown';

import type { AgentStreamState } from '@/types/agent-stream';

import { Shimmer } from '@/components/ui/ai/shimmer';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface ChatStreamingMessageProps {
  stream: Pick<AgentStreamState, 'activeTools' | 'status' | 'text' | 'thinking' | 'toolResults'>;
}

export const ChatStreamingMessage = memo(({ stream }: ChatStreamingMessageProps) => {
  const hasContent = stream.text || stream.thinking.length > 0 || stream.activeTools.length > 0 || stream.toolResults.length > 0;
  const isRunning = stream.status === 'running' || stream.status === 'initializing';

  if (!isRunning && !hasContent) return null;

  return (
    <div className={'flex gap-3'}>
      <div className={'flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground'}>
        <BotIcon className={'size-4'} />
      </div>
      <div className={'max-w-[80%] min-w-0 rounded-lg bg-muted px-4 py-2 text-foreground'}>
        {/* Loading shimmer when no content yet */}
        {!hasContent && isRunning && (
          <div className={'flex items-center gap-2 text-sm text-muted-foreground'}>
            <Loader2Icon className={'size-3 animate-spin'} />
            <Shimmer duration={1}>{'Thinking...'}</Shimmer>
          </div>
        )}

        {/* Thinking blocks */}
        {stream.thinking.map((thought, i) => (
          <StreamingThinkingBlock
            isStreaming={isRunning && i === stream.thinking.length - 1}
            key={i}
            thinking={thought}
          />
        ))}

        {/* Completed tool results paired with their tool uses */}
        {stream.toolResults.map((result) => (
          <StreamingToolResult
            isError={result.isError}
            key={result.toolUseId}
            output={result.output}
            toolUseId={result.toolUseId}
          />
        ))}

        {/* Active tool calls with spinner */}
        {stream.activeTools.map((tool) => (
          <div className={'my-1 flex items-center gap-2 text-xs text-muted-foreground'} key={tool.toolUseId}>
            <Loader2Icon className={'size-3 animate-spin'} />
            <WrenchIcon className={'size-3'} />
            <span className={'font-mono'}>{tool.toolName}</span>
          </div>
        ))}

        {/* Streaming text */}
        {stream.text && (
          <div className={'max-w-none text-sm'}>
            <Streamdown>{stream.text}</Streamdown>
          </div>
        )}
      </div>
    </div>
  );
});

ChatStreamingMessage.displayName = 'ChatStreamingMessage';

const StreamingThinkingBlock = memo(({ isStreaming, thinking }: { isStreaming: boolean; thinking: string }) => {
  const [isOpen, setIsOpen] = useState(isStreaming);

  return (
    <Collapsible onOpenChange={setIsOpen} open={isOpen}>
      <div className={'my-2'}>
        <CollapsibleTrigger
          className={'flex w-full items-center gap-2 text-xs text-muted-foreground hover:text-foreground'}
          isHideChevron
          variant={'ghost'}
        >
          <span className={'inline-flex size-4 items-center justify-center rounded-sm bg-muted text-[10px]'}>
            {'💭'}
          </span>
          {isStreaming ? (
            <Shimmer duration={1}>{'Thinking...'}</Shimmer>
          ) : (
            <span>{'Thought'}</span>
          )}
          <ChevronDownIcon className={cn('size-3 transition-transform', isOpen ? 'rotate-180' : 'rotate-0')} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className={'mt-1 max-h-40 overflow-y-auto rounded-md border border-border/50 bg-muted/30 p-3 text-xs text-muted-foreground'}>
            <Streamdown>{thinking}</Streamdown>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
});

StreamingThinkingBlock.displayName = 'StreamingThinkingBlock';

const StreamingToolResult = memo(
  ({ isError, output, toolUseId: _toolUseId }: { isError?: boolean; output: unknown; toolUseId: string }) => {
    const outputStr = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
    const isLong = outputStr.length > 200;
    const [isOpen, setIsOpen] = useState(false);

    return (
      <Collapsible onOpenChange={setIsOpen} open={isOpen}>
        <div className={'my-1'}>
          <CollapsibleTrigger
            className={cn(
              'flex w-full items-center gap-2 text-xs hover:text-foreground',
              isError ? 'text-destructive' : 'text-muted-foreground'
            )}
            isHideChevron
            variant={'ghost'}
          >
            {isError ? '⚠' : '✓'}
            <span>{isError ? 'Error' : 'Result'}</span>
            {isLong && (
              <ChevronDownIcon className={cn('size-3 transition-transform', isOpen ? 'rotate-180' : 'rotate-0')} />
            )}
          </CollapsibleTrigger>
          {isLong ? (
            <CollapsibleContent>
              <pre className={cn(
                'mt-1 max-h-40 overflow-auto rounded-md border p-2 text-xs',
                isError ? 'border-destructive/30 bg-destructive/5' : 'border-border/50 bg-muted/30'
              )}>
                {outputStr}
              </pre>
            </CollapsibleContent>
          ) : (
            <pre className={cn(
              'mt-1 overflow-x-auto rounded-md border p-2 text-xs',
              isError ? 'border-destructive/30 bg-destructive/5' : 'border-border/50 bg-muted/30'
            )}>
              {outputStr}
            </pre>
          )}
        </div>
      </Collapsible>
    );
  }
);

StreamingToolResult.displayName = 'StreamingToolResult';

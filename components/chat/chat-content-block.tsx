'use client';

import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  WrenchIcon,
} from 'lucide-react';
import { Fragment, memo, useState } from 'react';
import { Streamdown } from 'streamdown';

import type { ChatContentBlock } from '@/types/chat';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface ChatContentBlockRendererProps {
  block: ChatContentBlock;
}

export const ChatContentBlockRenderer = memo(({ block }: ChatContentBlockRendererProps) => {
  switch (block.type) {
    case 'text':
      return <TextBlock text={block.text} />;
    case 'thinking':
      return <ThinkingBlock thinking={block.thinking} />;
    case 'tool_result':
      return <ToolResultBlock isError={block.isError} output={block.output} toolUseId={block.toolUseId} />;
    case 'tool_use':
      return <ToolUseBlock toolInput={block.toolInput} toolName={block.toolName} />;
    default:
      return null;
  }
});

ChatContentBlockRenderer.displayName = 'ChatContentBlockRenderer';

const TextBlock = memo(({ text }: { text: string }) => {
  if (!text.trim()) return null;
  return (
    <div className={'max-w-none text-sm'}>
      <Streamdown>{text}</Streamdown>
    </div>
  );
});

TextBlock.displayName = 'TextBlock';

const ThinkingBlock = memo(({ thinking }: { thinking: string }) => {
  const [isOpen, setIsOpen] = useState(false);

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
          <span>{'Thinking'}</span>
          <ChevronDownIcon className={cn('size-3 transition-transform', isOpen ? 'rotate-180' : 'rotate-0')} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className={'mt-1 rounded-md border border-border/50 bg-muted/30 p-3 text-xs text-muted-foreground'}>
            <Streamdown>{thinking}</Streamdown>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
});

ThinkingBlock.displayName = 'ThinkingBlock';

const ToolUseBlock = memo(({ toolInput, toolName }: { toolInput: Record<string, unknown>; toolName: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const inputStr = JSON.stringify(toolInput, null, 2);
  const isLongInput = inputStr.length > 200;

  return (
    <Collapsible onOpenChange={setIsOpen} open={isOpen}>
      <div className={'my-1'}>
        <CollapsibleTrigger
          className={'flex w-full items-center gap-2 text-xs text-muted-foreground hover:text-foreground'}
          isHideChevron
          variant={'ghost'}
        >
          <WrenchIcon className={'size-3'} />
          <span className={'font-mono'}>{toolName}</span>
          {isLongInput && (
            <ChevronDownIcon className={cn('size-3 transition-transform', isOpen ? 'rotate-180' : 'rotate-0')} />
          )}
        </CollapsibleTrigger>
        {isLongInput ? (
          <CollapsibleContent>
            <pre className={'mt-1 overflow-x-auto rounded-md border border-border/50 bg-muted/30 p-2 text-xs'}>
              {inputStr}
            </pre>
          </CollapsibleContent>
        ) : (
          <pre className={'mt-1 overflow-x-auto rounded-md border border-border/50 bg-muted/30 p-2 text-xs'}>
            {inputStr}
          </pre>
        )}
      </div>
    </Collapsible>
  );
});

ToolUseBlock.displayName = 'ToolUseBlock';

const ToolResultBlock = memo(
  ({ isError, output, toolUseId: _toolUseId }: { isError?: boolean; output: unknown; toolUseId: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const outputStr = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
    const isLong = outputStr.length > 300;
    const preview = isLong ? `${outputStr.slice(0, 150)}...` : outputStr;

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
            {isError ? <AlertTriangleIcon className={'size-3'} /> : <CheckCircle2Icon className={'size-3'} />}
            <span>{isError ? 'Error' : 'Result'}</span>
            {isLong && (
              <ChevronDownIcon className={cn('size-3 transition-transform', isOpen ? 'rotate-180' : 'rotate-0')} />
            )}
          </CollapsibleTrigger>
          {isLong ? (
            <Fragment>
              {!isOpen && (
                <pre
                  className={cn(
                    'mt-1 overflow-x-auto rounded-md border p-2 text-xs',
                    isError ? 'border-destructive/30 bg-destructive/5' : 'border-border/50 bg-muted/30'
                  )}
                >
                  {preview}
                </pre>
              )}
              <CollapsibleContent>
                <pre
                  className={cn(
                    'mt-1 max-h-60 overflow-auto rounded-md border p-2 text-xs',
                    isError ? 'border-destructive/30 bg-destructive/5' : 'border-border/50 bg-muted/30'
                  )}
                >
                  {outputStr}
                </pre>
              </CollapsibleContent>
            </Fragment>
          ) : (
            <pre
              className={cn(
                'mt-1 overflow-x-auto rounded-md border p-2 text-xs',
                isError ? 'border-destructive/30 bg-destructive/5' : 'border-border/50 bg-muted/30'
              )}
            >
              {outputStr}
            </pre>
          )}
        </div>
      </Collapsible>
    );
  }
);

ToolResultBlock.displayName = 'ToolResultBlock';

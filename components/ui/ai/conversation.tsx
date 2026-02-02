'use client';

import type { ComponentPropsWithRef, ReactNode } from 'react';
import type { StickToBottomContext, StickToBottomProps } from 'use-stick-to-bottom';

import { ArrowDownIcon } from 'lucide-react';
import { Fragment, useCallback } from 'react';
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ConversationProps = Omit<StickToBottomProps, 'initial' | 'resize'> & {
  initial?: 'instant' | 'smooth';
  resize?: 'instant' | 'smooth';
};

export const Conversation = ({
  children,
  className,
  initial = 'smooth',
  resize = 'smooth',
  ...props
}: ConversationProps) => {
  return (
    <StickToBottom
      className={cn('relative flex-1 overflow-y-hidden', className)}
      initial={initial}
      resize={resize}
      role={'log'}
      {...props}
    >
      {children}
    </StickToBottom>
  );
};

interface ConversationContentProps {
  children: ((context: StickToBottomContext) => ReactNode) | ReactNode;
  className?: string;
}

export const ConversationContent = ({ children, className }: ConversationContentProps) => {
  return <StickToBottom.Content className={cn('flex flex-col gap-8 p-4', className)}>{children}</StickToBottom.Content>;
};

type ConversationEmptyStateProps = Children<
  ClassName<{
    description?: string;
    icon?: ReactNode;
    title?: string;
  }>
>;

export const ConversationEmptyState = ({
  children,
  className,
  description = 'Start a conversation to see messages here',
  icon,
  title = 'No messages yet',
}: ConversationEmptyStateProps) => {
  const hasCustomContent = Boolean(children);

  return (
    <div className={cn('flex size-full flex-col items-center justify-center gap-3 p-8 text-center', className)}>
      {hasCustomContent ? (
        children
      ) : (
        <Fragment>
          {/* Icon Section */}
          {icon && <div className={'text-muted-foreground'}>{icon}</div>}

          {/* Text Section */}
          <div className={'space-y-1'}>
            <h3 className={'text-sm font-medium'}>{title}</h3>
            {description && <p className={'text-sm text-muted-foreground'}>{description}</p>}
          </div>
        </Fragment>
      )}
    </div>
  );
};

type ConversationScrollButtonProps = ComponentPropsWithRef<typeof Button>;

export const ConversationScrollButton = ({ className, ref, ...props }: ConversationScrollButtonProps) => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  const handleScrollToBottom = useCallback(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  return (
    !isAtBottom && (
      <Button
        className={cn('absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full', className)}
        onClick={handleScrollToBottom}
        ref={ref}
        size={'icon'}
        type={'button'}
        variant={'outline'}
        {...props}
      >
        <ArrowDownIcon className={'size-4'} />
      </Button>
    )
  );
};

'use client';

import type { ComponentPropsWithRef } from 'react';

import { Check, Copy, Eye, Pencil, RotateCcw, Star, Trash2 } from 'lucide-react';
import { Fragment } from 'react';

import type { Agent } from '@/db/schema';

import { Badge, type badgeVariants } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tooltip } from '@/components/ui/tooltip';
import { getAgentColorClass } from '@/lib/colors/agent-colors';
import { cn } from '@/lib/utils';

type AgentType = Agent['type'];
type BadgeVariant = NonNullable<Parameters<typeof badgeVariants>[0]>['variant'];

const getTypeVariant = (type: AgentType): BadgeVariant => {
  const typeVariantMap: Record<string, BadgeVariant> = {
    planning: 'planning',
    review: 'review',
    specialist: 'specialist',
    utility: 'default',
  };

  return typeVariantMap[type ?? ''] ?? 'default';
};

const formatTypeLabel = (type: AgentType): string => {
  if (!type) return 'Unknown';
  return type.charAt(0).toUpperCase() + type.slice(1);
};

interface AgentCardProps extends Omit<ComponentPropsWithRef<'div'>, 'onClick' | 'onReset'> {
  agent: Agent;
  isCurrentDefault?: boolean;
  isDeleting?: boolean;
  isDuplicating?: boolean;
  isResetting?: boolean;
  isSettingDefault?: boolean;
  isToggling?: boolean;
  onDelete?: (agentId: number) => void;
  onDuplicate?: (agent: Agent) => void;
  onEdit?: (agentId: number) => void;
  onMakeDefault?: (agentId: number) => void;
  onReset?: (agentId: number) => void;
  onToggleActive?: (agentId: number, isActive: boolean) => void;
}

export const AgentCard = ({
  agent,
  className,
  isCurrentDefault = false,
  isDeleting = false,
  isDuplicating = false,
  isResetting = false,
  isSettingDefault = false,
  isToggling = false,
  onDelete,
  onDuplicate,
  onEdit,
  onMakeDefault,
  onReset,
  onToggleActive,
  ref,
  ...props
}: AgentCardProps) => {
  const isActive = agent.deactivatedAt === null;
  const isCustomAgent = agent.builtInAt === null;
  const isCustomized = agent.parentAgentId !== null;
  const isPlanningAgent = agent.type === 'planning';
  const isProjectScoped = agent.projectId !== null;

  const handleDeleteClick = () => {
    onDelete?.(agent.id);
  };

  const handleDuplicateClick = () => {
    onDuplicate?.(agent);
  };

  const handleEditClick = () => {
    onEdit?.(agent.id);
  };

  const handleMakeDefaultClick = () => {
    onMakeDefault?.(agent.id);
  };

  const handleResetClick = () => {
    onReset?.(agent.id);
  };

  const handleToggleChange = (checked: boolean) => {
    onToggleActive?.(agent.id, checked);
  };

  const isActionDisabled = isDeleting || isDuplicating || isResetting || isSettingDefault || isToggling;

  const titleId = `agent-title-${agent.id}`;

  return (
    <Card
      aria-label={`${agent.displayName} agent${!isActive ? ' (deactivated)' : ''}`}
      className={cn('flex flex-col transition-opacity', !isActive && 'opacity-60', className)}
      ref={ref}
      role={'article'}
      {...props}
    >
      {/* Header */}
      <CardHeader>
        <div className={'flex items-start justify-between gap-2 overflow-hidden'}>
          <div className={'flex min-w-0 flex-1 items-center gap-2'}>
            {/* Color Indicator */}
            <div aria-hidden={'true'} className={cn('size-3 shrink-0 rounded-full', getAgentColorClass(agent.color))} />
            <CardTitle className={'line-clamp-1'} id={titleId}>
              {agent.displayName}
            </CardTitle>
            {/* Default Clarification Agent Indicator */}
            {isCurrentDefault && (
              <Tooltip content={'Default clarification agent'} side={'top'}>
                <span
                  aria-label={'Default clarification agent'}
                  className={'inline-flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/60 dark:text-green-100'}
                >
                  <Check aria-hidden={'true'} className={'size-3'} />
                  {'Default'}
                </span>
              </Tooltip>
            )}
          </div>
          <Badge
            aria-label={`Type: ${formatTypeLabel(agent.type)}`}
            className={'shrink-0'}
            variant={getTypeVariant(agent.type)}
          >
            {formatTypeLabel(agent.type)}
          </Badge>
        </div>
        {agent.description && <CardDescription className={'line-clamp-2'}>{agent.description}</CardDescription>}
      </CardHeader>

      {/* Content */}
      <CardContent className={'flex flex-1 flex-col gap-3'}>
        {/* Status Indicator */}
        <div aria-label={'Agent status'} className={'flex items-center justify-between'} role={'group'}>
          <span
            aria-label={`Status: ${isActive ? 'Active' : 'Deactivated'}`}
            className={'text-sm text-muted-foreground'}
          >
            {isActive ? 'Active' : 'Deactivated'}
          </span>
          <Switch
            aria-label={isActive ? 'Deactivate agent' : 'Activate agent'}
            checked={isActive}
            disabled={isToggling}
            onCheckedChange={handleToggleChange}
            size={'sm'}
          />
        </div>

        {/* Agent Origin Indicator */}
        <div aria-label={'Agent origin'} className={'flex items-center gap-1'} role={'group'}>
          {isProjectScoped && (
            <Badge aria-label={'Origin: Project-scoped'} size={'sm'} variant={'project'}>
              {'Project'}
            </Badge>
          )}
          {!isCustomAgent && (
            <Badge aria-label={'Origin: Built-in'} size={'sm'} variant={'category-builtin'}>
              {'Built-in'}
            </Badge>
          )}
          {isCustomAgent && (
            <Badge aria-label={'Origin: Custom'} size={'sm'} variant={'custom'}>
              {'Custom'}
            </Badge>
          )}
          {isCustomized && (
            <Badge aria-label={'Origin: Customized'} size={'sm'} variant={'default'}>
              {'Customized'}
            </Badge>
          )}
        </div>
      </CardContent>

      {/* Actions */}
      <CardFooter aria-label={'Agent actions'} className={'gap-2'} role={'group'}>
        <Button
          aria-describedby={titleId}
          aria-label={isCustomAgent ? `Edit ${agent.displayName} agent` : `View ${agent.displayName} agent`}
          disabled={isActionDisabled}
          onClick={handleEditClick}
          size={'sm'}
          variant={'outline'}
        >
          {isCustomAgent ? (
            <Fragment>
              <Pencil aria-hidden={'true'} className={'size-4'} />
              {'Edit'}
            </Fragment>
          ) : (
            <Fragment>
              <Eye aria-hidden={'true'} className={'size-4'} />
              {'View'}
            </Fragment>
          )}
        </Button>
        <Button
          aria-describedby={titleId}
          aria-label={`Duplicate ${agent.displayName} agent`}
          disabled={isActionDisabled}
          onClick={handleDuplicateClick}
          size={'sm'}
          variant={'ghost'}
        >
          <Copy aria-hidden={'true'} className={'size-4'} />
          {'Duplicate'}
        </Button>
        {isPlanningAgent && !isCurrentDefault && (
          <Button
            aria-describedby={titleId}
            aria-label={`Make ${agent.displayName} default clarification agent`}
            disabled={isActionDisabled}
            onClick={handleMakeDefaultClick}
            size={'sm'}
            variant={'ghost'}
          >
            <Star aria-hidden={'true'} className={'size-4'} />
            {'Make Default'}
          </Button>
        )}
        {isCustomized && (
          <Button
            aria-describedby={titleId}
            aria-label={`Reset ${agent.displayName} agent to default`}
            disabled={isActionDisabled}
            onClick={handleResetClick}
            size={'sm'}
            variant={'ghost'}
          >
            <RotateCcw aria-hidden={'true'} className={'size-4'} />
            {'Reset'}
          </Button>
        )}
        {isCustomAgent && (
          <Button
            aria-describedby={titleId}
            aria-label={`Delete ${agent.displayName} agent`}
            disabled={isActionDisabled}
            onClick={handleDeleteClick}
            size={'sm'}
            variant={'ghost'}
          >
            <Trash2 aria-hidden={'true'} className={'size-4 text-destructive'} />
            {'Delete'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

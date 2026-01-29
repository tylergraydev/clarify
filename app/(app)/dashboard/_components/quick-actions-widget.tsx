'use client';

import { FolderPlus, Play, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

type QuickActionsWidgetProps = ClassName;

// ============================================================================
// Main Export
// ============================================================================

export const QuickActionsWidget = ({ className }: QuickActionsWidgetProps) => {
  const router = useRouter();

  const handleNewWorkflowClick = () => {
    router.push('/workflows/new');
  };

  const handleNewProjectClick = () => {
    router.push('/projects/new');
  };

  return (
    <Card className={className}>
      <CardHeader>
        {/* Header Title */}
        <div className={'flex items-center gap-2'}>
          <Zap aria-hidden={'true'} className={'size-5 text-muted-foreground'} />
          <CardTitle>Quick Actions</CardTitle>
        </div>
        <CardDescription>
          Start a new workflow or create a project
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Action Buttons */}
        <div
          className={cn(
            'flex flex-col gap-3',
            'sm:flex-row sm:gap-4'
          )}
        >
          {/* New Workflow Button */}
          <Button
            className={'w-full sm:flex-1'}
            onClick={handleNewWorkflowClick}
            variant={'default'}
          >
            <Play aria-hidden={'true'} className={'size-4'} />
            New Workflow
          </Button>

          {/* New Project Button */}
          <Button
            className={'w-full sm:flex-1'}
            onClick={handleNewProjectClick}
            variant={'outline'}
          >
            <FolderPlus aria-hidden={'true'} className={'size-4'} />
            New Project
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

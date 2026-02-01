'use client';

import { FolderPlus, Zap } from 'lucide-react';

import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type QuickActionsWidgetProps = ClassName;

export const QuickActionsWidget = ({ className }: QuickActionsWidgetProps) => {
  return (
    <Card className={className}>
      {/* Header */}
      <CardHeader>
        <div className={'flex items-center gap-2'}>
          <Zap aria-hidden={'true'} className={'size-5 text-muted-foreground'} />
          <CardTitle>Quick Actions</CardTitle>
        </div>
        <CardDescription>Create a new project to get started</CardDescription>
      </CardHeader>

      {/* Content */}
      <CardContent>
        {/* New Project Button */}
        <CreateProjectDialog
          trigger={
            <Button className={'w-full'} variant={'default'}>
              <FolderPlus aria-hidden={'true'} className={'size-4'} />
              New Project
            </Button>
          }
        />
      </CardContent>
    </Card>
  );
};

'use client';

import { MessageCircleIcon } from 'lucide-react';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useEffect, useMemo, useRef } from 'react';

import { ChatTabContent } from '@/components/chat/chat-tab-content';
import { QueryErrorBoundary } from '@/components/data/query-error-boundary';
import {
  SelectItem,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProjects } from '@/hooks/queries/use-projects';
import { useChatStore } from '@/lib/stores/chat-store';
import { optionsToItems } from '@/lib/utils';

export default function ChatPage() {
  const [projectId, setProjectId] = useQueryState('project', parseAsInteger);
  const { data: projects = [], isLoading } = useProjects();
  const reset = useChatStore((s) => s.reset);
  const previousProjectId = useRef(projectId);

  // Filter to active (non-archived) projects
  const activeProjects = useMemo(
    () => projects.filter((p) => !p.archivedAt),
    [projects]
  );

  // Build items map for SelectRoot
  const projectOptions = useMemo(
    () => activeProjects.map((p) => ({ label: p.name, value: String(p.id) })),
    [activeProjects]
  );
  const projectItems = useMemo(() => optionsToItems(projectOptions), [projectOptions]);

  // Auto-select first active project if none selected
  useEffect(() => {
    if (projectId === null && activeProjects.length > 0 && activeProjects[0]) {
      void setProjectId(activeProjects[0].id);
    }
  }, [projectId, activeProjects, setProjectId]);

  // Reset chat state when project changes
  useEffect(() => {
    if (previousProjectId.current !== null && projectId !== previousProjectId.current) {
      reset();
    }
    previousProjectId.current = projectId;
  }, [projectId, reset]);

  if (isLoading) {
    return (
      <div className={'space-y-6'}>
        <div className={'space-y-1'}>
          <h1 className={'text-2xl font-semibold tracking-tight'}>{'Chat'}</h1>
          <p className={'text-muted-foreground'}>{'Loading projects...'}</p>
        </div>
      </div>
    );
  }

  if (activeProjects.length === 0) {
    return (
      <div className={'space-y-6'}>
        <div className={'space-y-1'}>
          <h1 className={'text-2xl font-semibold tracking-tight'}>{'Chat'}</h1>
          <p className={'text-muted-foreground'}>{'Chat directly with Claude Code about your projects.'}</p>
        </div>
        <div className={'flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground'}>
          <MessageCircleIcon className={'size-10'} />
          <p className={'text-sm'}>{'Create a project first to start chatting.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={'space-y-4'}>
      {/* Page heading with project selector */}
      <div className={'flex items-center justify-between'}>
        <div className={'space-y-1'}>
          <h1 className={'text-2xl font-semibold tracking-tight'}>{'Chat'}</h1>
          <p className={'text-muted-foreground'}>{'Chat directly with Claude Code about your projects.'}</p>
        </div>
        <div className={'w-56'}>
          <SelectRoot
            items={projectItems}
            onValueChange={(val) => void setProjectId(Number(val))}
            value={projectId !== null ? String(projectId) : ''}
          >
            <SelectTrigger aria-label={'Select project'} size={'sm'}>
              <SelectValue placeholder={'Select project'} />
            </SelectTrigger>
            <SelectPortal>
              <SelectPositioner>
                <SelectPopup size={'sm'}>
                  <SelectList>
                    {projectOptions.map((option) => (
                      <SelectItem key={option.value} size={'sm'} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectList>
                </SelectPopup>
              </SelectPositioner>
            </SelectPortal>
          </SelectRoot>
        </div>
      </div>

      {/* Chat content */}
      {projectId !== null && (
        <QueryErrorBoundary>
          <div className={'h-[calc(100vh-10rem)]'}>
            <ChatTabContent projectId={projectId} />
          </div>
        </QueryErrorBoundary>
      )}
    </div>
  );
}

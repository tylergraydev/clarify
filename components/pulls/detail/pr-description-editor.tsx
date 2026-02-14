'use client';

import { Check, Pencil, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useUpdatePullRequest } from '@/hooks/queries/use-github';

interface PrDescriptionEditorProps {
  body: string;
  prNumber: number;
  repoPath: string;
}

export const PrDescriptionEditor = ({ body, prNumber, repoPath }: PrDescriptionEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(body);
  const updateMutation = useUpdatePullRequest();

  const handleSave = () => {
    if (editValue !== body) {
      updateMutation.mutate(
        { input: { body: editValue }, prNumber, repoPath },
        {
          onSuccess: () => setIsEditing(false),
        }
      );
    } else {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(body);
    setIsEditing(false);
  };

  return (
    <div className={'space-y-2'}>
      <div className={'flex items-center justify-between'}>
        <h3 className={'text-sm font-medium'}>{'Description'}</h3>
        {!isEditing && (
          <Button
            onClick={() => setIsEditing(true)}
            size={'sm'}
            variant={'ghost'}
          >
            <Pencil aria-hidden={'true'} className={'size-3.5'} />
            {'Edit'}
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className={'space-y-2'}>
          <textarea
            autoFocus
            className={`
              h-60 w-full resize-y rounded-md border border-border
              bg-background px-3 py-2 font-mono text-sm
              focus:ring-2 focus:ring-accent focus:outline-none
            `}
            onChange={(e) => setEditValue(e.target.value)}
            value={editValue}
          />
          <div className={'flex justify-end gap-2'}>
            <Button onClick={handleCancel} size={'sm'} variant={'outline'}>
              <X aria-hidden={'true'} className={'size-4'} />
              {'Cancel'}
            </Button>
            <Button
              disabled={updateMutation.isPending}
              onClick={handleSave}
              size={'sm'}
            >
              <Check aria-hidden={'true'} className={'size-4'} />
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      ) : (
        <div className={'rounded-md border border-border bg-muted/30 p-4'}>
          {body ? (
            <pre className={'text-sm whitespace-pre-wrap'}>{body}</pre>
          ) : (
            <p className={'text-sm text-muted-foreground'}>{'No description provided.'}</p>
          )}
        </div>
      )}
    </div>
  );
};

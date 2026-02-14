'use client';

import { Check, Pencil, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useUpdatePullRequest } from '@/hooks/queries/use-github';

interface PrTitleEditorProps {
  prNumber: number;
  repoPath: string;
  title: string;
}

export const PrTitleEditor = ({ prNumber, repoPath, title }: PrTitleEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const updateMutation = useUpdatePullRequest();

  const handleSave = () => {
    if (editValue.trim() && editValue !== title) {
      updateMutation.mutate(
        { input: { title: editValue.trim() }, prNumber, repoPath },
        {
          onSuccess: () => setIsEditing(false),
        }
      );
    } else {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(title);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={'flex items-center gap-2'}>
        <input
          autoFocus
          className={`
            flex-1 rounded-md border border-border bg-background px-3 py-1.5
            text-lg font-semibold focus:ring-2 focus:ring-accent focus:outline-none
          `}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
          value={editValue}
        />
        <Button
          disabled={updateMutation.isPending}
          onClick={handleSave}
          size={'sm'}
          variant={'outline'}
        >
          <Check aria-hidden={'true'} className={'size-4'} />
        </Button>
        <Button onClick={handleCancel} size={'sm'} variant={'outline'}>
          <X aria-hidden={'true'} className={'size-4'} />
        </Button>
      </div>
    );
  }

  return (
    <button
      className={'group flex items-center gap-2 text-left'}
      onClick={() => setIsEditing(true)}
      type={'button'}
    >
      <h2 className={'text-lg font-semibold'}>{title}</h2>
      <Pencil
        aria-hidden={'true'}
        className={'size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100'}
      />
    </button>
  );
};

'use client';

import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Reply } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { usePrComments, useReplyToPrComment } from '@/hooks/queries/use-github';

interface PrCommentsTabProps {
  prNumber: number;
  repoPath: string;
}

export const PrCommentsTab = ({ prNumber, repoPath }: PrCommentsTabProps) => {
  const { data: comments = [], isLoading } = usePrComments(repoPath, prNumber);
  const replyMutation = useReplyToPrComment();
  const [replyingTo, setReplyingTo] = useState<null | number>(null);
  const [replyBody, setReplyBody] = useState('');

  if (isLoading) {
    return (
      <div className={'flex items-center justify-center py-16 text-sm text-muted-foreground'}>
        {'Loading comments...'}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className={'flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground'}>
        <MessageSquare className={'size-10'} />
        <p className={'text-sm'}>{'No review comments on this pull request.'}</p>
      </div>
    );
  }

  // Group comments by file path
  const commentsByFile = new Map<string, typeof comments>();
  for (const comment of comments) {
    const existing = commentsByFile.get(comment.path) ?? [];
    existing.push(comment);
    commentsByFile.set(comment.path, existing);
  }

  const handleReply = (commentId: number) => {
    if (!replyBody.trim()) return;
    replyMutation.mutate(
      { body: replyBody, commentId, prNumber, repoPath },
      {
        onSuccess: () => {
          setReplyingTo(null);
          setReplyBody('');
        },
      }
    );
  };

  return (
    <div className={'divide-y divide-border'}>
      {Array.from(commentsByFile.entries()).map(([filePath, fileComments]) => (
        <div className={'space-y-3 p-4'} key={filePath}>
          <h3 className={'font-mono text-xs text-muted-foreground'}>{filePath}</h3>
          <div className={'space-y-3'}>
            {fileComments.map((comment) => (
              <div
                className={'rounded-md border border-border bg-muted/30 p-3'}
                key={comment.id}
              >
                <div className={'flex items-center justify-between'}>
                  <div className={'flex items-center gap-2 text-xs text-muted-foreground'}>
                    <span className={'font-medium text-foreground'}>{comment.author}</span>
                    {comment.line && (
                      <span>{'Line '}{comment.line}</span>
                    )}
                    <span>
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <Button
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    size={'sm'}
                    variant={'ghost'}
                  >
                    <Reply aria-hidden={'true'} className={'size-3.5'} />
                  </Button>
                </div>
                <p className={'mt-2 text-sm'}>{comment.body}</p>

                {/* Reply form */}
                {replyingTo === comment.id && (
                  <div className={'mt-3 space-y-2'}>
                    <textarea
                      autoFocus
                      className={`
                        h-20 w-full resize-y rounded-md border border-border
                        bg-background px-3 py-2 text-sm
                        focus:ring-2 focus:ring-accent focus:outline-none
                      `}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder={'Write a reply...'}
                      value={replyBody}
                    />
                    <div className={'flex justify-end gap-2'}>
                      <Button
                        onClick={() => { setReplyingTo(null); setReplyBody(''); }}
                        size={'sm'}
                        variant={'outline'}
                      >
                        {'Cancel'}
                      </Button>
                      <Button
                        disabled={replyMutation.isPending || !replyBody.trim()}
                        onClick={() => handleReply(comment.id)}
                        size={'sm'}
                      >
                        {replyMutation.isPending ? 'Replying...' : 'Reply'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

'use client';

import { Fragment, useCallback, useState } from 'react';

import type { DiffComment } from '@/types/diff';

import { CommentForm } from './comment-form';
import { CommentItem } from './comment-item';

interface InlineCommentThreadProps {
  comments: Array<DiffComment>;
  isSubmitting?: boolean;
  onCreateReply: (parentId: number, content: string) => void;
  onDelete: (id: number) => void;
  onToggleResolved: (id: number) => void;
}

export const InlineCommentThread = ({
  comments,
  isSubmitting = false,
  onCreateReply,
  onDelete,
  onToggleResolved,
}: InlineCommentThreadProps) => {
  const [replyingToId, setReplyingToId] = useState<null | number>(null);

  const handleReply = useCallback((id: number) => {
    setReplyingToId(id);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyingToId(null);
  }, []);

  const handleSubmitReply = useCallback(
    (content: string) => {
      if (replyingToId !== null) {
        onCreateReply(replyingToId, content);
        setReplyingToId(null);
      }
    },
    [onCreateReply, replyingToId]
  );

  // Separate top-level comments from replies
  const topLevelComments = comments.filter((c) => c.parentId === null);
  const repliesByParent = new Map<number, Array<DiffComment>>();
  for (const comment of comments) {
    if (comment.parentId !== null) {
      const replies = repliesByParent.get(comment.parentId) ?? [];
      replies.push(comment);
      repliesByParent.set(comment.parentId, replies);
    }
  }

  return (
    <tr>
      <td className={'bg-blue-50/20 p-2 dark:bg-blue-900/5'} colSpan={4}>
        <div className={'ml-12 flex flex-col gap-1.5'}>
          {topLevelComments.map((comment) => (
            <Fragment key={comment.id}>
              <CommentItem
                comment={comment}
                onDelete={onDelete}
                onReply={handleReply}
                onToggleResolved={onToggleResolved}
              />
              {/* Nested replies */}
              {repliesByParent.get(comment.id)?.map((reply) => (
                <div className={'ml-4'} key={reply.id}>
                  <CommentItem
                    comment={reply}
                    onDelete={onDelete}
                    onReply={handleReply}
                    onToggleResolved={onToggleResolved}
                  />
                </div>
              ))}
              {/* Reply form */}
              {replyingToId === comment.id && (
                <div className={'ml-4'}>
                  <CommentForm
                    isSubmitting={isSubmitting}
                    onCancel={handleCancelReply}
                    onSubmit={handleSubmitReply}
                    placeholder={'Write a reply...'}
                  />
                </div>
              )}
            </Fragment>
          ))}
        </div>
      </td>
    </tr>
  );
};

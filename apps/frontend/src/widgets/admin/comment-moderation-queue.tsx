'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateCommentStatusAction, deleteCommentAction } from '@/entities/comment/actions';
import { formatDate } from '@/shared/lib/format-date';
import type { components } from '@/lib/api/generated/schema';

type CommentAdminDto = components['schemas']['CommentAdminDto'];
type CommentAdminItem = Omit<CommentAdminDto, 'postId'> & { postId?: string; caseId?: string };
type Status = CommentAdminDto['status'];

export function CommentModerationQueue({
  initial,
  postsById,
  casesById,
}: {
  initial: CommentAdminItem[];
  postsById: Record<string, { title: string; slug: string }>;
  casesById: Record<string, { title: string; slug: string }>;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleStatusChange(id: string, status: Status) {
    setBusyId(id);
    try {
      setItems((prev) => prev.filter((i) => i.id !== id));
      await updateCommentStatusAction(id, status);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить комментарий без возможности восстановления?')) return;
    setBusyId(id);
    try {
      setItems((prev) => prev.filter((i) => i.id !== id));
      await deleteCommentAction(id);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Комментариев с этим статусом нет.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((comment) => {
        const post = comment.postId ? postsById[comment.postId] : null;
        const kase = comment.caseId ? casesById[comment.caseId] : null;
        const target = post
          ? { href: `/ru/posts/${post.slug}`, label: post.title, type: 'Статья' }
          : kase
            ? { href: `/ru/cases/${kase.slug}`, label: kase.title, type: 'Кейс' }
            : null;
        const isBusy = busyId === comment.id;
        return (
          <div
            key={comment.id}
            className={`flex flex-col gap-3 rounded-[10px] border border-border bg-card p-4 ${isBusy ? 'opacity-60' : ''}`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-sm font-semibold">
                  {comment.authorUrl ? (
                    <a
                      href={comment.authorUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="hover:text-primary"
                    >
                      {comment.authorName}
                    </a>
                  ) : (
                    comment.authorName
                  )}
                </span>
                {comment.authorEmail && (
                  <span className="text-xs text-[var(--brand-text-faint)]">{comment.authorEmail}</span>
                )}
                <span className="rounded-full border border-border px-2 py-0.5 text-xs uppercase text-muted-foreground">
                  {comment.locale}
                </span>
              </div>
              <span className="font-mono text-xs text-[var(--brand-text-faint)] tabular-nums">
                {formatDate(comment.createdAt, 'ru')}
              </span>
            </div>

            <p className="text-sm text-muted-foreground">{comment.body}</p>

            {target && (
              <a
                href={target.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit font-mono text-xs text-primary hover:underline"
              >
                → {target.type}: {target.label}
              </a>
            )}

            <div className="flex flex-wrap gap-2 border-t border-border pt-3">
              {comment.status !== 'APPROVED' && (
                <button
                  type="button"
                  disabled={!!busyId}
                  onClick={() => handleStatusChange(comment.id, 'APPROVED')}
                  className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {isBusy ? '...' : 'Одобрить'}
                </button>
              )}
              {comment.status !== 'REJECTED' && (
                <button
                  type="button"
                  disabled={!!busyId}
                  onClick={() => handleStatusChange(comment.id, 'REJECTED')}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-accent disabled:opacity-50"
                >
                  Отклонить
                </button>
              )}
              {comment.status !== 'SPAM' && (
                <button
                  type="button"
                  disabled={!!busyId}
                  onClick={() => handleStatusChange(comment.id, 'SPAM')}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-accent disabled:opacity-50"
                >
                  Спам
                </button>
              )}
              <button
                type="button"
                disabled={!!busyId}
                onClick={() => handleDelete(comment.id)}
                className="rounded-full border border-border px-3 py-1 text-xs text-destructive hover:opacity-80 disabled:opacity-50"
              >
                Удалить
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

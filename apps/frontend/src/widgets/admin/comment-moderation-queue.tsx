"use client";

import { useState } from "react";
import { updateCommentStatusAction, deleteCommentAction } from "@/entities/comment/actions";
import { formatDate } from "@/shared/lib/format-date";
import type { components } from "@/lib/api/generated/schema";

type CommentAdminDto = components["schemas"]["CommentAdminDto"];
type Status = CommentAdminDto["status"];

export function CommentModerationQueue({
  initial,
  postsById,
}: {
  initial: CommentAdminDto[];
  postsById: Record<string, { title: string; slug: string }>;
}) {
  const [items, setItems] = useState(initial);

  async function handleStatusChange(id: string, status: Status) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await updateCommentStatusAction(id, status);
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить комментарий без возможности восстановления?")) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    await deleteCommentAction(id);
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Комментариев с этим статусом нет.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((comment) => {
        const post = postsById[comment.postId];
        return (
          <div key={comment.id} className="flex flex-col gap-3 rounded-[10px] border border-border bg-card p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-sm font-semibold">
                  {comment.authorUrl ? (
                    <a href={comment.authorUrl} target="_blank" rel="noopener noreferrer nofollow" className="hover:text-primary">
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
                {formatDate(comment.createdAt, "ru")}
              </span>
            </div>

            <p className="text-sm text-muted-foreground">{comment.body}</p>

            {post && (
              <a
                href={`/ru/posts/${post.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit font-mono text-xs text-primary hover:underline"
              >
                → {post.title}
              </a>
            )}

            <div className="flex flex-wrap gap-2 border-t border-border pt-3">
              {comment.status !== "APPROVED" && (
                <button
                  type="button"
                  onClick={() => handleStatusChange(comment.id, "APPROVED")}
                  className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
                >
                  Одобрить
                </button>
              )}
              {comment.status !== "REJECTED" && (
                <button
                  type="button"
                  onClick={() => handleStatusChange(comment.id, "REJECTED")}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-accent"
                >
                  Отклонить
                </button>
              )}
              {comment.status !== "SPAM" && (
                <button
                  type="button"
                  onClick={() => handleStatusChange(comment.id, "SPAM")}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-accent"
                >
                  Спам
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDelete(comment.id)}
                className="rounded-full border border-border px-3 py-1 text-xs text-destructive hover:opacity-80"
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

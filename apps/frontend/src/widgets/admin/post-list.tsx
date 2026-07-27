"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deletePostAction } from "@/entities/post/actions";
import { formatDate } from "@/shared/lib/format-date";
import type { components } from "@/lib/api/generated/schema";

type PostAdminDto = components["schemas"]["PostAdminDto"];

const STATUS_LABELS: Record<PostAdminDto["status"], string> = {
  DRAFT: "Черновик",
  PUBLISHED: "Опубликовано",
  ARCHIVED: "В архиве",
};

export function PostList({ initial }: { initial: PostAdminDto[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Удалить пост без возможности восстановления?")) return;
    setBusyId(id);
    try {
      setItems((prev) => prev.filter((i) => i.id !== id));
      await deletePostAction(id);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {items.length === 0 && <p className="text-sm text-muted-foreground">Постов пока нет.</p>}
      {items.map((post) => (
        <div key={post.id} className={`flex flex-wrap items-center gap-3 rounded-[10px] border border-border bg-card p-3 ${busyId === post.id ? "opacity-60" : ""}`}>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <span className="text-sm font-semibold">{post.title}</span>
            <span className="rounded-full border border-border px-2 py-0.5 font-mono text-xs uppercase text-muted-foreground">
              {post.locale}
            </span>
            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
              {STATUS_LABELS[post.status]}
            </span>
            {post.publishedAt && (
              <span className="font-mono text-xs text-[var(--brand-text-faint)] tabular-nums">
                {formatDate(post.publishedAt, post.locale)}
              </span>
            )}
            <span className="font-mono text-xs text-[var(--brand-text-faint)]">{post.viewCount} просмотров</span>
          </div>
          <Link href={`/admin/posts/${post.id}`} className="text-xs text-muted-foreground hover:text-foreground">
            Изменить
          </Link>
          <button
            type="button"
            disabled={!!busyId}
            onClick={() => handleDelete(post.id)}
            className="text-xs text-destructive hover:opacity-80 disabled:opacity-50"
          >
            {busyId === post.id ? "..." : "Удалить"}
          </button>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MarkdownEditor } from "./markdown-editor";
import { StatusControl } from "./status-control";
import { FileUploadField } from "./file-upload-field";
import { createPostAction, updatePostAction } from "@/entities/post/actions";
import type { components } from "@/lib/api/generated/schema";

type PostAdminDto = components["schemas"]["PostAdminDto"];
type FileDto = components["schemas"]["FileDto"];
type Status = PostAdminDto["status"];
type Locale = PostAdminDto["locale"];

function fieldClass() {
  return "rounded-[10px] border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary";
}

export function PostEditor({ initial, initialCover }: { initial?: PostAdminDto; initialCover?: FileDto | null }) {
  const router = useRouter();
  const isEdit = !!initial;

  const [locale, setLocale] = useState<Locale>(initial?.locale ?? "ru");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(initial?.seoDescription ?? "");
  const [status, setStatus] = useState<Status>(initial?.status ?? "DRAFT");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !slug.trim() || !excerpt.trim() || !body.trim()) {
      setError("Заполните обязательные поля: заголовок, slug, анонс, текст.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await updatePostAction(initial.id, {
          status,
          title,
          slug,
          excerpt,
          body,
          seoTitle: seoTitle || undefined,
          seoDescription: seoDescription || undefined,
        });
        router.refresh();
      } else {
        const created = await createPostAction({
          locale,
          title,
          slug,
          excerpt,
          body,
          seoTitle: seoTitle || undefined,
          seoDescription: seoDescription || undefined,
        });
        router.push(`/admin/posts/${created.id}`);
        return;
      }
    } catch {
      setError("Не удалось сохранить пост.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex max-w-[840px] flex-col gap-6">
      {isEdit ? (
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="mb-2 block text-xs font-semibold text-muted-foreground">Статус</span>
            <StatusControl value={status} onChange={setStatus} />
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-border px-3 py-1.5 font-mono text-xs uppercase text-muted-foreground">
              {locale}
            </span>
            {slug && (
              <a
                href={`/api/preview?type=post&slug=${encodeURIComponent(slug)}&locale=${locale}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                Предпросмотр
              </a>
            )}
          </div>
        </div>
      ) : (
        <label className="flex w-fit flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Язык статьи</span>
          <select value={locale} onChange={(e) => setLocale(e.target.value as Locale)} className={fieldClass()}>
            <option value="ru">RU</option>
            <option value="en">EN</option>
          </select>
        </label>
      )}

      {isEdit && (
        <FileUploadField
          module="PUBLIC"
          externalId={initial.id}
          type="IMAGE"
          name="cover"
          isCover
          accept="image/*"
          label="Обложка"
          initial={initialCover}
        />
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground">Заголовок</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass()} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground">Slug</span>
        <input value={slug} onChange={(e) => setSlug(e.target.value)} className={`font-mono ${fieldClass()}`} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground">Анонс</span>
        <textarea
          rows={2}
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          className={`resize-none ${fieldClass()}`}
        />
      </label>
      <MarkdownEditor value={body} onChange={setBody} label="Текст (markdown)" />
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground">SEO title</span>
        <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className={fieldClass()} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground">SEO description</span>
        <textarea
          rows={2}
          value={seoDescription}
          onChange={(e) => setSeoDescription(e.target.value)}
          className={`resize-none ${fieldClass()}`}
        />
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-fit rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Сохранение…" : isEdit ? "Сохранить" : "Создать"}
      </button>
    </form>
  );
}

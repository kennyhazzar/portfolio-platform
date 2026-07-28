'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TranslationTabs } from '@/shared/ui/translation-tabs';
import { MarkdownEditor } from './markdown-editor';
import { StatusControl } from './status-control';
import { createCaseAction, updateCaseAction } from '@/entities/case/actions';
import { MediaGalleryField } from './media-gallery-field';
import type { components } from '@/lib/api/generated/schema';

type CaseAdminDto = components['schemas']['CaseAdminDto'];
type CaseTranslationBody = components['schemas']['CaseTranslationBody'];
type TechnologyDto = components['schemas']['TechnologyDto'];
type FileDto = components['schemas']['FileDto'];
type Status = CaseAdminDto['status'];

const emptyTranslation: CaseTranslationBody = {
  title: '',
  slug: '',
  summary: '',
  body: '',
  seoTitle: '',
  seoDescription: '',
};

function fieldClass() {
  return 'rounded-[10px] border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary';
}

function LocaleFields({
  value,
  onChange,
}: {
  value: CaseTranslationBody;
  onChange: (next: CaseTranslationBody) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground">Заголовок</span>
        <input
          required
          maxLength={255}
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          className={fieldClass()}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground">Slug</span>
        <input
          required
          maxLength={255}
          value={value.slug}
          onChange={(e) => onChange({ ...value, slug: e.target.value })}
          className={`font-mono ${fieldClass()}`}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground">Краткое описание</span>
        <textarea
          required
          rows={2}
          value={value.summary}
          onChange={(e) => onChange({ ...value, summary: e.target.value })}
          className={`resize-none ${fieldClass()}`}
        />
      </label>
      <MarkdownEditor value={value.body} onChange={(body) => onChange({ ...value, body })} label="Текст (markdown)" />
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground">SEO title</span>
        <input
          maxLength={255}
          value={value.seoTitle ?? ''}
          onChange={(e) => onChange({ ...value, seoTitle: e.target.value })}
          className={fieldClass()}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground">SEO description</span>
        <textarea
          maxLength={500}
          rows={2}
          value={value.seoDescription ?? ''}
          onChange={(e) => onChange({ ...value, seoDescription: e.target.value })}
          className={`resize-none ${fieldClass()}`}
        />
      </label>
    </div>
  );
}

export function CaseEditor({
  initial,
  technologies,
  initialGallery,
}: {
  initial?: CaseAdminDto;
  technologies: TechnologyDto[];
  initialGallery?: FileDto[];
}) {
  const router = useRouter();
  const isEdit = !!initial;

  const findTranslation = (locale: 'ru' | 'en') =>
    initial?.translations.find((t) => t.locale === locale) ?? emptyTranslation;

  const [ru, setRu] = useState<CaseTranslationBody>(findTranslation('ru'));
  const [en, setEn] = useState<CaseTranslationBody>(findTranslation('en'));
  const [status, setStatus] = useState<Status>(initial?.status ?? 'DRAFT');
  const [repoUrl, setRepoUrl] = useState(initial?.repoUrl ?? '');
  const [liveUrl, setLiveUrl] = useState(initial?.liveUrl ?? '');
  const [technologyIds, setTechnologyIds] = useState<string[]>(initial?.technologyIds ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleTechnology(id: string) {
    setTechnologyIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  function findMissingLocaleFields(): 'ru' | 'en' | null {
    if (!ru.title.trim() || !ru.slug.trim() || !ru.summary.trim() || !ru.body.trim()) return 'ru';
    if (!en.title.trim() || !en.slug.trim() || !en.summary.trim() || !en.body.trim()) return 'en';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const missingLocale = findMissingLocaleFields();
    if (missingLocale) {
      setError(
        `Заполните обязательные поля (заголовок, slug, описание, текст) на вкладке ${missingLocale.toUpperCase()}.`,
      );
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await updateCaseAction(initial.id, {
          status,
          repoUrl: repoUrl || undefined,
          liveUrl: liveUrl || undefined,
          technologyIds,
          ru,
          en,
        });
        router.refresh();
      } else {
        const created = await createCaseAction({
          repoUrl: repoUrl || undefined,
          liveUrl: liveUrl || undefined,
          technologyIds,
          ru,
          en,
        });
        router.push(`/admin/cases/${created.id}`);
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить кейс.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex max-w-[840px] flex-col gap-6">
      {isEdit && (
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="mb-2 block text-xs font-semibold text-muted-foreground">Статус</span>
            <StatusControl value={status} onChange={setStatus} />
          </div>
          <div className="flex gap-3">
            {ru.slug && (
              <a
                href={`/api/preview?type=case&slug=${encodeURIComponent(ru.slug)}&locale=ru`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                Предпросмотр RU
              </a>
            )}
            {en.slug && (
              <a
                href={`/api/preview?type=case&slug=${encodeURIComponent(en.slug)}&locale=en`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                Предпросмотр EN
              </a>
            )}
          </div>
        </div>
      )}

      {isEdit && <MediaGalleryField module="PUBLIC" externalId={initial.id} initial={initialGallery ?? []} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Ссылка на репозиторий</span>
          <input
            maxLength={500}
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className={fieldClass()}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Ссылка на продакшн</span>
          <input
            maxLength={500}
            value={liveUrl}
            onChange={(e) => setLiveUrl(e.target.value)}
            className={fieldClass()}
          />
        </label>
      </div>

      <div>
        <span className="mb-2 block text-xs font-semibold text-muted-foreground">Технологии</span>
        {technologies.length === 0 ? (
          <p className="text-sm text-muted-foreground">Список технологий пуст — добавьте их в разделе «Технологии».</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {technologies.map((tech) => (
              <label
                key={tech.id}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  technologyIds.includes(tech.id)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <input
                  type="checkbox"
                  checked={technologyIds.includes(tech.id)}
                  onChange={() => toggleTechnology(tech.id)}
                  className="sr-only"
                />
                {tech.name}
              </label>
            ))}
          </div>
        )}
      </div>

      <TranslationTabs
        ru={<LocaleFields value={ru} onChange={setRu} />}
        en={<LocaleFields value={en} onChange={setEn} />}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-fit rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {saving ? 'Сохранение…' : isEdit ? 'Сохранить' : 'Создать'}
      </button>
    </form>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import { importPostsAction, type ImportResult } from '@/entities/post/actions';
import type { components } from '@/lib/api/generated/schema';

type Locale = components['schemas']['PostAdminDto']['locale'];
type Status = components['schemas']['PostAdminDto']['status'];

type PostImportItem = {
  locale: Locale;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  seoTitle?: string;
  seoDescription?: string;
  status?: Status;
};

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseFrontmatter(markdown: string): { meta: Record<string, string>; body: string } {
  if (!markdown.startsWith('---')) return { meta: {}, body: markdown.trim() };

  const end = markdown.indexOf('\n---', 3);
  if (end === -1) return { meta: {}, body: markdown.trim() };

  const frontmatter = markdown.slice(3, end).trim();
  const body = markdown.slice(end + 4).trim();
  const meta: Record<string, string> = {};

  for (const line of frontmatter.split(/\r?\n/)) {
    const separator = line.indexOf(':');
    if (separator === -1) continue;
    meta[line.slice(0, separator).trim()] = stripQuotes(line.slice(separator + 1));
  }

  return { meta, body };
}

function inferLocale(fileName: string, value?: string): Locale | null {
  if (value === 'ru' || value === 'en') return value;
  if (fileName.includes('.ru.')) return 'ru';
  if (fileName.includes('.en.')) return 'en';
  return null;
}

function firstParagraph(body: string): string {
  return (
    body
      .split(/\n\s*\n/)
      .map((part) => part.replace(/^#+\s*/, '').trim())
      .find(Boolean)
      ?.slice(0, 300) ?? ''
  );
}

async function parsePostFiles(files: File[]) {
  const items: PostImportItem[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const file of files) {
    if (!file.name.endsWith('.md')) {
      errors.push(`${file.name}: only Markdown files are supported`);
      continue;
    }

    const { meta, body } = parseFrontmatter(await file.text());
    const locale = inferLocale(file.name, meta.locale);
    const status = meta.status === 'PUBLISHED' || meta.status === 'DRAFT' ? meta.status : 'DRAFT';
    const title = meta.title;
    const slug = meta.slug;
    const excerpt = meta.excerpt || firstParagraph(body);

    if (!locale) errors.push(`${file.name}: locale is required in frontmatter or .ru/.en file name`);
    if (!title) errors.push(`${file.name}: title is required`);
    if (!slug) errors.push(`${file.name}: slug is required`);
    if (!excerpt) errors.push(`${file.name}: excerpt is required`);
    if (!body) errors.push(`${file.name}: body is empty`);
    if (!locale || !title || !slug || !excerpt || !body) continue;

    const key = `${locale}:${slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      locale,
      title,
      slug,
      excerpt,
      body,
      status,
      seoTitle: meta.seoTitle || undefined,
      seoDescription: meta.seoDescription || undefined,
    });
  }

  return { items, errors };
}

export function PostImporter() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  async function handleImport() {
    setSaving(true);
    setResult(null);
    setErrors([]);

    try {
      const parsed = await parsePostFiles(files);
      if (parsed.errors.length) {
        setErrors(parsed.errors);
        return;
      }
      if (!parsed.items.length) {
        setErrors(['No posts found']);
        return;
      }
      setResult(await importPostsAction({ items: parsed.items }));
      router.refresh();
    } catch {
      setErrors(['Import failed']);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mb-8 rounded-[10px] border border-border bg-card p-4">
      <div className="mb-3">
        <h2 className="text-sm font-semibold">Markdown import</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Frontmatter: title, slug, locale, excerpt, seoTitle, seoDescription, status.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="file"
          accept=".md"
          multiple
          onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
          className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-semibold"
        />
        <button
          type="button"
          disabled={!files.length || saving}
          onClick={handleImport}
          className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Upload size={14} />
          {saving ? 'Importing...' : 'Import'}
        </button>
      </div>
      {result && (
        <p className="mt-3 text-xs text-muted-foreground">
          Total: {result.total}, created: {result.created}, updated: {result.updated}, skipped: {result.skipped}
        </p>
      )}
      {errors.length > 0 && (
        <div className="mt-3 space-y-1 text-xs text-destructive">
          {errors.slice(0, 8).map((error) => (
            <p key={error}>{error}</p>
          ))}
          {errors.length > 8 && <p>And {errors.length - 8} more errors.</p>}
        </div>
      )}
    </section>
  );
}

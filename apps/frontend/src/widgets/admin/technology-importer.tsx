'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import { importTechnologiesAction, type ImportResult } from '@/entities/technology/actions';
import type { components } from '@/lib/api/generated/schema';

type TechnologyCategory = components['schemas']['TechnologyDto']['category'];

type TechnologyImportItem = {
  name: string;
  category?: TechnologyCategory;
  iconSlug?: string;
  position?: number;
};

const categories = new Set<TechnologyCategory>([
  'LANGUAGE',
  'FRAMEWORK',
  'LIBRARY' as TechnologyCategory,
  'DATABASE',
  'STORAGE' as TechnologyCategory,
  'INFRA',
  'PROTOCOL' as TechnologyCategory,
  'ARCHITECTURE' as TechnologyCategory,
  'AUTH' as TechnologyCategory,
  'TESTING' as TechnologyCategory,
  'TOOL',
  'OTHER',
]);

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === ',' && !quoted) {
      row.push(cell.trim());
      cell = '';
      continue;
    }
    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = '';
      continue;
    }
    cell += char;
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function readString(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function rowsToItems(rows: Record<string, unknown>[]) {
  const errors: string[] = [];
  const items: TechnologyImportItem[] = [];
  const seen = new Set<string>();

  rows.forEach((row, index) => {
    const name = readString(row, 'name');
    const categoryValue = readString(row, 'category').toUpperCase();
    const category = (categoryValue || 'OTHER') as TechnologyCategory;
    const iconSlug = readString(row, 'iconSlug') || readString(row, 'icon') || undefined;
    const positionValue = readString(row, 'position');
    const position = positionValue ? Number(positionValue) : index * 10;
    const key = name.toLocaleLowerCase();

    if (!name) {
      errors.push(`Row ${index + 2}: name is required`);
      return;
    }
    if (!categories.has(category)) {
      errors.push(`Row ${index + 2}: unsupported category "${categoryValue}"`);
      return;
    }
    if (!Number.isInteger(position) || position < 0) {
      errors.push(`Row ${index + 2}: position must be a non-negative integer`);
      return;
    }
    if (seen.has(key)) return;

    seen.add(key);
    items.push({ name, category, iconSlug, position });
  });

  return { items, errors };
}

async function parseTechnologyFile(file: File) {
  const extension = file.name.split('.').pop()?.toLocaleLowerCase();

  if (extension === 'csv') {
    const [headerRow, ...dataRows] = parseCsv(await file.text());
    const headers = headerRow.map((header) => header.trim());
    const rows = dataRows.map((cells) =>
      Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ''])),
    );
    return rowsToItems(rows);
  }

  if (extension === 'xlsx') {
    const xlsx = await import('xlsx');
    const workbook = xlsx.read(await file.arrayBuffer(), { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    return rowsToItems(rows);
  }

  return { items: [], errors: ['Use CSV or XLSX file'] };
}

export function TechnologyImporter() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  async function handleImport() {
    if (!file) return;
    setSaving(true);
    setResult(null);
    setErrors([]);

    try {
      const parsed = await parseTechnologyFile(file);
      if (parsed.errors.length) {
        setErrors(parsed.errors);
        return;
      }
      if (!parsed.items.length) {
        setErrors(['No technologies found']);
        return;
      }
      setResult(await importTechnologiesAction({ items: parsed.items }));
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
        <h2 className="text-sm font-semibold">Bulk import</h2>
        <p className="mt-1 text-xs text-muted-foreground">CSV/XLSX columns: name, category, iconSlug, position.</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-semibold"
        />
        <button
          type="button"
          disabled={!file || saving}
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

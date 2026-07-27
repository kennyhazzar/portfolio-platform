'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SortableList, type DragHandleProps } from '@/shared/ui/sortable-list';
import {
  createTechnologyAction,
  deleteTechnologyAction,
  reorderTechnologiesAction,
  updateTechnologyAction,
} from '@/entities/technology/actions';
import type { components } from '@/lib/api/generated/schema';

type TechnologyDto = components['schemas']['TechnologyDto'];
type Category = TechnologyDto['category'];

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'LANGUAGE', label: 'Язык' },
  { value: 'FRAMEWORK', label: 'Фреймворк' },
  { value: 'DATABASE', label: 'Данные' },
  { value: 'INFRA', label: 'Инфра' },
  { value: 'TOOL', label: 'Инструменты' },
  { value: 'OTHER', label: 'Другое' },
];

const EXPANDED_CATEGORIES = [
  ...CATEGORIES,
  { value: 'LIBRARY' as Category, label: 'Library' },
  { value: 'STORAGE' as Category, label: 'Storage' },
  { value: 'PROTOCOL' as Category, label: 'Protocol' },
  { value: 'ARCHITECTURE' as Category, label: 'Architecture' },
  { value: 'AUTH' as Category, label: 'Auth' },
  { value: 'TESTING' as Category, label: 'Testing' },
];

function fieldClass() {
  return 'rounded-[8px] border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary';
}

function DragHandle({ dragHandle }: { dragHandle: DragHandleProps }) {
  return (
    <button
      type="button"
      {...dragHandle.attributes}
      {...dragHandle.listeners}
      className="cursor-grab touch-none px-1 text-muted-foreground active:cursor-grabbing"
      aria-label="Перетащить для сортировки"
    >
      ⠿
    </button>
  );
}

function EditRow({
  item,
  onCancel,
  onSave,
  saving = false,
}: {
  item: TechnologyDto;
  onCancel: () => void;
  onSave: (body: components['schemas']['UpdateTechnologyBody']) => void;
  saving?: boolean;
}) {
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState<Category>(item.category);
  const [iconSlug, setIconSlug] = useState(item.iconSlug ?? '');

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
      <input value={name} onChange={(e) => setName(e.target.value)} className={`w-full sm:w-[160px] ${fieldClass()}`} />
      <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className={fieldClass()}>
        {EXPANDED_CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
      <input
        value={iconSlug}
        onChange={(e) => setIconSlug(e.target.value)}
        placeholder="иконка (slug или URL)"
        className={`w-full sm:w-[140px] ${fieldClass()}`}
      />
      <button
        type="button"
        disabled={saving}
        onClick={() => onSave({ name, category, iconSlug: iconSlug || undefined })}
        className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground disabled:opacity-50"
      >
        {saving ? '...' : 'Сохранить'}
      </button>
      <button type="button" onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground">
        Отмена
      </button>
    </div>
  );
}

export function TechnologyList({ initial }: { initial: TechnologyDto[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<Category>('OTHER');
  const [newIconSlug, setNewIconSlug] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  async function handleReorder(newItems: TechnologyDto[]) {
    setBusy('reorder');
    setItems(newItems);
    try {
      await reorderTechnologiesAction(newItems.map((item, index) => ({ id: item.id, position: index })));
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function handleSave(id: string, body: components['schemas']['UpdateTechnologyBody']) {
    setBusy(id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...body } : i)));
    setEditingId(null);
    try {
      await updateTechnologyAction(id, body);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(id: string) {
    setBusy(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await deleteTechnologyAction(id);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy('create');
    try {
      await createTechnologyAction({ name: newName, category: newCategory, iconSlug: newIconSlug || undefined });
      setNewName('');
      setNewIconSlug('');
      setNewCategory('OTHER');
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <SortableList
        items={items}
        onReorder={handleReorder}
        renderItem={(item, dragHandle) => (
          <div className="flex flex-wrap items-center gap-3 rounded-[10px] border border-border bg-card p-3">
            <DragHandle dragHandle={dragHandle} />
            {editingId === item.id ? (
              <EditRow
                item={item}
                saving={busy === item.id}
                onCancel={() => setEditingId(null)}
                onSave={(body) => handleSave(item.id, body)}
              />
            ) : (
              <>
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                  <span className="text-sm font-semibold">{item.name}</span>
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                    {EXPANDED_CATEGORIES.find((c) => c.value === item.category)?.label ?? item.category}
                  </span>
                  {item.iconSlug && (
                    <span className="font-mono text-xs text-[var(--brand-text-faint)]">{item.iconSlug}</span>
                  )}
                </div>
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => setEditingId(item.id)}
                  className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  Изменить
                </button>
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => handleDelete(item.id)}
                  className="text-xs text-destructive hover:opacity-80 disabled:opacity-50"
                >
                  {busy === item.id ? '...' : 'Удалить'}
                </button>
              </>
            )}
          </div>
        )}
      />

      <form onSubmit={handleCreate} className="flex flex-wrap items-center gap-2 border-t border-border pt-5">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Название"
          className={`w-full sm:w-[160px] ${fieldClass()}`}
        />
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value as Category)}
          className={fieldClass()}
        >
          {EXPANDED_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          value={newIconSlug}
          onChange={(e) => setNewIconSlug(e.target.value)}
          placeholder="иконка (slug или URL)"
          className={`w-full sm:w-[180px] ${fieldClass()}`}
        />
        <button
          type="submit"
          disabled={!!busy}
          className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
        >
          {busy === 'create' ? '...' : 'Добавить'}
        </button>
      </form>
    </div>
  );
}

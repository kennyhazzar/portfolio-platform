"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SortableList, type DragHandleProps } from "@/shared/ui/sortable-list";
import {
  createTechnologyAction,
  deleteTechnologyAction,
  reorderTechnologiesAction,
  updateTechnologyAction,
} from "@/entities/technology/actions";
import type { components } from "@/lib/api/generated/schema";

type TechnologyDto = components["schemas"]["TechnologyDto"];
type Category = TechnologyDto["category"];

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "LANGUAGE", label: "Язык" },
  { value: "FRAMEWORK", label: "Фреймворк" },
  { value: "DATABASE", label: "Данные" },
  { value: "INFRA", label: "Инфра" },
  { value: "TOOL", label: "Инструменты" },
  { value: "OTHER", label: "Другое" },
];

function fieldClass() {
  return "rounded-[8px] border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary";
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
}: {
  item: TechnologyDto;
  onCancel: () => void;
  onSave: (body: components["schemas"]["UpdateTechnologyBody"]) => void;
}) {
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState<Category>(item.category);
  const [iconSlug, setIconSlug] = useState(item.iconSlug ?? "");

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
      <input value={name} onChange={(e) => setName(e.target.value)} className={`w-full sm:w-[160px] ${fieldClass()}`} />
      <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className={fieldClass()}>
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
      <input
        value={iconSlug}
        onChange={(e) => setIconSlug(e.target.value)}
        placeholder="иконка (slug)"
        className={`w-full sm:w-[140px] ${fieldClass()}`}
      />
      <button
        type="button"
        onClick={() => onSave({ name, category, iconSlug: iconSlug || undefined })}
        className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
      >
        Сохранить
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
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<Category>("OTHER");
  const [newIconSlug, setNewIconSlug] = useState("");

  async function handleReorder(newItems: TechnologyDto[]) {
    setItems(newItems);
    await reorderTechnologiesAction(newItems.map((item, index) => ({ id: item.id, position: index })));
  }

  async function handleSave(id: string, body: components["schemas"]["UpdateTechnologyBody"]) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...body } : i)));
    setEditingId(null);
    await updateTechnologyAction(id, body);
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await deleteTechnologyAction(id);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    await createTechnologyAction({ name: newName, category: newCategory, iconSlug: newIconSlug || undefined });
    setNewName("");
    setNewIconSlug("");
    setNewCategory("OTHER");
    router.refresh();
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
              <EditRow item={item} onCancel={() => setEditingId(null)} onSave={(body) => handleSave(item.id, body)} />
            ) : (
              <>
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                  <span className="text-sm font-semibold">{item.name}</span>
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                    {CATEGORIES.find((c) => c.value === item.category)?.label ?? item.category}
                  </span>
                  {item.iconSlug && (
                    <span className="font-mono text-xs text-[var(--brand-text-faint)]">{item.iconSlug}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setEditingId(item.id)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Изменить
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="text-xs text-destructive hover:opacity-80"
                >
                  Удалить
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
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          value={newIconSlug}
          onChange={(e) => setNewIconSlug(e.target.value)}
          placeholder="иконка (slug, опционально)"
          className={`w-full sm:w-[180px] ${fieldClass()}`}
        />
        <button type="submit" className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground">
          Добавить
        </button>
      </form>
    </div>
  );
}

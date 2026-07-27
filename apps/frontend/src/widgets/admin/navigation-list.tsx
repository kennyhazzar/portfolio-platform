"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SortableList, type DragHandleProps } from "@/shared/ui/sortable-list";
import { TranslationTabs } from "@/shared/ui/translation-tabs";
import {
  createNavigationItemAction,
  deleteNavigationItemAction,
  reorderNavigationItemsAction,
  updateNavigationItemAction,
} from "@/entities/navigation/actions";
import type { components } from "@/lib/api/generated/schema";

type NavigationItemAdminDto = components["schemas"]["NavigationItemAdminDto"];
type NavigationItemTranslationBody = components["schemas"]["NavigationItemTranslationBody"];

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

function labelOf(item: NavigationItemAdminDto, locale: "ru" | "en") {
  return item.translations.find((t) => t.locale === locale)?.label ?? "";
}

function ParentSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: NavigationItemAdminDto[];
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass()}>
      <option value="">Без родителя</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {labelOf(o, "ru")}
        </option>
      ))}
    </select>
  );
}

function EditRow({
  item,
  siblings,
  onCancel,
  onSave,
  saving = false,
}: {
  item: NavigationItemAdminDto;
  siblings: NavigationItemAdminDto[];
  onCancel: () => void;
  onSave: (body: components["schemas"]["UpdateNavigationItemBody"]) => void;
  saving?: boolean;
}) {
  const [url, setUrl] = useState(item.url);
  const [parentId, setParentId] = useState(item.parentId ?? "");
  const [isVisible, setIsVisible] = useState(item.isVisible);
  const [ru, setRu] = useState<NavigationItemTranslationBody>({ label: labelOf(item, "ru") });
  const [en, setEn] = useState<NavigationItemTranslationBody>({ label: labelOf(item, "en") });

  return (
    <div className="flex flex-1 flex-col gap-3">
      <TranslationTabs
        ru={
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Название (RU)</span>
            <input value={ru.label} onChange={(e) => setRu({ label: e.target.value })} className={fieldClass()} />
          </label>
        }
        en={
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Название (EN)</span>
            <input value={en.label} onChange={(e) => setEn({ label: e.target.value })} className={fieldClass()} />
          </label>
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL" className={`w-full sm:w-[200px] ${fieldClass()}`} />
        <ParentSelect value={parentId} onChange={setParentId} options={siblings.filter((s) => s.id !== item.id)} />
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <input type="checkbox" checked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} />
          Виден
        </label>
        <button
          type="button"
          disabled={saving}
          onClick={() => onSave({ url, parentId: parentId || undefined, isVisible, ru, en })}
          className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground disabled:opacity-50"
        >
          {saving ? "..." : "Сохранить"}
        </button>
        <button type="button" onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground">
          Отмена
        </button>
      </div>
    </div>
  );
}

export function NavigationList({ initial }: { initial: NavigationItemAdminDto[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newLabelRu, setNewLabelRu] = useState("");
  const [newLabelEn, setNewLabelEn] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function handleReorder(newItems: NavigationItemAdminDto[]) {
    setBusy("reorder");
    setItems(newItems);
    try {
      await reorderNavigationItemsAction(newItems.map((item, index) => ({ id: item.id, position: index })));
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function handleSave(id: string, body: components["schemas"]["UpdateNavigationItemBody"]) {
    setBusy(id);
    setEditingId(null);
    try {
      await updateNavigationItemAction(id, body);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(id: string) {
    setBusy(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await deleteNavigationItemAction(id);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabelRu.trim() || !newUrl.trim()) return;
    setBusy("create");
    try {
      await createNavigationItemAction({
        url: newUrl,
        isVisible: true,
        ru: { label: newLabelRu },
        en: { label: newLabelEn || newLabelRu },
      });
      setNewLabelRu("");
      setNewLabelEn("");
      setNewUrl("");
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
          <div className="flex flex-wrap items-start gap-3 rounded-[10px] border border-border bg-card p-3">
            <DragHandle dragHandle={dragHandle} />
            {editingId === item.id ? (
              <EditRow
                item={item}
                siblings={items}
                saving={busy === item.id}
                onCancel={() => setEditingId(null)}
                onSave={(body) => handleSave(item.id, body)}
              />
            ) : (
              <>
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                  <span className="text-sm font-semibold">{labelOf(item, "ru")}</span>
                  <span className="font-mono text-xs text-[var(--brand-text-faint)]">{item.url}</span>
                  {item.parentId && (
                    <span className="text-xs text-muted-foreground">
                      ↳ {labelOf(items.find((i) => i.id === item.parentId) ?? item, "ru")}
                    </span>
                  )}
                  {!item.isVisible && <span className="text-xs text-[var(--brand-text-faint)]">(скрыт)</span>}
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
                  {busy === item.id ? "..." : "Удалить"}
                </button>
              </>
            )}
          </div>
        )}
      />

      <form onSubmit={handleCreate} className="flex flex-wrap items-center gap-2 border-t border-border pt-5">
        <input
          value={newLabelRu}
          onChange={(e) => setNewLabelRu(e.target.value)}
          placeholder="Название (RU)"
          className={`w-full sm:w-[160px] ${fieldClass()}`}
        />
        <input
          value={newLabelEn}
          onChange={(e) => setNewLabelEn(e.target.value)}
          placeholder="Название (EN)"
          className={`w-full sm:w-[160px] ${fieldClass()}`}
        />
        <input
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="URL"
          className={`w-full sm:w-[160px] ${fieldClass()}`}
        />
        <button
          type="submit"
          disabled={!!busy}
          className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
        >
          {busy === "create" ? "..." : "Добавить"}
        </button>
      </form>
    </div>
  );
}

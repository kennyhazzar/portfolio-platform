"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SortableList, type DragHandleProps } from "@/shared/ui/sortable-list";
import {
  createContactAction,
  deleteContactAction,
  reorderContactsAction,
  updateContactAction,
} from "@/entities/contact/actions";
import type { components } from "@/lib/api/generated/schema";

type ContactAdminDto = components["schemas"]["ContactAdminDto"];
type Platform = ContactAdminDto["platform"];

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "GITHUB", label: "GitHub" },
  { value: "TELEGRAM", label: "Telegram" },
  { value: "HABR_CAREER", label: "Habr Career" },
  { value: "EMAIL", label: "Email" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "OTHER", label: "Ссылка" },
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
  item: ContactAdminDto;
  onCancel: () => void;
  onSave: (body: components["schemas"]["UpdateContactBody"]) => void;
}) {
  const [platform, setPlatform] = useState<Platform>(item.platform);
  const [value, setValue] = useState(item.value);
  const [isVisible, setIsVisible] = useState(item.isVisible);

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
      <select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} className={fieldClass()}>
        {PLATFORMS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
      <input value={value} onChange={(e) => setValue(e.target.value)} className={`w-full sm:w-[220px] ${fieldClass()}`} />
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <input type="checkbox" checked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} />
        Виден
      </label>
      <button
        type="button"
        onClick={() => onSave({ platform, value, isVisible })}
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

export function ContactList({ initial }: { initial: ContactAdminDto[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newPlatform, setNewPlatform] = useState<Platform>("OTHER");
  const [newValue, setNewValue] = useState("");

  async function handleReorder(newItems: ContactAdminDto[]) {
    setItems(newItems);
    await reorderContactsAction(newItems.map((item, index) => ({ id: item.id, position: index })));
  }

  async function handleSave(id: string, body: components["schemas"]["UpdateContactBody"]) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...body } : i)));
    setEditingId(null);
    await updateContactAction(id, body);
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await deleteContactAction(id);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newValue.trim()) return;
    await createContactAction({ platform: newPlatform, value: newValue, isVisible: true });
    setNewValue("");
    setNewPlatform("OTHER");
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
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                    {PLATFORMS.find((p) => p.value === item.platform)?.label ?? item.platform}
                  </span>
                  <span className="text-sm">{item.value}</span>
                  {!item.isVisible && (
                    <span className="text-xs text-[var(--brand-text-faint)]">(скрыт)</span>
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
        <select
          value={newPlatform}
          onChange={(e) => setNewPlatform(e.target.value as Platform)}
          className={fieldClass()}
        >
          {PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="URL / handle / email"
          className={`w-full sm:w-[260px] ${fieldClass()}`}
        />
        <button type="submit" className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground">
          Добавить
        </button>
      </form>
    </div>
  );
}

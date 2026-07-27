"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SortableList, type DragHandleProps } from "@/shared/ui/sortable-list";
import { deleteFileAction, reorderFilesAction, setFileCoverAction } from "@/entities/file/actions";
import { uploadFile } from "@/entities/file/upload-client";
import type { components } from "@/lib/api/generated/schema";

type FileDto = components["schemas"]["FileDto"];

/**
 * Case's cover + gallery images (docs/planning/05-admin-panel.md §1) — one image is flagged
 * `isCover` (the card thumbnail), the rest are ordered via `position`/drag-and-drop, reusing the
 * same SortableList used by Technology/Navigation/Contact.
 */
export function MediaGalleryField({ module, externalId, initial }: { module: "PUBLIC" | "USER"; externalId: string; initial: FileDto[] }) {
  const router = useRouter();
  const [items, setItems] = useState<FileDto[]>([...initial].sort((a, b) => a.position - b.position));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    e.target.value = "";
    if (!picked) return;

    setBusy(true);
    setError(null);
    try {
      const uploaded = await uploadFile({
        module,
        externalId,
        type: "IMAGE",
        isCover: items.length === 0,
        file: picked,
      });
      const withPosition = { ...uploaded, position: items.length };
      setItems((prev) => [...prev, withPosition]);
      if (items.length > 0) {
        await reorderFilesAction([...items, withPosition].map((item, index) => ({ id: item.id, position: index })));
      }
      router.refresh();
    } catch {
      setError("Не удалось загрузить изображение.");
    } finally {
      setBusy(false);
    }
  }

  async function handleReorder(newItems: FileDto[]) {
    setBusy(true);
    setItems(newItems);
    try {
      await reorderFilesAction(newItems.map((item, index) => ({ id: item.id, position: index })));
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleSetCover(id: string) {
    setBusy(true);
    setItems((prev) => prev.map((item) => ({ ...item, isCover: item.id === id })));
    try {
      await setFileCoverAction(id);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(id: string) {
    setBusy(true);
    setItems((prev) => prev.filter((item) => item.id !== id));
    try {
      await deleteFileAction(id);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-semibold text-muted-foreground">Обложка и галерея</span>

      {items.length > 0 && (
        <SortableList
          items={items}
          onReorder={handleReorder}
          renderItem={(item, dragHandle: DragHandleProps) => (
            <div className="flex items-center gap-3 rounded-[10px] border border-border bg-card p-2">
              <DragHandle dragHandle={dragHandle} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/files/${item.id}`} alt={item.name} className="h-12 w-12 rounded-[8px] object-cover" />
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{item.name}</span>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="radio"
                  name={`cover-${externalId}`}
                  disabled={busy}
                  checked={item.isCover}
                  onChange={() => handleSetCover(item.id)}
                />
                Обложка
              </label>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleRemove(item.id)}
                className="text-xs text-destructive hover:opacity-80 disabled:opacity-50"
              >
                Удалить
              </button>
            </div>
          )}
        />
      )}

      <input ref={inputRef} type="file" accept="image/*" onChange={handleAdd} className="hidden" />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="w-fit rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
      >
        {busy ? "Загрузка…" : "Добавить изображение"}
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
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

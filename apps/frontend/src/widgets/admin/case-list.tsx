"use client";

import Link from "next/link";
import { useState } from "react";
import { SortableList, type DragHandleProps } from "@/shared/ui/sortable-list";
import { deleteCaseAction, reorderCasesAction } from "@/entities/case/actions";
import type { components } from "@/lib/api/generated/schema";

type CaseAdminDto = components["schemas"]["CaseAdminDto"];

const STATUS_LABELS: Record<CaseAdminDto["status"], string> = {
  DRAFT: "Черновик",
  PUBLISHED: "Опубликовано",
  ARCHIVED: "В архиве",
};

function titleOf(kase: CaseAdminDto) {
  return kase.translations.find((t) => t.locale === "ru")?.title || kase.translations[0]?.title || "(без названия)";
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

export function CaseList({ initial }: { initial: CaseAdminDto[] }) {
  const [items, setItems] = useState(initial);

  async function handleReorder(newItems: CaseAdminDto[]) {
    setItems(newItems);
    await reorderCasesAction(newItems.map((item, index) => ({ id: item.id, position: index })));
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить кейс без возможности восстановления?")) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    await deleteCaseAction(id);
  }

  if (items.length === 0) return <p className="text-sm text-muted-foreground">Кейсов пока нет.</p>;

  return (
    <SortableList
      items={items}
      onReorder={handleReorder}
      renderItem={(kase, dragHandle) => (
        <div className="flex flex-wrap items-center gap-3 rounded-[10px] border border-border bg-card p-3">
          <DragHandle dragHandle={dragHandle} />
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <span className="text-sm font-semibold">{titleOf(kase)}</span>
            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
              {STATUS_LABELS[kase.status]}
            </span>
            <span className="font-mono text-xs text-[var(--brand-text-faint)]">{kase.viewCount} просмотров</span>
          </div>
          <Link href={`/admin/cases/${kase.id}`} className="text-xs text-muted-foreground hover:text-foreground">
            Изменить
          </Link>
          <button
            type="button"
            onClick={() => handleDelete(kase.id)}
            className="text-xs text-destructive hover:opacity-80"
          >
            Удалить
          </button>
        </div>
      )}
    />
  );
}

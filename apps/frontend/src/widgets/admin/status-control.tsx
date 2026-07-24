"use client";

type Status = "DRAFT" | "PUBLISHED" | "ARCHIVED";

const LABELS: Record<Status, string> = {
  DRAFT: "Черновик",
  PUBLISHED: "Опубликовано",
  ARCHIVED: "В архиве",
};

const STATUSES: Status[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

/** Publish/unpublish is just a status change — no separate "publish" action (05-admin-panel.md §1). */
export function StatusControl({ value, onChange }: { value: Status; onChange: (status: Status) => void }) {
  return (
    <div className="flex w-fit gap-0.5 rounded-full border border-border p-0.5 text-xs">
      {STATUSES.map((status) => (
        <button
          key={status}
          type="button"
          onClick={() => onChange(status)}
          className={`rounded-full px-3 py-1.5 font-semibold transition-colors ${
            value === status ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {LABELS[status]}
        </button>
      ))}
    </div>
  );
}

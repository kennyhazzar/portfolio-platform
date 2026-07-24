"use client";

import { MarkdownContent } from "@/shared/ui/markdown-content";

/**
 * Live preview renders through the same MarkdownContent component the public site uses for
 * Case/Post bodies — this is deliberately not a separate preview renderer, so "what you see
 * here" and "what the public page will look like" can't drift apart (05-admin-panel.md §4).
 */
export function MarkdownEditor({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        <textarea
          required
          rows={18}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="resize-none rounded-[10px] border border-border bg-background px-3.5 py-2.5 font-mono text-[13px] leading-6 outline-none focus:border-primary"
        />
      </label>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground">Превью</span>
        <div className="max-h-[420px] overflow-y-auto rounded-[10px] border border-border bg-card p-4">
          {value ? (
            <MarkdownContent body={value} />
          ) : (
            <p className="text-sm text-[var(--brand-text-faint)]">Начните печатать, чтобы увидеть превью.</p>
          )}
        </div>
      </div>
    </div>
  );
}

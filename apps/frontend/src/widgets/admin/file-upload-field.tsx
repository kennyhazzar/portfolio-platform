"use client";

import { useRef, useState } from "react";
import { deleteFileAction } from "@/entities/file/actions";
import { uploadFile, type UploadFileInput } from "@/entities/file/upload-client";
import type { components } from "@/lib/api/generated/schema";

type FileDto = components["schemas"]["FileDto"];

/**
 * Single-file admin field (Hero/About photo, About résumé, Site Settings favicon, Post cover) —
 * docs/planning/05-admin-panel.md §1. Upload replaces in place: the backend always receives the
 * same fixed `name` for this slot, and the (name, module, externalId) unique constraint makes the
 * repository's upsert overwrite the previous file rather than creating a second one.
 */
export function FileUploadField({
  module,
  externalId,
  type,
  name,
  label,
  isCover = false,
  accept,
  initial = null,
}: {
  module: UploadFileInput["module"];
  externalId: string;
  type: UploadFileInput["type"];
  name: string;
  label: string;
  isCover?: boolean;
  accept?: string;
  initial?: FileDto | null;
}) {
  const [file, setFile] = useState<FileDto | null>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    e.target.value = "";
    if (!picked) return;

    setBusy(true);
    setError(null);
    try {
      const uploaded = await uploadFile({ module, externalId, type, name, isCover, file: picked });
      setFile(uploaded);
    } catch {
      setError("Не удалось загрузить файл.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await deleteFileAction(file.id);
      setFile(null);
    } catch {
      setError("Не удалось удалить файл.");
    } finally {
      setBusy(false);
    }
  }

  const isImage = type === "IMAGE";

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <div className="flex flex-wrap items-center gap-3">
        {file && isImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/files/${file.id}`}
            alt={file.name}
            className="h-16 w-16 rounded-[10px] border border-border object-cover"
          />
        )}
        {file && !isImage && (
          <a
            href={`/api/files/${file.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[10px] border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            {file.name}
          </a>
        )}
        <input ref={inputRef} type="file" accept={accept} onChange={handleFileChange} className="hidden" />
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          {busy ? "Загрузка…" : file ? "Заменить" : "Загрузить"}
        </button>
        {file && (
          <button
            type="button"
            disabled={busy}
            onClick={handleRemove}
            className="text-xs text-destructive hover:opacity-80 disabled:opacity-50"
          >
            Удалить
          </button>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

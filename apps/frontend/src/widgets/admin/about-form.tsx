"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TranslationTabs } from "@/shared/ui/translation-tabs";
import { updateAboutAction } from "@/entities/about/actions";
import { FileUploadField } from "./file-upload-field";
import type { components } from "@/lib/api/generated/schema";

type AboutAdminDto = components["schemas"]["AboutAdminDto"];
type AboutTranslationBody = components["schemas"]["AboutTranslationBody"];
type FileDto = components["schemas"]["FileDto"];

function BioField({ value, onChange }: { value: AboutTranslationBody; onChange: (next: AboutTranslationBody) => void }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-muted-foreground">Био (markdown)</span>
      <textarea
        required
        rows={12}
        value={value.bio}
        onChange={(e) => onChange({ bio: e.target.value })}
        className="resize-none rounded-[10px] border border-border bg-card px-3.5 py-2.5 font-mono text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

export function AboutForm({
  initial,
  initialPhoto,
  initialResume,
}: {
  initial: AboutAdminDto;
  initialPhoto?: FileDto | null;
  initialResume?: FileDto | null;
}) {
  const router = useRouter();
  const findTranslation = (locale: "ru" | "en") =>
    initial.translations.find((t) => t.locale === locale) ?? { bio: "" };

  const [ru, setRu] = useState<AboutTranslationBody>(findTranslation("ru"));
  const [en, setEn] = useState<AboutTranslationBody>(findTranslation("en"));
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ru.bio.trim() || !en.bio.trim()) {
      setStatus("error");
      return;
    }
    setStatus("saving");
    try {
      await updateAboutAction({ ru, en });
      router.refresh();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex max-w-[720px] flex-col gap-5">
      <FileUploadField
        module="PUBLIC"
        externalId={initial.id}
        type="IMAGE"
        name="photo"
        isCover
        accept="image/*"
        label="Cover"
        initial={initialPhoto}
      />
      <FileUploadField
        module="PUBLIC"
        externalId={initial.id}
        type="DOCUMENT"
        name="resume"
        accept=".pdf,.doc,.docx"
        label="Резюме"
        initial={initialResume}
      />

      <TranslationTabs ru={<BioField value={ru} onChange={setRu} />} en={<BioField value={en} onChange={setEn} />} />

      {status === "success" && <p className="text-sm text-primary">Сохранено.</p>}
      {status === "error" && <p className="text-sm text-destructive">Не удалось сохранить.</p>}

      <button
        type="submit"
        disabled={status === "saving"}
        className="w-fit rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {status === "saving" ? "Сохранение…" : "Сохранить"}
      </button>
    </form>
  );
}

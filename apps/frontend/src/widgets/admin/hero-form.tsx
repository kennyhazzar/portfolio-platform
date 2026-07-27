"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TranslationTabs } from "@/shared/ui/translation-tabs";
import { updateHeroAction } from "@/entities/hero/actions";
import { FileUploadField } from "./file-upload-field";
import type { components } from "@/lib/api/generated/schema";

type HeroAdminDto = components["schemas"]["HeroAdminDto"];
type HeroTranslationBody = components["schemas"]["HeroTranslationBody"];
type FileDto = components["schemas"]["FileDto"];

const emptyTranslation: HeroTranslationBody = { name: "", headline: "", description: "", ctaLabel: "" };

function fieldClass() {
  return "rounded-[10px] border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary";
}

function LocaleFields({
  value,
  onChange,
}: {
  value: HeroTranslationBody;
  onChange: (next: HeroTranslationBody) => void;
}) {
  return (
    <>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground">Имя</span>
        <input
          required
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          className={fieldClass()}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground">Фразы в hero (каждая с новой строки)</span>
        <textarea
          rows={4}
          value={value.headline ?? ""}
          onChange={(e) => onChange({ ...value, headline: e.target.value })}
          className={`resize-none ${fieldClass()}`}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground">Описание</span>
        <textarea
          rows={3}
          value={value.description ?? ""}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          className={`resize-none ${fieldClass()}`}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground">Текст кнопки (CTA)</span>
        <input
          value={value.ctaLabel ?? ""}
          onChange={(e) => onChange({ ...value, ctaLabel: e.target.value })}
          className={fieldClass()}
        />
      </label>
    </>
  );
}

export function HeroForm({ initial, initialPhoto }: { initial: HeroAdminDto; initialPhoto?: FileDto | null }) {
  const router = useRouter();
  const findTranslation = (locale: "ru" | "en") =>
    initial.translations.find((t) => t.locale === locale) ?? emptyTranslation;

  const [ru, setRu] = useState<HeroTranslationBody>(findTranslation("ru"));
  const [en, setEn] = useState<HeroTranslationBody>(findTranslation("en"));
  const [ctaUrl, setCtaUrl] = useState(initial.ctaUrl ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ru.name.trim() || !en.name.trim()) {
      setStatus("error");
      return;
    }
    setStatus("saving");
    try {
      await updateHeroAction({ ctaUrl: ctaUrl || undefined, ru, en });
      router.refresh();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex max-w-[560px] flex-col gap-5">
      <FileUploadField
        module="PUBLIC"
        externalId={initial.id}
        type="IMAGE"
        name="cover"
        isCover
        accept="image/*"
        label="Фото"
        initial={initialPhoto}
      />

      <TranslationTabs
        ru={<LocaleFields value={ru} onChange={setRu} />}
        en={<LocaleFields value={en} onChange={setEn} />}
      />

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground">Ссылка кнопки (CTA URL)</span>
        <input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} className={fieldClass()} />
      </label>

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

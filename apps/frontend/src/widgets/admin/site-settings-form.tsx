"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TranslationTabs } from "@/shared/ui/translation-tabs";
import { updateSiteSettingAction } from "@/entities/site-setting/actions";
import { FileUploadField } from "./file-upload-field";
import type { components } from "@/lib/api/generated/schema";

type SiteSettingAdminDto = components["schemas"]["SiteSettingAdminDto"];
type SiteSettingTranslationBody = components["schemas"]["SiteSettingTranslationBody"];
type FileDto = components["schemas"]["FileDto"];

const emptyTranslation: SiteSettingTranslationBody = {
  title: "",
  brandName: "",
  description: "",
  footerText: "",
  copyrightText: "",
  defaultSeoTitle: "",
  defaultSeoDescription: "",
};

function fieldClass() {
  return "rounded-[10px] border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary";
}

function LocaleFields({
  value,
  onChange,
}: {
  value: SiteSettingTranslationBody;
  onChange: (next: SiteSettingTranslationBody) => void;
}) {
  return (
    <>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground">Название сайта</span>
        <input required value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} className={fieldClass()} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground">
          Бренд в шапке сайта <span className="font-normal normal-case text-[var(--brand-text-faint)]">(если пусто — используется название сайта)</span>
        </span>
        <input
          value={value.brandName ?? ""}
          onChange={(e) => onChange({ ...value, brandName: e.target.value })}
          className={fieldClass()}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground">Описание</span>
        <textarea
          required
          rows={2}
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          className={`resize-none ${fieldClass()}`}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground">Текст в футере</span>
        <input
          value={value.footerText ?? ""}
          onChange={(e) => onChange({ ...value, footerText: e.target.value })}
          className={fieldClass()}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground">Копирайт</span>
        <input
          value={value.copyrightText ?? ""}
          onChange={(e) => onChange({ ...value, copyrightText: e.target.value })}
          className={fieldClass()}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground">SEO title по умолчанию</span>
        <input
          value={value.defaultSeoTitle ?? ""}
          onChange={(e) => onChange({ ...value, defaultSeoTitle: e.target.value })}
          className={fieldClass()}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground">SEO description по умолчанию</span>
        <textarea
          rows={2}
          value={value.defaultSeoDescription ?? ""}
          onChange={(e) => onChange({ ...value, defaultSeoDescription: e.target.value })}
          className={`resize-none ${fieldClass()}`}
        />
      </label>
    </>
  );
}

export function SiteSettingsForm({
  initial,
  initialFavicon,
}: {
  initial: SiteSettingAdminDto;
  initialFavicon?: FileDto | null;
}) {
  const router = useRouter();
  const findTranslation = (locale: "ru" | "en") =>
    initial.translations.find((t) => t.locale === locale) ?? emptyTranslation;

  const [ru, setRu] = useState<SiteSettingTranslationBody>(findTranslation("ru"));
  const [en, setEn] = useState<SiteSettingTranslationBody>(findTranslation("en"));
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ru.title.trim() || !ru.description.trim() || !en.title.trim() || !en.description.trim()) {
      setStatus("error");
      return;
    }
    setStatus("saving");
    try {
      await updateSiteSettingAction({ ru, en });
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
        name="favicon"
        isCover
        accept="image/*"
        label="Favicon"
        initial={initialFavicon}
      />

      <TranslationTabs
        ru={<LocaleFields value={ru} onChange={setRu} />}
        en={<LocaleFields value={en} onChange={setEn} />}
      />

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

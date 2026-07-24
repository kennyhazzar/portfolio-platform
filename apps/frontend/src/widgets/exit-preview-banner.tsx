import type { SupportedLocale } from "@/middleware";

/** Shown only while Next Draft Mode is enabled (docs/planning/05-admin-panel.md §3). */
export function ExitPreviewBanner({ locale, pathname }: { locale: SupportedLocale; pathname: string }) {
  const label = locale === "ru" ? "Предпросмотр черновика" : "Previewing draft content";
  const exitLabel = locale === "ru" ? "Выйти из предпросмотра" : "Exit preview";

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-amber-950">
      <span>{label}</span>
      <a href={`/api/preview/disable?redirect=${encodeURIComponent(pathname)}`} className="underline underline-offset-2">
        {exitLabel}
      </a>
    </div>
  );
}

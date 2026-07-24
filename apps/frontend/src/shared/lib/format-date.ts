import type { SupportedLocale } from "@/middleware";

export function formatDate(value: string | undefined, locale: SupportedLocale): string {
  if (!value) return "";
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

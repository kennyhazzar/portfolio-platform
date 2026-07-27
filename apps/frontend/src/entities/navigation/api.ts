import { api } from "@/shared/api/client";
import { unwrapEnvelope } from "@/shared/api/envelope";
import type { SupportedLocale } from "@/middleware";

export async function getNavigationItems(locale: SupportedLocale) {
  const { data } = await api.GET("/api/v1/navigation", { params: { query: { locale } } });
  return unwrapEnvelope(data) ?? [];
}

import { api } from "@/shared/api/client";
import { unwrapEnvelope } from "@/shared/api/envelope";
import type { SupportedLocale } from "@/middleware";

export async function getSiteSetting(locale: SupportedLocale) {
  const { data } = await api.GET("/api/v1/site-settings", { params: { query: { locale } } });
  return unwrapEnvelope(data);
}

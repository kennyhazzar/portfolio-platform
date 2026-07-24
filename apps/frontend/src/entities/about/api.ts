import { api } from "@/shared/api/client";
import { unwrapEnvelope } from "@/shared/api/envelope";
import type { SupportedLocale } from "@/middleware";

export async function getAbout(locale: SupportedLocale) {
  const { data } = await api.GET("/api/v1/about", { params: { query: { locale } } });
  return unwrapEnvelope(data);
}

import { api } from "@/shared/api/client";
import type { SupportedLocale } from "@/middleware";

export async function getComments(slug: string, locale: SupportedLocale, page = 1, perPage = 50) {
  const { data } = await api.GET("/api/v1/posts/{slug}/comments", {
    params: { path: { slug }, query: { locale, page, per_page: perPage } },
  });
  return data?.data ?? [];
}

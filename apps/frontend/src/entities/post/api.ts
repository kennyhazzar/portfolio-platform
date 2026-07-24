import { api } from "@/shared/api/client";
import { unwrapEnvelope } from "@/shared/api/envelope";
import type { SupportedLocale } from "@/middleware";

export async function getLatestPosts(locale: SupportedLocale, perPage = 3) {
  const { data } = await api.GET("/api/v1/posts", { params: { query: { locale, per_page: perPage } } });
  return data?.data ?? [];
}

export async function getPosts(locale: SupportedLocale, page = 1, perPage = 20) {
  const { data } = await api.GET("/api/v1/posts", { params: { query: { locale, page, per_page: perPage } } });
  return { items: data?.data ?? [], meta: data?.meta ?? null };
}

export async function getPostBySlug(slug: string, locale: SupportedLocale) {
  const { data } = await api.GET("/api/v1/posts/{slug}", { params: { path: { slug }, query: { locale } } });
  return unwrapEnvelope(data);
}

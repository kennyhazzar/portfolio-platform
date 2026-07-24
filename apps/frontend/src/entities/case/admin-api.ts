import { api } from "@/shared/api/client";
import { unwrapEnvelope } from "@/shared/api/envelope";
import { getAdminAuthHeaders } from "@/shared/server/admin-api";
import type { SupportedLocale } from "@/middleware";

export async function getCasesAdmin(page = 1, perPage = 50) {
  const headers = await getAdminAuthHeaders();
  const { data } = await api.GET("/api/v1/admin/cases", { headers, params: { query: { page, per_page: perPage } } });
  return data?.data ?? [];
}

export async function getCaseAdmin(id: string) {
  const headers = await getAdminAuthHeaders();
  const { data } = await api.GET("/api/v1/admin/cases/{id}", { headers, params: { path: { id } } });
  return unwrapEnvelope(data);
}

/** Any status — backs Draft Mode preview (docs/planning/05-admin-panel.md §3). */
export async function getCasePreviewBySlug(slug: string, locale: SupportedLocale) {
  const headers = await getAdminAuthHeaders();
  const { data } = await api.GET("/api/v1/admin/cases/preview/{slug}", {
    headers,
    params: { path: { slug }, query: { locale } },
  });
  return unwrapEnvelope(data);
}

import { api } from "@/shared/api/client";
import { getAdminAuthHeaders } from "@/shared/server/admin-api";
import type { components } from "@/lib/api/generated/schema";

type CommentStatus = components["schemas"]["CommentAdminDto"]["status"];

export async function getCommentsAdmin(status: CommentStatus = "PENDING", page = 1, perPage = 50) {
  const headers = await getAdminAuthHeaders();
  const { data } = await api.GET("/api/v1/admin/comments", {
    headers,
    params: { query: { status, page, per_page: perPage } },
  });
  return { items: data?.data ?? [], meta: data?.meta ?? null };
}

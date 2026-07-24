import { api } from "@/shared/api/client";
import { unwrapEnvelope } from "@/shared/api/envelope";
import { getAdminAuthHeaders } from "@/shared/server/admin-api";

export async function getNavigationItemsAdmin() {
  const headers = await getAdminAuthHeaders();
  const { data } = await api.GET("/api/v1/admin/navigation", { headers });
  return unwrapEnvelope(data) ?? [];
}

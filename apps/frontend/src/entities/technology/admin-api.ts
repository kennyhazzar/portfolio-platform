import { api } from "@/shared/api/client";
import { getAdminAuthHeaders } from "@/shared/server/admin-api";

export async function getTechnologiesAdmin() {
  const headers = await getAdminAuthHeaders();
  const { data } = await api.GET("/api/v1/admin/technologies", { headers, params: { query: { per_page: 100 } } });
  return data?.data ?? [];
}

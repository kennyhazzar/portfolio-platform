import { api } from "@/shared/api/client";
import { unwrapEnvelope } from "@/shared/api/envelope";
import { getAdminAuthHeaders } from "@/shared/server/admin-api";

export async function getSiteSettingAdmin() {
  const headers = await getAdminAuthHeaders();
  const { data } = await api.GET("/api/v1/admin/site-settings", { headers });
  return unwrapEnvelope(data);
}

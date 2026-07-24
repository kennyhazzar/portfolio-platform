import { api } from "@/shared/api/client";
import { unwrapEnvelope } from "@/shared/api/envelope";
import { getAdminAuthHeaders } from "@/shared/server/admin-api";

export async function getContactsAdmin() {
  const headers = await getAdminAuthHeaders();
  const { data } = await api.GET("/api/v1/admin/contacts", { headers });
  return unwrapEnvelope(data) ?? [];
}

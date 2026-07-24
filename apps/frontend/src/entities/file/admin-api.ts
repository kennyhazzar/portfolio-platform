import { api } from "@/shared/api/client";
import { unwrapEnvelope } from "@/shared/api/envelope";
import { getAdminAuthHeaders } from "@/shared/server/admin-api";

/** Files attached to one entity instance — backs FileUploadField/MediaGalleryField (docs/planning/05-admin-panel.md §1). */
export async function getFilesByExternalId(module: "PUBLIC" | "USER", externalId: string) {
  const headers = await getAdminAuthHeaders();
  const { data } = await api.GET("/api/v1/admin/files", { headers, params: { query: { module, externalId } } });
  return unwrapEnvelope(data) ?? [];
}

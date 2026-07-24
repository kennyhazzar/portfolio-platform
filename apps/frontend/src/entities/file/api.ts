import { api } from "@/shared/api/client";
import { unwrapEnvelope } from "@/shared/api/envelope";

/**
 * Public, unauthenticated lookup of the PUBLIC-module files attached to one entity instance
 * (Hero photo, About photo/résumé, Case/Post cover+gallery) — backs image rendering on the
 * public site (docs/planning/04-frontend-architecture.md §6).
 */
export async function getPublicFiles(externalId: string) {
  const { data } = await api.GET("/api/v1/file/external/{externalId}", { params: { path: { externalId } } });
  return unwrapEnvelope(data) ?? [];
}

export async function getPublicCover(externalId: string) {
  const files = await getPublicFiles(externalId);
  return files.find((f) => f.isCover) ?? null;
}

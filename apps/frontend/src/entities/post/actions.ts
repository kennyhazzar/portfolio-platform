"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/shared/api/client";
import { unwrapEnvelope } from "@/shared/api/envelope";
import { getAdminAuthHeaders } from "@/shared/server/admin-api";
import type { components } from "@/lib/api/generated/schema";

function revalidatePublic() {
  revalidatePath("/ru");
  revalidatePath("/en");
  revalidatePath("/ru/posts");
  revalidatePath("/en/posts");
}

/**
 * Returns the created post (rather than calling redirect() itself) so the client component can
 * navigate via router.push() — a Server Action that redirects internally breaks when the caller
 * wraps the call in try/catch, since the redirect signal propagates as a thrown error too.
 */
export async function createPostAction(body: components["schemas"]["CreatePostBody"]) {
  const headers = await getAdminAuthHeaders();
  const { data, error } = await api.POST("/api/v1/admin/posts", { headers, body });
  const created = unwrapEnvelope(data);
  if (error || !created) throw new Error("Failed to create post");
  revalidatePublic();
  return created;
}

export async function updatePostAction(id: string, body: components["schemas"]["UpdatePostBody"]) {
  const headers = await getAdminAuthHeaders();
  const { error } = await api.PATCH("/api/v1/admin/posts/{id}", { headers, params: { path: { id } }, body });
  if (error) throw new Error("Failed to update post");
  revalidatePublic();
}

export async function deletePostAction(id: string) {
  const headers = await getAdminAuthHeaders();
  const { error } = await api.DELETE("/api/v1/admin/posts/{id}", { headers, params: { path: { id } } });
  if (error) throw new Error("Failed to delete post");
  revalidatePublic();
}

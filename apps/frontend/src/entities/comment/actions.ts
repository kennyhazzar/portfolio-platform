"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/shared/api/client";
import { getAdminAuthHeaders } from "@/shared/server/admin-api";
import type { components } from "@/lib/api/generated/schema";

type CommentStatus = components["schemas"]["UpdateCommentStatusBody"]["status"];

function revalidatePublic() {
  revalidatePath("/ru/posts/[slug]", "page");
  revalidatePath("/en/posts/[slug]", "page");
  revalidatePath("/admin/comments");
}

export async function updateCommentStatusAction(id: string, status: CommentStatus) {
  const headers = await getAdminAuthHeaders();
  const { error } = await api.PATCH("/api/v1/admin/comments/{id}", { headers, params: { path: { id } }, body: { status } });
  if (error) throw new Error("Failed to update comment status");
  revalidatePublic();
}

export async function deleteCommentAction(id: string) {
  const headers = await getAdminAuthHeaders();
  const { error } = await api.DELETE("/api/v1/admin/comments/{id}", { headers, params: { path: { id } } });
  if (error) throw new Error("Failed to delete comment");
  revalidatePublic();
}

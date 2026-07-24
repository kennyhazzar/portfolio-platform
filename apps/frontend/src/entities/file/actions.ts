"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/shared/api/client";
import { getAdminAuthHeaders } from "@/shared/server/admin-api";

function revalidatePublic() {
  revalidatePath("/ru");
  revalidatePath("/en");
}

export async function deleteFileAction(id: string) {
  const headers = await getAdminAuthHeaders();
  const { error } = await api.DELETE("/api/v1/admin/files/{id}", { headers, params: { path: { id } } });
  if (error) throw new Error("Failed to delete file");
  revalidatePublic();
}

export async function reorderFilesAction(items: { id: string; position: number }[]) {
  const headers = await getAdminAuthHeaders();
  const { error } = await api.PATCH("/api/v1/admin/files/reorder", { headers, body: { items } });
  if (error) throw new Error("Failed to reorder files");
  revalidatePublic();
}

export async function setFileCoverAction(id: string) {
  const headers = await getAdminAuthHeaders();
  const { error } = await api.PATCH("/api/v1/admin/files/{id}/cover", { headers, params: { path: { id } } });
  if (error) throw new Error("Failed to set cover");
  revalidatePublic();
}

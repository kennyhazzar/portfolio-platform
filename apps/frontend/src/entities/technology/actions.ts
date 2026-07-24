"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/shared/api/client";
import { getAdminAuthHeaders } from "@/shared/server/admin-api";
import type { components } from "@/lib/api/generated/schema";

function revalidatePublic() {
  revalidatePath("/ru");
  revalidatePath("/en");
}

export async function createTechnologyAction(body: components["schemas"]["CreateTechnologyBody"]) {
  const headers = await getAdminAuthHeaders();
  const { error } = await api.POST("/api/v1/admin/technologies", { headers, body });
  if (error) throw new Error("Failed to create technology");
  revalidatePublic();
}

export async function updateTechnologyAction(id: string, body: components["schemas"]["UpdateTechnologyBody"]) {
  const headers = await getAdminAuthHeaders();
  const { error } = await api.PATCH("/api/v1/admin/technologies/{id}", { headers, params: { path: { id } }, body });
  if (error) throw new Error("Failed to update technology");
  revalidatePublic();
}

export async function deleteTechnologyAction(id: string) {
  const headers = await getAdminAuthHeaders();
  const { error } = await api.DELETE("/api/v1/admin/technologies/{id}", { headers, params: { path: { id } } });
  if (error) throw new Error("Failed to delete technology");
  revalidatePublic();
}

export async function reorderTechnologiesAction(items: { id: string; position: number }[]) {
  const headers = await getAdminAuthHeaders();
  const { error } = await api.PATCH("/api/v1/admin/technologies/reorder", { headers, body: { items } });
  if (error) throw new Error("Failed to reorder technologies");
  revalidatePublic();
}

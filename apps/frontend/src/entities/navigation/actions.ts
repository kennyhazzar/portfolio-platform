"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/shared/api/client";
import { getAdminAuthHeaders } from "@/shared/server/admin-api";
import type { components } from "@/lib/api/generated/schema";

function revalidatePublic() {
  revalidatePath("/ru");
  revalidatePath("/en");
}

export async function createNavigationItemAction(body: components["schemas"]["CreateNavigationItemBody"]) {
  const headers = await getAdminAuthHeaders();
  const { error } = await api.POST("/api/v1/admin/navigation", { headers, body });
  if (error) throw new Error("Failed to create navigation item");
  revalidatePublic();
}

export async function updateNavigationItemAction(id: string, body: components["schemas"]["UpdateNavigationItemBody"]) {
  const headers = await getAdminAuthHeaders();
  const { error } = await api.PATCH("/api/v1/admin/navigation/{id}", { headers, params: { path: { id } }, body });
  if (error) throw new Error("Failed to update navigation item");
  revalidatePublic();
}

export async function deleteNavigationItemAction(id: string) {
  const headers = await getAdminAuthHeaders();
  const { error } = await api.DELETE("/api/v1/admin/navigation/{id}", { headers, params: { path: { id } } });
  if (error) throw new Error("Failed to delete navigation item");
  revalidatePublic();
}

export async function reorderNavigationItemsAction(items: { id: string; position: number }[]) {
  const headers = await getAdminAuthHeaders();
  const { error } = await api.PATCH("/api/v1/admin/navigation/reorder", { headers, body: { items } });
  if (error) throw new Error("Failed to reorder navigation items");
  revalidatePublic();
}

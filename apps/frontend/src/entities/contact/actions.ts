"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/shared/api/client";
import { getAdminAuthHeaders } from "@/shared/server/admin-api";
import type { components } from "@/lib/api/generated/schema";

function revalidatePublic() {
  revalidatePath("/ru");
  revalidatePath("/en");
  revalidatePath("/admin/contacts");
}

export async function createContactAction(body: components["schemas"]["CreateContactBody"]) {
  const headers = await getAdminAuthHeaders();
  const { error } = await api.POST("/api/v1/admin/contacts", { headers, body });
  if (error) throw new Error("Failed to create contact");
  revalidatePublic();
}

export async function updateContactAction(id: string, body: components["schemas"]["UpdateContactBody"]) {
  const headers = await getAdminAuthHeaders();
  const { error } = await api.PATCH("/api/v1/admin/contacts/{id}", { headers, params: { path: { id } }, body });
  if (error) throw new Error("Failed to update contact");
  revalidatePublic();
}

export async function deleteContactAction(id: string) {
  const headers = await getAdminAuthHeaders();
  const { error } = await api.DELETE("/api/v1/admin/contacts/{id}", { headers, params: { path: { id } } });
  if (error) throw new Error("Failed to delete contact");
  revalidatePublic();
}

export async function reorderContactsAction(items: { id: string; position: number }[]) {
  const headers = await getAdminAuthHeaders();
  const { error } = await api.PATCH("/api/v1/admin/contacts/reorder", { headers, body: { items } });
  if (error) throw new Error("Failed to reorder contacts");
  revalidatePublic();
}

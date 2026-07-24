"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/shared/api/client";
import { getAdminAuthHeaders } from "@/shared/server/admin-api";
import type { components } from "@/lib/api/generated/schema";

export async function updateAboutAction(body: components["schemas"]["UpdateAboutBody"]) {
  const headers = await getAdminAuthHeaders();
  const { error } = await api.PATCH("/api/v1/admin/about", { headers, body });
  if (error) throw new Error("Failed to update about content");

  revalidatePath("/ru");
  revalidatePath("/en");
  revalidatePath("/ru/about");
  revalidatePath("/en/about");
}

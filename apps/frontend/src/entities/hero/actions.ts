"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/shared/api/client";
import { getAdminAuthHeaders } from "@/shared/server/admin-api";
import type { components } from "@/lib/api/generated/schema";

export async function updateHeroAction(body: components["schemas"]["UpdateHeroBody"]) {
  const headers = await getAdminAuthHeaders();
  const { error } = await api.PATCH("/api/v1/admin/hero", { headers, body });
  if (error) throw new Error("Failed to update hero content");

  revalidatePath("/ru");
  revalidatePath("/en");
  revalidatePath("/admin/hero");
}

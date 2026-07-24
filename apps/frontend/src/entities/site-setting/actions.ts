"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/shared/api/client";
import { getAdminAuthHeaders } from "@/shared/server/admin-api";
import type { components } from "@/lib/api/generated/schema";

export async function updateSiteSettingAction(body: components["schemas"]["UpdateSiteSettingBody"]) {
  const headers = await getAdminAuthHeaders();
  const { error } = await api.PATCH("/api/v1/admin/site-settings", { headers, body });
  if (error) throw new Error("Failed to update site settings");

  // Site settings feed every page's metadata (title/description fallback), so invalidate the
  // whole locale subtree rather than a single route.
  revalidatePath("/[locale]", "layout");
}

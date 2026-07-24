import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_TOKEN_COOKIE } from "./auth";

/**
 * Every admin Server Component/Action reads the accessToken cookie explicitly and forwards it
 * as a Bearer header on its own server-to-server call — not relying on cookie-forwarding
 * semantics between two separate processes (docs/planning/04-frontend-architecture.md §4).
 */
export async function getAdminAuthHeaders(): Promise<{ Authorization: string }> {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) redirect("/admin/login");
  return { Authorization: `Bearer ${token}` };
}

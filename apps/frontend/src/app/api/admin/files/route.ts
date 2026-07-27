import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/shared/server/auth";

const INTERNAL_API_BASE_URL = process.env.INTERNAL_API_BASE_URL ?? "http://localhost:3000";

/**
 * Plain browser fetch → Route Handler → backend, the same proxy shape already used for
 * captcha/comments/view (docs/planning/04-frontend-architecture.md §8) — not a Server Action.
 * Passing a File through a Server Action (nested in a plain object argument) hung indefinitely
 * in this app rather than cleanly erroring or succeeding; a plain FormData POST through a Route
 * Handler is the well-trodden path and sidesteps that entirely.
 */
export async function POST(request: NextRequest) {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Admin authentication required" }, { status: 401 });

  const formData = await request.formData();
  const upstream = await fetch(`${INTERNAL_API_BASE_URL}/api/v1/admin/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const payload = await upstream.json().catch(() => null);
  if (upstream.ok) {
    revalidatePath("/ru");
    revalidatePath("/en");
    revalidatePath("/admin/about");
    revalidatePath("/admin/hero");
    revalidatePath("/admin/site-settings");
    revalidatePath("/admin/posts");
    revalidatePath("/admin/cases");
  }
  return NextResponse.json(payload, { status: upstream.status });
}

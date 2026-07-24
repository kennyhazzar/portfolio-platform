import { cookies, draftMode } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE, fetchCurrentUser } from "@/shared/server/auth";
import { SUPPORTED_LOCALES } from "@/middleware";

/**
 * Admin editor's "Preview" button lands here. Checks the caller is an authenticated admin the
 * same way middleware.ts gates /admin/* (GET /auth/me, server-to-server — not local JWT
 * verification), then enables Next's Draft Mode and redirects to the real public route, so the
 * preview is pixel-identical to the eventual published page (docs/planning/05-admin-panel.md §3).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");
  const slug = searchParams.get("slug");
  const locale = searchParams.get("locale");

  if ((type !== "case" && type !== "post") || !slug) {
    return NextResponse.json({ error: "Invalid preview request" }, { status: 400 });
  }
  if (!locale || !(SUPPORTED_LOCALES as readonly string[]).includes(locale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  const accessToken = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  const user = accessToken ? await fetchCurrentUser(accessToken) : null;
  if (!user) {
    return NextResponse.json({ error: "Admin authentication required" }, { status: 401 });
  }

  (await draftMode()).enable();

  const resource = type === "case" ? "cases" : "posts";
  const target = new URL(`/${locale}/${resource}/${encodeURIComponent(slug)}`, request.url);
  return NextResponse.redirect(target);
}

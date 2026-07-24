import { NextResponse, type NextRequest } from "next/server";

const INTERNAL_API_BASE_URL = process.env.INTERNAL_API_BASE_URL ?? "http://localhost:3000";

/**
 * Thin proxy so the client component never talks to the backend directly (no CORS setup needed,
 * and the backend URL stays server-only). Forwards the real visitor's IP/UA so the backend's
 * Redis view-dedup hash is per-visitor rather than per-Next.js-server (see docs/planning/04-frontend-architecture.md §7).
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const type = body?.type;
  const slug = body?.slug;
  const locale = body?.locale;

  if ((type !== "case" && type !== "post") || typeof slug !== "string" || !slug) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (locale !== "ru" && locale !== "en") {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  const resource = type === "case" ? "cases" : "posts";
  const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
  const userAgent = request.headers.get("user-agent") ?? "";

  await fetch(
    `${INTERNAL_API_BASE_URL}/api/v1/${resource}/${encodeURIComponent(slug)}/view?locale=${locale}`,
    {
      method: "POST",
      headers: {
        ...(forwardedFor && { "x-forwarded-for": forwardedFor }),
        ...(userAgent && { "user-agent": userAgent }),
      },
    },
  ).catch(() => null);

  return new NextResponse(null, { status: 204 });
}

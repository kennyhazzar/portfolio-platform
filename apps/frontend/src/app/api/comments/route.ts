import { NextResponse, type NextRequest } from "next/server";

const INTERNAL_API_BASE_URL = process.env.INTERNAL_API_BASE_URL ?? "http://localhost:3000";

/**
 * Proxies comment submission so the browser never talks to the backend directly, and forwards
 * the real visitor's IP/UA so the backend's ipAddressHash reflects the actual commenter rather
 * than the Next.js server (see docs/planning/04-frontend-architecture.md §8).
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { slug, locale, ...commentBody } = body ?? {};

  if (typeof slug !== "string" || !slug || (locale !== "ru" && locale !== "en")) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
  const userAgent = request.headers.get("user-agent") ?? "";

  const upstream = await fetch(
    `${INTERNAL_API_BASE_URL}/api/v1/posts/${encodeURIComponent(slug)}/comments?locale=${locale}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(forwardedFor && { "x-forwarded-for": forwardedFor }),
        ...(userAgent && { "user-agent": userAgent }),
      },
      body: JSON.stringify(commentBody),
    },
  );

  const payload = await upstream.json().catch(() => null);

  // Success responses go through the backend's global TransformInterceptor, which wraps a
  // single object in `{ data: ... }` — errors are untouched (see shared/api/envelope.ts).
  const responseBody = upstream.ok ? (payload?.data ?? null) : payload;
  return NextResponse.json(responseBody, { status: upstream.status });
}

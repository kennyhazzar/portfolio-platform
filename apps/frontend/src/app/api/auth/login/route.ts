import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, accessTokenCookieOptions, refreshTokenCookieOptions } from "@/shared/server/auth";

const INTERNAL_API_BASE_URL = process.env.INTERNAL_API_BASE_URL ?? "http://localhost:3000";

function loginErrorCode(status: number, payload: unknown) {
  const message = typeof (payload as { message?: unknown })?.message === "string" ? (payload as { message: string }).message : "";
  if (status === 429) return "rate-limited";
  if (status === 403) return "forbidden";
  if (message.includes("blocked") || message.includes("locked")) return "forbidden";
  if (message.includes("captcha")) return "captcha-required";
  if (status === 401) return "invalid-credentials";
  return "login-failed";
}

/**
 * Forwards credentials to the backend server-to-server, then mints the frontend's own
 * httpOnly cookies from the response body (HYBRID auth mode returns tokens in JSON as well as
 * the backend's own cookies — we only use the JSON body, since the browser never talks to the
 * backend directly and the backend's cookies are scoped to its own origin anyway).
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = body?.email;
  const password = body?.password;

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  }

  const upstream = await fetch(`${INTERNAL_API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  const payload = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    const response = NextResponse.json(
      { error: loginErrorCode(upstream.status, payload), upstream: payload ?? null },
      { status: upstream.status },
    );
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
    return response;
  }

  const data = payload?.data;
  if (!data?.accessToken || !data?.refreshToken || !data?.user) {
    return NextResponse.json({ error: "Unexpected auth response" }, { status: 502 });
  }

  const response = NextResponse.json({ user: data.user });
  response.cookies.set(ACCESS_TOKEN_COOKIE, data.accessToken, accessTokenCookieOptions());
  response.cookies.set(REFRESH_TOKEN_COOKIE, data.refreshToken, refreshTokenCookieOptions());
  return response;
}

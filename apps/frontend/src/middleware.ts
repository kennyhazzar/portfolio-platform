import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
  fetchCurrentUser,
  refreshOnceDetailed,
} from "@/shared/server/auth";

// Node.js runtime (not Edge) so the single-flight refresh guard's in-memory Map is shared with
// the /api/auth/refresh route handler within this one long-lived process (see shared/server/auth.ts).
export const runtime = "nodejs";

export const SUPPORTED_LOCALES = ["ru", "en"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
const DEFAULT_LOCALE: SupportedLocale = "ru";
const LOCALE_COOKIE = "locale";

function detectLocale(request: NextRequest): SupportedLocale {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale && (SUPPORTED_LOCALES as readonly string[]).includes(cookieLocale)) {
    return cookieLocale as SupportedLocale;
  }
  const acceptLanguage = request.headers.get("accept-language") ?? "";
  const preferred = acceptLanguage.split(",")[0]?.slice(0, 2).toLowerCase();
  if (preferred && (SUPPORTED_LOCALES as readonly string[]).includes(preferred)) {
    return preferred as SupportedLocale;
  }
  return DEFAULT_LOCALE;
}

/**
 * Gates /admin/* (except /admin/login) by calling GET /auth/me server-to-server — not local JWT
 * verification, so the backend stays the single source of truth on session validity (see
 * docs/planning/04-frontend-architecture.md §4). Attempts a refresh once before redirecting to
 * login, so an expired access token doesn't force a re-login while the refresh token is still valid.
 */
async function handleAdminGate(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (accessToken && (await fetchCurrentUser(accessToken))) {
    return NextResponse.next();
  }

  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (refreshToken) {
    const refreshed = await refreshOnceDetailed(refreshToken);
    if (refreshed.ok) {
      const response = NextResponse.redirect(request.nextUrl);
      response.cookies.set(ACCESS_TOKEN_COOKIE, refreshed.accessToken, accessTokenCookieOptions());
      response.cookies.set(REFRESH_TOKEN_COOKIE, refreshed.refreshToken, refreshTokenCookieOptions());
      return response;
    }

    if (refreshed.reason !== "invalid") {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      loginUrl.searchParams.set("reason", refreshed.reason === "rate-limited" ? "rate-limited" : "session-refresh-failed");
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete(ACCESS_TOKEN_COOKIE);
      return response;
    }
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.searchParams.set("reason", refreshToken ? "session-invalid" : "session-expired");
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    return handleAdminGate(request);
  }

  const hasLocalePrefix = SUPPORTED_LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasLocalePrefix) return NextResponse.next();

  const locale = detectLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  const response = NextResponse.redirect(url);
  response.cookies.set(LOCALE_COOKIE, locale, { maxAge: 60 * 60 * 24 * 365, path: "/" });
  return response;
}

export const config = {
  // Skip Next internals, static assets, and the api tree — admin is now included so the auth gate runs.
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};

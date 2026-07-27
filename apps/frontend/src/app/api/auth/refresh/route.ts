import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
  refreshOnceDetailed,
} from "@/shared/server/auth";

/** Manual refresh entry point for Server Actions/Components that hit a 401 mid-request. */
export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: "session-expired" }, { status: 401 });
  }

  const tokens = await refreshOnceDetailed(refreshToken);
  if (!tokens.ok) {
    if (tokens.reason !== "invalid") {
      return NextResponse.json(
        { error: tokens.reason === "rate-limited" ? "rate-limited" : "session-refresh-failed" },
        { status: tokens.status ?? 503 },
      );
    }

    const response = NextResponse.json({ error: "session-invalid" }, { status: 401 });
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
    return response;
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, accessTokenCookieOptions());
  response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, refreshTokenCookieOptions());
  return response;
}

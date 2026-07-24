import "server-only";

const INTERNAL_API_BASE_URL = process.env.INTERNAL_API_BASE_URL ?? "http://localhost:3000";
const isProd = process.env.NODE_ENV === "production";

export const ACCESS_TOKEN_COOKIE = "accessToken";
export const REFRESH_TOKEN_COOKIE = "refreshToken";

/**
 * Mirrors the backend's own cookie flags (docker/config.docker.yaml `auth.cookies`) but scoped
 * to the frontend's own origin — the browser never talks to the backend directly (see
 * docs/planning/04-frontend-architecture.md §4), so these are separate cookies, not forwarded ones.
 */
export function accessTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? ("strict" as const) : ("lax" as const),
    maxAge: 900, // 15 minutes, in seconds (Next cookie API), matches the backend's 900000ms
    path: "/",
  };
}

export function refreshTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? ("strict" as const) : ("lax" as const),
    maxAge: 604800, // 7 days, matches the backend's 604800000ms
    path: "/",
  };
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  surname: string;
  role?: { id: string; name: string; type: string };
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** GET /auth/me — the source of truth for session validity (no local JWT verification, see §4). */
export async function fetchCurrentUser(accessToken: string): Promise<UserProfile | null> {
  const res = await fetch(`${INTERNAL_API_BASE_URL}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const payload = await res.json().catch(() => null);
  return payload?.data ?? null;
}

const inFlightRefresh = new Map<string, Promise<AuthTokens | null>>();

/**
 * Single-flight guard around POST /auth/refresh, keyed by the refresh token value — concurrent
 * callers within the same tick await one shared call instead of each rotating the token
 * themselves, which would revoke each other (docs/planning/04-frontend-architecture.md §4's
 * "refresh race condition"). Relies on this app running as one long-lived Node process
 * (output: standalone, single container) — would need a Redis-backed lock on a multi-instance
 * deployment.
 *
 * The settled result stays cached for a short grace period after the call completes (not
 * cleared immediately) — otherwise a request arriving a few milliseconds after the shared call
 * already resolved falls outside the lock and retries with the now-rotated (revoked) token,
 * which the backend treats as theft and revokes every session for the user. Confirmed this gap
 * is real by firing concurrent requests against a live server before adding the grace period.
 */
const REFRESH_GRACE_PERIOD_MS = 5_000;

export function refreshOnce(refreshToken: string): Promise<AuthTokens | null> {
  const existing = inFlightRefresh.get(refreshToken);
  if (existing) return existing;

  const promise = doRefresh(refreshToken);
  inFlightRefresh.set(refreshToken, promise);
  promise.finally(() => {
    setTimeout(() => inFlightRefresh.delete(refreshToken), REFRESH_GRACE_PERIOD_MS);
  });
  return promise;
}

async function doRefresh(refreshToken: string): Promise<AuthTokens | null> {
  const res = await fetch(`${INTERNAL_API_BASE_URL}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const payload = await res.json().catch(() => null);
  const data = payload?.data;
  if (!data?.accessToken || !data?.refreshToken) return null;
  return { accessToken: data.accessToken, refreshToken: data.refreshToken };
}

import { NextResponse } from "next/server";
import { api } from "@/shared/api/client";
import { unwrapEnvelope } from "@/shared/api/envelope";

/**
 * Proxies challenge creation so the browser never talks to the backend directly. The image
 * URL is rewritten to our own /api/captcha/image/[id] proxy — the backend's own imageUrl points
 * at an internal-only host the browser can't reach (see docs/planning/04-frontend-architecture.md §8).
 */
export async function POST() {
  const { data, error } = await api.POST("/api/v1/captcha/challenges", {
    body: { context: "comment_submit", riskScore: 0 },
  });

  const challenge = unwrapEnvelope(data);
  if (!challenge || error) {
    return NextResponse.json({ error: "Failed to create captcha challenge" }, { status: 502 });
  }

  return NextResponse.json({
    challengeId: challenge.challengeId,
    imageUrl: `/api/captcha/image/${challenge.challengeId}`,
    expiresIn: challenge.expiresIn,
  });
}

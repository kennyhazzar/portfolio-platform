import { NextResponse } from "next/server";

const INTERNAL_API_BASE_URL = process.env.INTERNAL_API_BASE_URL ?? "http://localhost:3000";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const upstream = await fetch(`${INTERNAL_API_BASE_URL}/api/v1/captcha/challenges/${encodeURIComponent(id)}/image`);

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Captcha image not found" }, { status: 404 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/svg+xml",
      "Cache-Control": "no-store",
    },
  });
}

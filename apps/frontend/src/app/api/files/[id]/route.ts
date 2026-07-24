import { NextResponse } from "next/server";

const INTERNAL_API_BASE_URL = process.env.INTERNAL_API_BASE_URL ?? "http://localhost:3000";

/** Streams a PUBLIC file (Hero photo, Case cover/gallery, ...) so the browser never calls the backend directly. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const upstream = await fetch(`${INTERNAL_API_BASE_URL}/api/v1/file/public/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
      "Cache-Control": "no-store",
    },
  });
}

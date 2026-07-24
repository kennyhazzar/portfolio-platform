"use client";

import { useEffect } from "react";
import type { SupportedLocale } from "@/middleware";

/**
 * Fires once per real page visit — mounted only by the rendered detail page, never by
 * Next.js <Link> prefetching (which doesn't execute client component effects), so it can't
 * double-count from hover/viewport prefetch the way a route-level tracker would.
 */
export function ViewBeacon({
  type,
  slug,
  locale,
}: {
  type: "case" | "post";
  slug: string;
  locale: SupportedLocale;
}) {
  useEffect(() => {
    fetch("/api/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, slug, locale }),
      keepalive: true,
    }).catch(() => {});
  }, [type, slug, locale]);

  return null;
}

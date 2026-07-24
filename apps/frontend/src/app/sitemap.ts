import type { MetadataRoute } from "next";
import { SITE_URL } from "@/shared/seo/metadata";
import { getCases } from "@/entities/case/api";
import { getPosts } from "@/entities/post/api";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/middleware";

// Without this, Next.js treats the route as static and caches it after the first request,
// so newly published cases/posts wouldn't appear until a rebuild.
export const dynamic = "force-dynamic";

// The backend caps per_page at 100 (common/Paginated.ts), so a large site needs multiple requests.
const MAX_PER_PAGE = 100;

async function fetchAll<T>(
  fetchPage: (locale: SupportedLocale, page: number, perPage: number) => Promise<{ items: T[]; meta: { pages: number } | null }>,
  locale: SupportedLocale,
): Promise<T[]> {
  const first = await fetchPage(locale, 1, MAX_PER_PAGE);
  const totalPages = first.meta?.pages ?? 1;
  const rest = await Promise.all(
    Array.from({ length: Math.max(totalPages - 1, 0) }, (_, i) => fetchPage(locale, i + 2, MAX_PER_PAGE)),
  );
  return [...first.items, ...rest.flatMap((r) => r.items)];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of SUPPORTED_LOCALES) {
    entries.push(
      { url: `${SITE_URL}/${locale}`, changeFrequency: "weekly", priority: 1 },
      { url: `${SITE_URL}/${locale}/about`, changeFrequency: "monthly", priority: 0.5 },
      { url: `${SITE_URL}/${locale}/cases`, changeFrequency: "weekly", priority: 0.8 },
      { url: `${SITE_URL}/${locale}/posts`, changeFrequency: "weekly", priority: 0.8 },
    );

    const [cases, posts] = await Promise.all([fetchAll(getCases, locale), fetchAll(getPosts, locale)]);

    for (const c of cases) {
      entries.push({
        url: `${SITE_URL}/${locale}/cases/${c.slug}`,
        lastModified: c.publishedAt,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }

    for (const p of posts) {
      entries.push({
        url: `${SITE_URL}/${locale}/posts/${p.slug}`,
        lastModified: p.publishedAt,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  return entries;
}

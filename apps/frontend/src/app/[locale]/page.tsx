import type { Metadata } from "next";
import { getHero } from "@/entities/hero/api";
import { getAbout } from "@/entities/about/api";
import { getTechnologies } from "@/entities/technology/api";
import { getFeaturedCases } from "@/entities/case/api";
import { getLatestPosts } from "@/entities/post/api";
import { getContacts } from "@/entities/contact/api";
import { getSiteSetting } from "@/entities/site-setting/api";
import { getPublicCover } from "@/entities/file/api";
import { coversById } from "@/entities/file/covers-by-id";
import { getDictionary } from "@/shared/i18n/dictionary";
import { buildMetadata } from "@/shared/seo/metadata";
import { SiteHeader } from "@/widgets/site-header";
import { HeroSection } from "@/widgets/hero-section";
import { TechStackSection } from "@/widgets/tech-stack-section";
import { CaseGridSection } from "@/widgets/case-grid-section";
import { PostListSection } from "@/widgets/post-list-section";

/**
 * Not statically prerendered — this page's data fetches need a reachable backend, which the
 * isolated `docker build` stage for the frontend image doesn't have (no compose network at
 * build time). Rendering per-request instead keeps the Docker image buildable without a live
 * backend; the fetch-level Data Cache (revalidate/revalidateTag, 04-frontend-architecture.md §5)
 * still applies, so this doesn't lose the on-demand revalidation behavior.
 */
export const dynamic = "force-dynamic";
import { AboutSection } from "@/widgets/about-section";
import { ContactsSection } from "@/widgets/contacts-section";
import { SiteFooter } from "@/widgets/site-footer";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/middleware";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = (await params) as { locale: SupportedLocale };
  const siteSetting = await getSiteSetting(locale);
  const languageAlternates = Object.fromEntries(SUPPORTED_LOCALES.map((l) => [l, `/${l}`]));
  return buildMetadata({ locale, siteSetting, pathname: `/${locale}`, languageAlternates });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: SupportedLocale };
  const dict = getDictionary(locale);

  const [hero, about, technologies, cases, posts, contacts] = await Promise.all([
    getHero(locale),
    getAbout(locale),
    getTechnologies(),
    getFeaturedCases(locale),
    getLatestPosts(locale),
    getContacts(),
  ]);
  const [heroPhoto, caseCovers, postCovers] = await Promise.all([
    hero ? getPublicCover(hero.id) : null,
    coversById(cases.map((c) => c.id)),
    coversById(posts.map((p) => p.id)),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader locale={locale} dict={dict} />
      <main className="flex-1">
        <HeroSection hero={hero} photoId={heroPhoto?.id ?? null} locale={locale} />
        <TechStackSection technologies={technologies} dict={dict} />
        <CaseGridSection cases={cases} coversById={caseCovers} locale={locale} dict={dict} />
        <PostListSection posts={posts} coversById={postCovers} locale={locale} dict={dict} />
        <AboutSection bio={about?.bio ?? null} locale={locale} dict={dict} />
        <ContactsSection contacts={contacts} dict={dict} />
      </main>
      <SiteFooter dict={dict} />
    </div>
  );
}

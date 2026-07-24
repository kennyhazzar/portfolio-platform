import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { getCaseBySlug } from "@/entities/case/api";
import { getCasePreviewBySlug } from "@/entities/case/admin-api";
import { getSiteSetting } from "@/entities/site-setting/api";
import { getPublicFiles } from "@/entities/file/api";
import { getDictionary } from "@/shared/i18n/dictionary";
import { buildMetadata } from "@/shared/seo/metadata";
import { formatDate } from "@/shared/lib/format-date";
import { MarkdownContent } from "@/shared/ui/markdown-content";
import { ViewBeacon } from "@/shared/ui/view-beacon";
import { SiteHeader } from "@/widgets/site-header";
import { SiteFooter } from "@/widgets/site-footer";
import { ExitPreviewBanner } from "@/widgets/exit-preview-banner";
import type { SupportedLocale } from "@/middleware";

interface RouteParams {
  locale: string;
  slug: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { locale, slug } = (await params) as { locale: SupportedLocale; slug: string };
  const { isEnabled: isPreview } = await draftMode();
  const [kase, siteSetting] = await Promise.all([
    isPreview ? getCasePreviewBySlug(slug, locale) : getCaseBySlug(slug, locale),
    getSiteSetting(locale),
  ]);
  if (!kase) return {};

  const languageAlternates = Object.fromEntries(
    Object.entries(kase.alternates).map(([l, s]) => [l, `/${l}/cases/${s}`]),
  );

  return buildMetadata({
    locale,
    siteSetting,
    title: kase.seoTitle ?? kase.title,
    description: kase.seoDescription ?? kase.summary,
    pathname: `/${locale}/cases/${slug}`,
    languageAlternates,
  });
}

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { locale, slug } = (await params) as { locale: SupportedLocale; slug: string };
  const dict = getDictionary(locale);
  const { isEnabled: isPreview } = await draftMode();
  const kase = isPreview ? await getCasePreviewBySlug(slug, locale) : await getCaseBySlug(slug, locale);
  if (!kase) notFound();
  const files = await getPublicFiles(kase.id);
  const cover = files.find((f) => f.isCover) ?? null;
  const gallery = files.filter((f) => !f.isCover);

  return (
    <div className="flex min-h-screen flex-col">
      {isPreview ? (
        <ExitPreviewBanner locale={locale} pathname={`/${locale}/cases/${slug}`} />
      ) : (
        <ViewBeacon type="case" slug={slug} locale={locale} />
      )}
      <SiteHeader locale={locale} dict={dict} />
      <main className="flex-1">
        <article className="py-16">
          <div className="mx-auto max-w-[840px] px-7">
            <div className="mb-3 flex flex-wrap items-center gap-3 font-mono text-xs text-[var(--brand-text-faint)]">
              {kase.publishedAt && <span className="tabular-nums">{formatDate(kase.publishedAt, locale)}</span>}
            </div>
            <h1 className="mb-4 font-heading text-3xl font-bold tracking-tight text-balance">{kase.title}</h1>
            <p className="mb-6 max-w-[68ch] text-lg text-muted-foreground">{kase.summary}</p>

            {cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/files/${cover.id}`}
                alt={kase.title}
                className="mb-8 h-auto w-full rounded-[10px] border border-border object-cover"
              />
            )}

            {kase.technologies.length > 0 && (
              <div className="mb-8 flex flex-wrap gap-1.5">
                {kase.technologies.map((t) => (
                  <span
                    key={t.id}
                    className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            )}

            {(kase.repoUrl || kase.liveUrl) && (
              <div className="mb-10 flex flex-wrap gap-3">
                {kase.liveUrl && (
                  <a
                    href={kase.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    {locale === "ru" ? "Открыть проект →" : "View live →"}
                  </a>
                )}
                {kase.repoUrl && (
                  <a
                    href={kase.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-[var(--brand-border-strong)] px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-accent"
                  >
                    {locale === "ru" ? "Исходный код →" : "Source code →"}
                  </a>
                )}
              </div>
            )}

            <MarkdownContent body={kase.body} />

            {gallery.length > 0 && (
              <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {gallery.map((file) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={file.id}
                    src={`/api/files/${file.id}`}
                    alt={kase.title}
                    className="h-32 w-full rounded-[8px] border border-border object-cover"
                  />
                ))}
              </div>
            )}
          </div>
        </article>
      </main>
      <SiteFooter dict={dict} />
    </div>
  );
}

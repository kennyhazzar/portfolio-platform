import type { Metadata } from "next";
import { getAbout } from "@/entities/about/api";
import { getSiteSetting } from "@/entities/site-setting/api";
import { getPublicFiles } from "@/entities/file/api";
import { getDictionary } from "@/shared/i18n/dictionary";
import { buildMetadata } from "@/shared/seo/metadata";
import { MarkdownContent } from "@/shared/ui/markdown-content";
import { SiteHeader } from "@/widgets/site-header";
import { SiteFooter } from "@/widgets/site-footer";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/middleware";

/** Not statically prerendered — see the same-named export in app/[locale]/page.tsx for why. */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = (await params) as { locale: SupportedLocale };
  const dict = getDictionary(locale);
  const siteSetting = await getSiteSetting(locale);
  const languageAlternates = Object.fromEntries(SUPPORTED_LOCALES.map((l) => [l, `/${l}/about`]));
  return buildMetadata({
    locale,
    siteSetting,
    title: dict.about.title,
    pathname: `/${locale}/about`,
    languageAlternates,
  });
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: SupportedLocale };
  const dict = getDictionary(locale);
  const about = await getAbout(locale);
  const files = about ? await getPublicFiles(about.id) : [];
  const photo = files.find((f) => f.type === "IMAGE") ?? null;
  const resume = files.find((f) => f.type === "DOCUMENT") ?? null;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader locale={locale} dict={dict} />
      <main className="flex-1">
        <section className="py-16">
          <div className="mx-auto max-w-[840px] px-7">
            <div className="mb-10 flex flex-wrap items-center gap-6">
              {photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/files/${photo.id}`}
                  alt={dict.about.title}
                  className="size-24 shrink-0 rounded-full border border-border object-cover"
                />
              )}
              <div className="flex flex-col gap-3">
                <h1 className="font-heading text-3xl font-bold tracking-tight">{dict.about.title}</h1>
                {resume && (
                  <a
                    href={`/api/files/${resume.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-fit rounded-full border border-[var(--brand-border-strong)] px-4 py-2 text-sm font-semibold transition-colors hover:bg-accent"
                  >
                    {locale === "ru" ? "Скачать резюме" : "Download résumé"}
                  </a>
                )}
              </div>
            </div>
            {about?.bio ? (
              <MarkdownContent body={about.bio} />
            ) : (
              <p className="text-sm text-muted-foreground">{dict.about.empty}</p>
            )}
          </div>
        </section>
      </main>
      <SiteFooter dict={dict} />
    </div>
  );
}

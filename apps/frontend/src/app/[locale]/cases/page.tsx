import type { Metadata } from "next";
import Link from "next/link";
import { getCases } from "@/entities/case/api";
import { getSiteSetting } from "@/entities/site-setting/api";
import { coversById } from "@/entities/file/covers-by-id";
import { getDictionary } from "@/shared/i18n/dictionary";
import { buildMetadata } from "@/shared/seo/metadata";
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
  const languageAlternates = Object.fromEntries(SUPPORTED_LOCALES.map((l) => [l, `/${l}/cases`]));
  return buildMetadata({
    locale,
    siteSetting,
    title: dict.cases.title,
    pathname: `/${locale}/cases`,
    languageAlternates,
  });
}

export default async function CasesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: SupportedLocale };
  const dict = getDictionary(locale);
  const { items: cases } = await getCases(locale);
  const covers = await coversById(cases.map((c) => c.id));

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader locale={locale} dict={dict} />
      <main className="flex-1">
        <section className="py-16">
          <div className="mx-auto max-w-[1120px] px-7">
            <h1 className="mb-10 font-heading text-3xl font-bold tracking-tight">{dict.cases.title}</h1>

            {cases.length === 0 ? (
              <p className="text-sm text-muted-foreground">{dict.cases.empty}</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cases.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/${locale}/cases/${c.slug}`}
                    className="flex flex-col gap-3.5 rounded-[10px] border border-border bg-card p-[22px] transition-all hover:-translate-y-0.5 hover:border-[var(--brand-accent-soft-border)]"
                  >
                    {covers[c.id] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/files/${covers[c.id]}`}
                        alt={c.title}
                        className="h-40 w-full rounded-[8px] object-cover"
                      />
                    )}
                    <div className="text-base font-bold">{c.title}</div>
                    <p className="flex-grow text-sm text-muted-foreground">{c.summary}</p>
                    {c.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {c.technologies.map((t) => (
                          <span
                            key={t.id}
                            className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
                          >
                            {t.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="font-mono text-[13px] text-primary">{dict.cases.readCase}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter dict={dict} />
    </div>
  );
}

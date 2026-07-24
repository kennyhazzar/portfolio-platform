import type { Metadata } from "next";
import Link from "next/link";
import { getPosts } from "@/entities/post/api";
import { getSiteSetting } from "@/entities/site-setting/api";
import { coversById } from "@/entities/file/covers-by-id";
import { getDictionary } from "@/shared/i18n/dictionary";
import { buildMetadata } from "@/shared/seo/metadata";
import { formatDate } from "@/shared/lib/format-date";
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
  const languageAlternates = Object.fromEntries(SUPPORTED_LOCALES.map((l) => [l, `/${l}/posts`]));
  return buildMetadata({
    locale,
    siteSetting,
    title: dict.posts.title,
    pathname: `/${locale}/posts`,
    languageAlternates,
  });
}

export default async function PostsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: SupportedLocale };
  const dict = getDictionary(locale);
  const { items: posts } = await getPosts(locale);
  const covers = await coversById(posts.map((p) => p.id));

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader locale={locale} dict={dict} />
      <main className="flex-1">
        <section className="py-16">
          <div className="mx-auto max-w-[1120px] px-7">
            <h1 className="mb-10 font-heading text-3xl font-bold tracking-tight">{dict.posts.title}</h1>

            {posts.length === 0 ? (
              <p className="text-sm text-muted-foreground">{dict.posts.empty}</p>
            ) : (
              <div className="flex flex-col">
                {posts.map((post, i) => (
                  <Link
                    key={post.slug}
                    href={`/${locale}/posts/${post.slug}`}
                    className={`group grid grid-cols-1 items-baseline gap-1 py-5 sm:grid-cols-[108px_1fr_auto] sm:gap-6 ${
                      i > 0 ? "border-t border-border" : ""
                    }`}
                  >
                    <div className="pt-0.5 font-mono text-xs text-[var(--brand-text-faint)] tabular-nums">
                      {formatDate(post.publishedAt, locale)}
                    </div>
                    <div className="flex items-start gap-4">
                      {covers[post.id] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/files/${covers[post.id]}`}
                          alt={post.title}
                          className="h-16 w-16 shrink-0 rounded-[8px] object-cover"
                        />
                      )}
                      <div className="flex flex-col gap-1.5">
                        <div className="text-base font-semibold group-hover:text-primary">{post.title}</div>
                        <div className="max-w-[62ch] text-sm text-muted-foreground">{post.excerpt}</div>
                      </div>
                    </div>
                    <div className="hidden font-mono text-sm text-[var(--brand-text-faint)] transition-all group-hover:translate-x-0.5 group-hover:text-primary sm:block">
                      →
                    </div>
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

import type { Metadata } from 'next';
import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';
import { getPostBySlug } from '@/entities/post/api';
import { getPostPreviewBySlug } from '@/entities/post/admin-api';
import { getComments } from '@/entities/comment/api';
import { getPublicCover } from '@/entities/file/api';
import { getSiteSetting } from '@/entities/site-setting/api';
import { getDictionary } from '@/shared/i18n/dictionary';
import { buildMetadata } from '@/shared/seo/metadata';
import { formatDate } from '@/shared/lib/format-date';
import { MarkdownContent } from '@/shared/ui/markdown-content';
import { ViewBeacon } from '@/shared/ui/view-beacon';
import { SiteHeader } from '@/widgets/site-header';
import { SiteFooter } from '@/widgets/site-footer';
import { CommentSection } from '@/widgets/comment-section';
import { ExitPreviewBanner } from '@/widgets/exit-preview-banner';
import type { SupportedLocale } from '@/middleware';

interface RouteParams {
  locale: string;
  slug: string;
}

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { locale, slug } = (await params) as { locale: SupportedLocale; slug: string };
  const { isEnabled: isPreview } = await draftMode();
  const [post, siteSetting] = await Promise.all([
    isPreview ? getPostPreviewBySlug(slug, locale) : getPostBySlug(slug, locale),
    getSiteSetting(locale),
  ]);
  if (!post) return {};

  return buildMetadata({
    locale,
    siteSetting,
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt,
    pathname: `/${locale}/posts/${slug}`,
  });
}

export default async function PostDetailPage({ params }: { params: Promise<RouteParams> }) {
  const { locale, slug } = (await params) as { locale: SupportedLocale; slug: string };
  const dict = getDictionary(locale);
  const { isEnabled: isPreview } = await draftMode();
  const post = isPreview ? await getPostPreviewBySlug(slug, locale) : await getPostBySlug(slug, locale);
  if (!post) notFound();
  const [comments, cover] = await Promise.all([getComments(slug, locale), getPublicCover(post.id)]);

  return (
    <div className="flex min-h-screen flex-col">
      {isPreview ? (
        <ExitPreviewBanner locale={locale} pathname={`/${locale}/posts/${slug}`} />
      ) : (
        <ViewBeacon type="post" slug={slug} locale={locale} />
      )}
      <SiteHeader locale={locale} dict={dict} />
      <main className="flex-1">
        <article className="py-16">
          <div className="mx-auto max-w-[840px] px-7">
            <div className="mb-3 font-mono text-xs text-[var(--brand-text-faint)] tabular-nums">
              {formatDate(post.publishedAt, locale)}
            </div>
            <h1 className="mb-4 font-heading text-3xl font-bold tracking-tight text-balance">{post.title}</h1>
            <p className="mb-6 max-w-[68ch] text-lg text-muted-foreground">{post.excerpt}</p>

            {cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/files/${cover.id}`}
                alt={post.title}
                className="mb-8 h-auto w-full rounded-[10px] border border-border object-cover"
              />
            )}

            <MarkdownContent body={post.body} />
          </div>
        </article>

        <CommentSection slug={slug} targetType="post" locale={locale} dict={dict} initialComments={comments} />
      </main>
      <SiteFooter dict={dict} />
    </div>
  );
}

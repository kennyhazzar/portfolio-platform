import Link from "next/link";
import type { Dictionary } from "@/shared/i18n/dictionary";
import type { SupportedLocale } from "@/middleware";
import { formatDate } from "@/shared/lib/format-date";

interface PostItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  publishedAt?: string;
}

export function PostListSection({
  posts,
  coversById = {},
  locale,
  dict,
}: {
  posts: PostItem[];
  coversById?: Record<string, string | undefined>;
  locale: SupportedLocale;
  dict: Dictionary;
}) {
  return (
    <section id="posts" className="border-b border-border py-16">
      <div className="mx-auto max-w-[1120px] px-7">
        <div className="mb-7 flex items-baseline justify-between gap-5">
          <h2 className="font-heading text-2xl font-bold tracking-tight">{dict.posts.title}</h2>
          {posts.length > 0 && (
            <Link href={`/${locale}/posts`} className="text-sm text-muted-foreground hover:text-primary">
              {dict.posts.viewAll}
            </Link>
          )}
        </div>

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
                  {coversById[post.id] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/files/${coversById[post.id]}`}
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
  );
}

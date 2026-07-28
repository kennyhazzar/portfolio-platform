import Link from 'next/link';
import { getCommentsAdmin } from '@/entities/comment/admin-api';
import { getCasesAdmin } from '@/entities/case/admin-api';
import { getPostsAdmin } from '@/entities/post/admin-api';
import { CommentModerationQueue } from '@/widgets/admin/comment-moderation-queue';

const STATUSES = [
  { value: 'PENDING', label: 'На модерации' },
  { value: 'APPROVED', label: 'Одобрены' },
  { value: 'REJECTED', label: 'Отклонены' },
  { value: 'SPAM', label: 'Спам' },
] as const;

type StatusValue = (typeof STATUSES)[number]['value'];

export default async function AdminCommentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: rawStatus } = await searchParams;
  const status: StatusValue = STATUSES.some((s) => s.value === rawStatus) ? (rawStatus as StatusValue) : 'PENDING';

  const [{ items: comments }, posts, cases] = await Promise.all([
    getCommentsAdmin(status),
    getPostsAdmin(),
    getCasesAdmin(),
  ]);

  const postsById = Object.fromEntries(posts.map((post) => [post.id, { title: post.title, slug: post.slug }]));
  const casesById = Object.fromEntries(
    cases.map((kase) => {
      const translation = kase.translations.find((item) => item.locale === 'ru') ?? kase.translations[0];
      return [kase.id, { title: translation?.title ?? kase.id, slug: translation?.slug ?? '' }];
    }),
  );

  return (
    <div className="mx-auto max-w-[840px] px-5 py-8 sm:px-7 sm:py-16">
      <h1 className="mb-7 text-2xl font-bold tracking-tight">Комментарии</h1>

      <div className="mb-7 flex w-fit gap-0.5 rounded-full border border-border p-0.5 text-xs">
        {STATUSES.map((s) => (
          <Link
            key={s.value}
            href={`/admin/comments?status=${s.value}`}
            className={`rounded-full px-3 py-1.5 font-semibold transition-colors ${
              status === s.value ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <CommentModerationQueue key={status} initial={comments} postsById={postsById} casesById={casesById} />
    </div>
  );
}
